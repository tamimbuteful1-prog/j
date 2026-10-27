import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ep, P} from './paths.ts';
import {loadConfig, subjectOf} from './config.ts';
import {ContractError, readContract, writeJson} from './contracts.ts';
import {getTask, logEvent, openDb, updateTask, type Task} from './db.ts';
import {assertTransition, revisionTarget, type State} from './states.ts';
import {appendHistory, clearAction, patchMeta, readMeta, scaffoldEpisode, setAction} from './episode.ts';
import {mediaStatus, prepareMedia} from './media.ts';
import {renderEpisode, resolveEpisode, stillsAt, technicalQA} from './render.ts';
import {appendMemory} from './memory.ts';
import type {AgentRunner} from './agents.ts';

export type StepCtx = {runner: AgentRunner; owner: string};
export type StepOutcome = {to: State; reason: string; resume?: State | null; blocked?: string | null; delayMs?: number; failure?: boolean};

type Finding = {id: string; owner: 'writer' | 'motion' | 'assembly' | 'human'; severity: string; problem: string; fix: string};
type Review = {verdict: 'pass' | 'revise' | 'blocked'; summary: string; findings: Finding[]};

const rel = (f: string) => path.relative(P.root, f);

// ─────────────────────────────────────────────────────────────── prompts
const files = (id: string) => {
  const e = ep(id);
  return {
    ref: rel(path.join(e.source, 'lesson_reference.json')),
    analysis: rel(path.join(e.research, 'lesson_analysis.json')),
    ideas: rel(path.join(e.research, 'idea_candidates.json')),
    script: rel(path.join(e.script, 'script.json')),
    scriptMd: rel(path.join(e.script, 'script.md')),
    sheet: rel(path.join(e.voice, 'RECORDING_SHEET.md')),
    storyboard: rel(path.join(e.script, 'storyboard.json')),
    engineDir: rel(e.engineDir),
    preview: rel(path.join(e.motion, 'preview.mp4')),
    final: rel(path.join(e.final, 'final.mp4')),
    plan: rel(path.join(e.final, 'assembly_plan.json')),
    timeline: rel(path.join(e.final, 'timeline.json')),
    quality: rel(e.quality),
  };
};

/** Findings addressed to `owner` from the most recent reviews — the only feedback an agent receives. */
const feedbackFor = (id: string, owner: Finding['owner']) => {
  const dir = ep(id).quality;
  if (!fs.existsSync(dir)) return '';
  const reviews = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('_review.json'))
    .map((f) => ({f, r: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as Review & {round?: number}}))
    .filter(({r}) => r.verdict !== 'pass');
  const items = reviews.flatMap(({f, r}) => r.findings.filter((x) => x.owner === owner).map((x) => `- [${f} · ${x.id} · ${x.severity}] ${x.problem} → FIX: ${x.fix}`));
  return items.length ? `\n\nREVISION — fix exactly these findings (and nothing else that already works):\n${items.join('\n')}\nRecord what you changed in the revision_log.` : '';
};

const prompt = {
  research: (id: string) => {
    const f = files(id);
    return `Stage RESEARCHING for ${id}.
Read ${f.ref} (lesson + book file + pages). Extract the lesson pages from the PDF (pdftotext -f/-l, and pdftoppm -r 110 -png to LOOK at pages whose figures/tables/equations matter).
Read memory/creative-memory.jsonl.
Produce, following the manhaji-writer skill (phases 1–2):
  1) ${f.analysis}  (contract contracts/lesson_analysis.schema.json)
  2) ${f.ideas}     (contract contracts/idea_candidates.schema.json, ≥5 ideas)
If an essential page is unreadable or the lesson is not where the reference says, write lesson_analysis with status "blocked" and return status "blocked".`;
  },
  write: (id: string) => {
    const f = files(id);
    return `Stage WRITING for ${id}.
Inputs: ${f.ref}, ${f.analysis}, ${f.ideas}, memory/creative-memory.jsonl.
Following the manhaji-writer skill (phases 3–7), produce:
  1) ${f.script}   (contract contracts/script.schema.json; approval.status = "draft"; stable line ids)
  2) ${f.scriptMd} (human-readable)
  3) ${f.sheet}    (recording sheet for the presenter; hook lines are performed in the Higgsfield video, not in the sheet table)
Run every script test and record honest evidence.${feedbackFor(id, 'writer')}`;
  },
  scriptQA: (id: string, round: number) => {
    const f = files(id);
    return `Stage SCRIPT_QA (round ${round}) for ${id}.
Review ${f.script} against the textbook pages in ${f.ref}, ${f.analysis}, ${f.ideas} and memory/creative-memory.jsonl.
Run Educational QA + Editorial QA from the manhaji-quality skill. Verify every locked fact on its page.
Write ${f.quality}/script_qa_review.json (contract contracts/qa_review.schema.json, stage "script_qa", round ${round}).`;
  },
  storyboard: (id: string) => {
    const f = files(id);
    return `Stage STORYBOARD for ${id}.
Inputs: ${f.script} (approved), ${f.analysis}, memory/creative-memory.jsonl, the engine (engine/src/kit, engine/src/worlds) and the reference episode ../manhaji-logic.
Following the manhaji-motion skill (phases 1–3), write ${f.storyboard} (contract contracts/storyboard.schema.json).
Every beat anchors to a script line id (or scene) — never to raw seconds. Beat names are unique in the episode.
Check it resolves: npm run studio -- resolve ${id} preview${feedbackFor(id, 'motion')}`;
  },
  produce: (id: string) => {
    const f = files(id);
    return `Stage PRODUCING for ${id}.
Implement the storyboard ${f.storyboard} as real Remotion scenes in ${f.engineDir}/ following the manhaji-motion skill (phases 4–8) and engine/ENGINE.md:
  - ${f.engineDir}/index.ts exports \`episode: EpisodeModule\` (id, meta, scenes{S01…}, optional HookOverlay, previewTimeline from ./timeline.preview.json)
  - one file per scene; all timing through useScene().beat()/line() — no hard-coded seconds for spoken moments.
Then: run \`npm run studio -- resolve ${id} preview\`, \`cd engine && npx tsc --noEmit\`, render stills at your key beats (npm run stills -- ${id} <seconds…>) and LOOK at them. Fix what you see.
Write ${rel(ep(id).motion)}/self_check.json listing what you checked and fixed.${feedbackFor(id, 'motion')}`;
  },
  motionQA: (id: string, round: number) => {
    const f = files(id);
    return `Stage MOTION_QA (round ${round}) for ${id}.
Review the motion preview ${f.preview} (estimated timing — the voice-over is not recorded yet) against ${f.storyboard} and ${f.script}.
Automatic technical report: ${f.quality}/technical_auto.preview.json. Stills at every beat: ${f.quality}/stills/preview/ — LOOK at them; render more if needed (npm run stills).
Run Visual QA + Technical QA (+ any educational issue on screen) from the manhaji-quality skill.
Write ${f.quality}/motion_qa_review.json (stage "motion_qa", round ${round}).`;
  },
  assemble: (id: string) => {
    const f = files(id);
    return `Stage ASSEMBLING for ${id}.
The deterministic media tool already ran and wrote ${f.plan} (hook probe + speech windows, conformed voice-over per line, issues).
Following the manhaji-assembly skill: check the hook against the script hook text (stills of production/public/hook.mp4 + speech windows).
Set hook.trim_start_sec (cut any greeting/false start before the script hook), hook.trim_end_sec if needed, and hook.key_word_sec (the moment right after the key word «${'${KEY}'}», or null if not certain).
Verify the voice-over lines map 1:1 to the script lines and durations are sane. Edit ONLY those judgement fields + agent_notes in ${f.plan}.
If a recording is missing/wrong, return "blocked" with the exact lines to re-record.${feedbackFor(id, 'assembly')}`;
  },
  syncCheck: (id: string) => {
    const f = files(id);
    return `Stage FINAL_RENDER sync check for ${id}.
Final film: ${f.final}. Resolved timeline (absolute seconds of every line/beat): ${f.timeline}. Stills: ${f.quality}/stills/final/.
LOOK at the stills at key beats: motion lands on the spoken word, captions match speech, nothing covers the face or caption band, ending not cut.
Write ${rel(ep(id).final)}/sync_check.json {ok, checked:[{beat, sec, note}], problems:[…]}.
Return "done" only if everything is in sync. If you fixed drift by editing beat offsets in ${f.storyboard}, return "failed" with summary "offsets adjusted" (the studio re-renders and you check again). Return "blocked" for problems that need the motion agent.`;
  },
  finalQA: (id: string, round: number) => {
    const f = files(id);
    return `Stage FINAL_QA (round ${round}) for ${id}.
Review the final film ${f.final} with all four checks (educational, editorial, visual, technical) from the manhaji-quality skill.
Inputs: ${f.script}, ${f.storyboard}, ${f.timeline}, ${f.plan}, ${rel(ep(id).final)}/sync_check.json, ${f.quality}/technical_auto.final.json, stills in ${f.quality}/stills/final/ (LOOK at them; render more as needed).
Write ${f.quality}/final_qa_review.json (stage "final_qa", round ${round}). If pass, also write ${f.quality}/final_report.md.`;
  },
};

// ─────────────────────────────────────────────────────────────── helpers
const runAgent = async (ctx: StepCtx, t: Task, role: Parameters<AgentRunner>[0]['role'], text: string) => {
  const r = await ctx.runner({role, episodeId: t.episode_id, stage: t.state, prompt: text});
  logEvent(t.episode_id, 'agent_result', {role, stage: t.state, ...r});
  return r;
};

const fail = (reason: string, delayMs = 120_000): StepOutcome => ({to: '__STAY__' as State, reason, failure: true, delayMs});

const blocked = (t: Task, reason: string, resume: State): StepOutcome => ({to: 'BLOCKED', reason, blocked: reason, resume});

const readReview = (id: string, name: string) => readContract<Review>('qa_review', path.join(ep(id).quality, `${name}_review.json`));

/** Route a non-pass review to the owning stage (or to a human). */
const routeReview = (t: Task, stage: string, rv: Review, afterRecording: boolean): StepOutcome => {
  const cfg = loadConfig();
  const round = (t.rounds[stage] ?? 0) + 1;
  if (rv.verdict === 'blocked' || rv.findings.some((f) => f.owner === 'human' && f.severity !== 'minor')) {
    const why = rv.findings.filter((f) => f.owner === 'human').map((f) => `${f.problem} → ${f.fix}`).join('\n') || rv.summary;
    return blocked(t, `QA (${stage}) needs a human decision:\n${why}`, t.state);
  }
  if (round > cfg.retries.max_revision_rounds_per_stage) return blocked(t, `QA (${stage}) still failing after ${round - 1} revision rounds:\n${rv.summary}`, t.state);
  const blocking = rv.findings.filter((f) => f.severity !== 'minor');
  const owners = new Set(blocking.map((f) => f.owner as 'writer' | 'motion' | 'assembly'));
  if (afterRecording && owners.has('writer')) return blocked(t, `the final QA asks for a script change after recording — decide whether to re-record:\n${blocking.filter((f) => f.owner === 'writer').map((f) => f.problem).join('\n')}`, t.state);
  // earliest owner wins: writer < motion < assembly
  const target = owners.has('writer') ? revisionTarget('writer', afterRecording) : owners.has('motion') ? revisionTarget('motion', afterRecording) : revisionTarget('assembly', afterRecording);
  return {to: 'REVISION_REQUIRED', resume: target, reason: `${stage} round ${round}: ${blocking.length} finding(s) → ${target}`};
};

const markScriptApproved = (id: string, by: string) => {
  const file = path.join(ep(id).script, 'script.json');
  const s = JSON.parse(fs.readFileSync(file, 'utf8'));
  s.approval = {status: 'approved', by, at: new Date().toISOString()};
  writeJson(file, s);
  requestRecording(id);
};

export const requestRecording = (id: string) => {
  const f = files(id);
  setAction(
    id,
    'سجّل الهوك والفويس أوفر',
    `النص معتمد ✓ — الموشن جرافيك يُنتج الآن بالتوازي.\n\n1. **الهوك:** صوّر نص الهوك (قسم الهوك في \`${f.scriptMd}\`) وعدّله في Higgsfield، ثم ضعه في \`${rel(ep(id).hook)}/hook.mp4\`.\n2. **الفويس أوفر:** سجّل حسب \`${f.sheet}\` وضع الملفات في \`${rel(ep(id).voice)}/\`.\n\nبعد رفع الملفات يكمل النظام التركيب تلقائيًا.`,
  );
};

const ensureRef = (id: string) => {
  const file = path.join(ep(id).source, 'lesson_reference.json');
  if (fs.existsSync(file)) return readContract('lesson_reference', file);
  const l = openDb().prepare('SELECT * FROM lessons WHERE episode_id = ?').get(id) as Record<string, string | number> | undefined;
  if (!l) throw new Error(`no lesson_reference.json and no indexed lesson for ${id}`);
  const book = openDb().prepare('SELECT * FROM books WHERE id = ?').get(l.book_id) as {id: string; file: string};
  const {subject, gradeInfo} = subjectOf(id);
  const ref = {
    episode_id: id,
    subject: subject.name_ar,
    grade: gradeInfo.name_ar,
    semester: String(l.semester ?? ''),
    unit: String(l.unit),
    unit_title: String(l.unit_title ?? ''),
    lesson: String(l.lesson),
    title: String(l.title),
    book: {id: book.id, file: book.file, pages: [Number(l.page_from), Number(l.page_to)]},
  };
  writeJson(file, ref);
  return ref;
};

// ─────────────────────────────────────────────────────────────── stages
export const step = async (t: Task, ctx: StepCtx): Promise<StepOutcome> => {
  const id = t.episode_id;
  const cfg = loadConfig();
  const round = (stage: string) => (t.rounds[stage] ?? 0) + 1;
  try {
    switch (t.state) {
      case 'QUEUED': {
        scaffoldEpisode(id);
        ensureRef(id);
        return {to: 'RESEARCHING', reason: 'scaffolded'};
      }
      case 'RESEARCHING': {
        const r = await runAgent(ctx, t, 'writer', prompt.research(id));
        if (r.status === 'blocked') return blocked(t, r.blocked_reason ?? r.summary, 'RESEARCHING');
        if (r.status === 'failed') return fail(r.summary);
        const a = readContract<{status: string; blocked_reason?: string}>('lesson_analysis', path.join(ep(id).research, 'lesson_analysis.json'));
        if (a.status === 'blocked') return blocked(t, a.blocked_reason ?? 'lesson analysis blocked', 'RESEARCHING');
        readContract('idea_candidates', path.join(ep(id).research, 'idea_candidates.json'));
        return {to: 'WRITING', reason: 'analysis + ideas ready'};
      }
      case 'WRITING': {
        const r = await runAgent(ctx, t, 'writer', prompt.write(id));
        if (r.status === 'blocked') return blocked(t, r.blocked_reason ?? r.summary, 'WRITING');
        if (r.status === 'failed') return fail(r.summary);
        readContract('script', path.join(ep(id).script, 'script.json'));
        if (!fs.existsSync(path.join(ep(id).voice, 'RECORDING_SHEET.md'))) return fail('RECORDING_SHEET.md missing');
        return {to: 'SCRIPT_QA', reason: 'script written'};
      }
      case 'SCRIPT_QA': {
        const r = await runAgent(ctx, t, 'quality', prompt.scriptQA(id, round('script_qa')));
        if (r.status === 'failed') return fail(r.summary);
        const rv = readReview(id, 'script_qa');
        if (rv.verdict === 'pass') {
          if (cfg.approvals.require_script_approval) {
            setAction(id, 'اعتمد النص', `راجع \`${files(id).scriptMd}\` ثم:\n\n\`npm run studio -- approve ${id} script\`\n\nأو ارفضه بملاحظات:\n\n\`npm run studio -- reject ${id} script "ملاحظاتك"\``);
            return {to: 'AWAITING_SCRIPT_APPROVAL', reason: 'script passed QA'};
          }
          markScriptApproved(id, 'studio-auto');
          return {to: 'STORYBOARD', reason: 'script passed QA (auto-approved)'};
        }
        return routeReview(t, 'script_qa', rv, false);
      }
      case 'STORYBOARD': {
        const r = await runAgent(ctx, t, 'motion', prompt.storyboard(id));
        if (r.status === 'blocked') return blocked(t, r.blocked_reason ?? r.summary, 'STORYBOARD');
        if (r.status === 'failed') return fail(r.summary);
        readContract('storyboard', path.join(ep(id).script, 'storyboard.json'));
        const tl = resolveEpisode(id, 'preview');
        const hard = tl.warnings.filter((w) => /not used|more than one|unknown/.test(w));
        if (hard.length) return fail(`storyboard does not resolve cleanly: ${hard.join('; ')}`, 1000);
        return {to: 'PRODUCING', reason: `storyboard: ${tl.scenes.length} scenes, ~${tl.totalSec.toFixed(1)}s`};
      }
      case 'PRODUCING': {
        const r = await runAgent(ctx, t, 'motion', prompt.produce(id));
        if (r.status === 'blocked') return blocked(t, r.blocked_reason ?? r.summary, 'PRODUCING');
        if (r.status === 'failed') return fail(r.summary);
        resolveEpisode(id, 'preview');
        const tsc = spawnSync('npx', ['tsc', '--noEmit'], {cwd: P.engine, encoding: 'utf8'});
        if (tsc.status !== 0) return fail(`engine typecheck failed:\n${tsc.stdout.slice(-2000)}`, 1000);
        return {to: 'RENDERING', reason: 'scenes implemented'};
      }
      case 'RENDERING': {
        const {file, timeline} = await renderEpisode(id, 'preview', ctx.owner);
        const tech = technicalQA(file, timeline.totalSec, 'preview');
        writeJson(path.join(ep(id).quality, 'technical_auto.preview.json'), tech);
        const marks = [...new Set([...Object.values(timeline.beats), ...timeline.scenes.map((s) => (s.start + s.end) / 2)])].sort((a, b) => a - b);
        stillsAt(file, marks, path.join(ep(id).quality, 'stills', 'preview'));
        patchMeta(id, {outputs: {...readMeta(id).outputs, preview: rel(file)}});
        return {to: 'MOTION_QA', reason: `preview rendered (${tech.ok ? 'tech ok' : 'tech issues'})`};
      }
      case 'MOTION_QA': {
        const r = await runAgent(ctx, t, 'quality', prompt.motionQA(id, round('motion_qa')));
        if (r.status === 'failed') return fail(r.summary);
        const rv = readReview(id, 'motion_qa');
        if (rv.verdict === 'pass') return {to: 'AWAITING_MEDIA', reason: 'motion passed QA'};
        return routeReview(t, 'motion_qa', rv, false);
      }
      case 'AWAITING_MEDIA': {
        const m = mediaStatus(id);
        if (!m.ready) return {to: 'AWAITING_MEDIA', reason: 'waiting for hook/voice-over', delayMs: 60_000};
        return {to: 'ASSEMBLING', reason: 'hook + voice-over received'};
      }
      case 'ASSEMBLING': {
        const plan = prepareMedia(id);
        const blockers = plan.issues.filter((i) => i.severity === 'blocker');
        if (blockers.length) {
          setAction(id, 'مشكلة في الملفات المرفوعة', blockers.map((b) => `- ${b.message}`).join('\n') + `\n\nبعد التصحيح: \`npm run studio -- retry ${id}\``);
          return blocked(t, blockers.map((b) => b.message).join('; '), 'ASSEMBLING');
        }
        const s = readContract<{hook: {key_word: string}}>('script', path.join(ep(id).script, 'script.json'));
        const r = await runAgent(ctx, t, 'assembly', prompt.assemble(id).replace('${KEY}', s.hook.key_word));
        if (r.status === 'blocked') {
          setAction(id, 'إعادة تسجيل مطلوبة', `${r.blocked_reason ?? r.summary}\n\nبعد التصحيح: \`npm run studio -- retry ${id}\``);
          return blocked(t, r.blocked_reason ?? r.summary, 'ASSEMBLING');
        }
        if (r.status === 'failed') return fail(r.summary);
        readContract('assembly_plan', path.join(ep(id).final, 'assembly_plan.json'));
        clearAction(id);
        return {to: 'FINAL_RENDER', reason: 'media conformed and planned'};
      }
      case 'FINAL_RENDER': {
        const {file, timeline} = await renderEpisode(id, 'final', ctx.owner);
        const tech = technicalQA(file, timeline.totalSec, 'final');
        writeJson(path.join(ep(id).quality, 'technical_auto.final.json'), tech);
        const marks = [...new Set([...Object.values(timeline.beats), ...timeline.lines.map((l) => l.start + 0.2), timeline.hook.keyWordSec ?? 0.5])].sort((a, b) => a - b);
        stillsAt(file, marks, path.join(ep(id).quality, 'stills', 'final'));
        const r = await runAgent(ctx, t, 'assembly', prompt.syncCheck(id));
        if (r.status === 'failed') return fail(r.summary);
        if (r.status === 'blocked') return {to: 'REVISION_REQUIRED', resume: 'PRODUCING', reason: `sync check: ${r.blocked_reason ?? r.summary}`};
        patchMeta(id, {outputs: {...readMeta(id).outputs, final: rel(file)}});
        return {to: 'FINAL_QA', reason: `final rendered ${timeline.totalSec.toFixed(1)}s (${tech.ok ? 'tech ok' : 'tech issues'})`};
      }
      case 'FINAL_QA': {
        const r = await runAgent(ctx, t, 'quality', prompt.finalQA(id, round('final_qa')));
        if (r.status === 'failed') return fail(r.summary);
        const rv = readReview(id, 'final_qa');
        if (rv.verdict === 'pass') {
          if (cfg.approvals.require_final_approval) {
            setAction(id, 'اعتمد الحلقة النهائية', `شاهد \`${files(id).final}\` ثم:\n\n\`npm run studio -- approve ${id} final\`\n\nأو: \`npm run studio -- reject ${id} final "ملاحظاتك"\``);
            return {to: 'AWAITING_FINAL_APPROVAL', reason: 'final passed QA'};
          }
          return complete(id, 'studio-auto');
        }
        return routeReview(t, 'final_qa', rv, true);
      }
      case 'REVISION_REQUIRED': {
        if (!t.resume_state) return blocked(t, 'revision without target', 'QUEUED');
        return {to: t.resume_state, reason: 'revision dispatched'};
      }
      default:
        return {to: t.state, reason: `nothing to do in ${t.state}`, delayMs: 60_000};
    }
  } catch (e) {
    if (e instanceof ContractError) return fail(e.message, 1000);
    return fail((e as Error).stack ?? String(e));
  }
};

export const complete = (id: string, by: string): StepOutcome => {
  patchMeta(id, {completed_at: new Date().toISOString(), approved_by: by});
  appendMemory(id);
  clearAction(id);
  return {to: 'COMPLETED', reason: `completed (approved by ${by})`};
};

/** Apply a step outcome durably (state + history + counters). */
export const commit = (t: Task, o: StepOutcome) => {
  const cfg = loadConfig();
  if (o.failure) {
    const failures = t.failures + 1;
    logEvent(t.episode_id, 'step_failed', {state: t.state, failures, reason: o.reason.slice(0, 4000)});
    if (failures > cfg.retries.max_agent_failures) {
      appendHistory(t.episode_id, t.state, 'FAILED', o.reason.slice(0, 500));
      setAction(t.episode_id, 'فشل الإنتاج', `المرحلة ${t.state} فشلت ${failures} مرات.\n\n\`\`\`\n${o.reason.slice(0, 1500)}\n\`\`\`\n\nبعد المعالجة: \`npm run studio -- retry ${t.episode_id}\``);
      return updateTask(t.episode_id, {state: 'FAILED', resume_state: t.state, failures, blocked_reason: o.reason.slice(0, 2000), not_before: null});
    }
    return updateTask(t.episode_id, {failures, not_before: Date.now() + (o.delayMs ?? 120_000)});
  }
  if (o.to === t.state) return updateTask(t.episode_id, {not_before: o.delayMs ? Date.now() + o.delayMs : null});
  assertTransition(t.state, o.to);
  const rounds = {...t.rounds};
  const stageOf: Partial<Record<State, string>> = {SCRIPT_QA: 'script_qa', MOTION_QA: 'motion_qa', FINAL_QA: 'final_qa'};
  if (o.to === 'REVISION_REQUIRED' && stageOf[t.state]) rounds[stageOf[t.state]!] = (rounds[stageOf[t.state]!] ?? 0) + 1;
  const revision = o.to === 'REVISION_REQUIRED' ? t.revision + 1 : t.revision;
  appendHistory(t.episode_id, t.state, o.to, o.reason.slice(0, 500));
  if (o.to === 'REVISION_REQUIRED') patchMeta(t.episode_id, {revision});
  logEvent(t.episode_id, 'transition', {from: t.state, to: o.to, reason: o.reason.slice(0, 500)});
  const next = updateTask(t.episode_id, {
    state: o.to,
    resume_state: o.resume ?? (o.to === 'BLOCKED' ? t.state : null),
    blocked_reason: o.blocked ?? null,
    failures: 0,
    rounds,
    revision,
    not_before: o.delayMs ? Date.now() + o.delayMs : null,
  });
  if (o.to === 'BLOCKED') setAction(t.episode_id, 'متوقف — يحتاج قرارك', `${o.blocked}\n\nبعد المعالجة: \`npm run studio -- retry ${t.episode_id}\``);
  return next;
};

// ─────────────────────────────────────────────────────────────── human actions
export const approve = (id: string, what: 'script' | 'final', by = 'presenter') => {
  const t = getTask(id);
  if (!t) throw new Error(`no task ${id}`);
  if (what === 'script') {
    if (t.state !== 'AWAITING_SCRIPT_APPROVAL') throw new Error(`${id} is ${t.state}, not awaiting script approval`);
    markScriptApproved(id, by);
    return commit(t, {to: 'STORYBOARD', reason: `script approved by ${by}`});
  }
  if (t.state !== 'AWAITING_FINAL_APPROVAL') throw new Error(`${id} is ${t.state}, not awaiting final approval`);
  return commit(t, complete(id, by));
};

export const reject = (id: string, what: 'script' | 'final', notes: string) => {
  const t = getTask(id);
  if (!t) throw new Error(`no task ${id}`);
  const expected = what === 'script' ? 'AWAITING_SCRIPT_APPROVAL' : 'AWAITING_FINAL_APPROVAL';
  if (t.state !== expected) throw new Error(`${id} is ${t.state}, not ${expected}`);
  const owner = what === 'script' ? 'writer' : 'motion';
  writeJson(path.join(ep(id).quality, `human_${what}_review.json`), {
    episode_id: id,
    stage: what === 'script' ? 'script_qa' : 'final_qa',
    verdict: 'revise',
    summary: `Presenter feedback`,
    findings: [{id: 'H1', check: 'editorial', severity: 'major', location: {}, problem: notes, fix: notes, owner}],
  });
  clearAction(id);
  return commit(t, {to: 'REVISION_REQUIRED', resume: what === 'script' ? 'WRITING' : 'PRODUCING', reason: `rejected by presenter: ${notes.slice(0, 200)}`});
};

export const retry = (id: string) => {
  const t = getTask(id);
  if (!t) throw new Error(`no task ${id}`);
  if (t.state !== 'BLOCKED' && t.state !== 'FAILED') throw new Error(`${id} is ${t.state}; only BLOCKED/FAILED can be retried`);
  const to = t.resume_state ?? 'QUEUED';
  clearAction(id);
  appendHistory(id, t.state, to, 'retry requested');
  return updateTask(id, {state: to, blocked_reason: null, failures: 0, not_before: null});
};
