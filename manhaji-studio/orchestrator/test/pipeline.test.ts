import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// isolated DB; episodes use a reserved test unit (U99) and are removed afterwards
process.env.MANHAJI_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'manhaji-')), 'test.db');
const {openDb, insertTask, getTask, claimNext, updateTask, closeDb} = await import('../src/db.ts');
const {step, commit, approve, retry} = await import('../src/pipeline.ts');
const {ep} = await import('../src/paths.ts');
const {RUNNABLE, canTransition} = await import('../src/states.ts');
import type {AgentRunner, AgentCall} from '../src/agents.ts';

const ID = 'MATH-G10-U99-L01-TEST';
const fx = (f: string) => fs.readFileSync(path.join(import.meta.dirname, 'fixtures', 'smoke', f), 'utf8').replaceAll('MATH-G10-U00-L00-SMOKE', ID);

/** Stub agents that write contract-valid artifacts — exercises the orchestrator, not the AI. */
const scripted = (opts: {scriptQA?: ('pass' | 'revise')[]}): AgentRunner & {calls: AgentCall[]} => {
  const qa = [...(opts.scriptQA ?? ['pass'])];
  const calls: AgentCall[] = [];
  const runner = (async (c: AgentCall) => {
    calls.push(c);
    const e = ep(ID);
    if (c.stage === 'RESEARCHING') {
      fs.writeFileSync(path.join(e.research, 'lesson_analysis.json'), JSON.stringify({
        episode_id: ID, status: 'ok', meta: {subject: 'm', grade: 'g', unit: '99', lesson: '01', official_title: 't'},
        objectives: [], terms: [], rules: [], misconceptions: [], difficulty_point: 'x', core_concept: 'x',
        learning_gap: {before: 'لا يفرق بين و و أو', after: 'يحكم على صحة العبارة المركبة'},
      }));
      const idea = (i: number) => ({id: `I${i}`, situation: 's', confusion: 'c', relation: 'r', appeal: 'a', visual_potential: 'v', accuracy_check: 'ok', accuracy_veto: false, memory_conflicts: [], scores: {relation: 25, proximity: 20, clarity: 18, motion: 13, originality: 8, total: 84}});
      fs.writeFileSync(path.join(e.research, 'idea_candidates.json'), JSON.stringify({episode_id: ID, concept_essence: 'جوهر المفهوم هنا', ideas: [1, 2, 3, 4, 5].map(idea), pairwise_notes: '', selected_id: 'I1', selection_reason: 'الأقرب لحياة الطالب والأدق ارتباطًا'}));
    }
    if (c.stage === 'WRITING') {
      const s = JSON.parse(fx('script.json'));
      s.approval = {status: 'draft'};
      fs.writeFileSync(path.join(e.script, 'script.json'), JSON.stringify(s));
      fs.writeFileSync(path.join(e.voice, 'RECORDING_SHEET.md'), '# sheet');
    }
    if (c.stage === 'SCRIPT_QA') {
      const v = qa.shift() ?? 'pass';
      fs.writeFileSync(path.join(e.quality, 'script_qa_review.json'), JSON.stringify({
        episode_id: ID, stage: 'script_qa', verdict: v, summary: v,
        findings: v === 'pass' ? [] : [{id: 'F1', check: 'editorial', severity: 'major', location: {line: 'L02'}, problem: 'الهوك ضعيف', fix: 'اجعل الحيرة أوضح', owner: 'writer'}],
      }));
    }
    if (c.stage === 'STORYBOARD') fs.writeFileSync(path.join(e.script, 'storyboard.json'), fx('storyboard.json'));
    return {status: 'done', summary: 'ok', outputs: []};
  }) as unknown as AgentRunner & {calls: AgentCall[]};
  runner.calls = calls;
  return runner;
};

const advance = async (runner: AgentRunner, n = 1) => {
  for (let i = 0; i < n; i++) {
    const t = getTask(ID)!;
    const o = await step(t, {runner, owner: 'test'});
    commit(t, o);
  }
  return getTask(ID)!;
};

before(() => {
  openDb();
  fs.rmSync(ep(ID).dir, {recursive: true, force: true});
  fs.mkdirSync(ep(ID).source, {recursive: true});
  fs.writeFileSync(path.join(ep(ID).source, 'lesson_reference.json'), fx('lesson_reference.json').replace('"unit": "00"', '"unit": "99"').replace('"lesson": "00"', '"lesson": "01"'));
});
after(() => {
  closeDb();
  fs.rmSync(ep(ID).dir, {recursive: true, force: true});
  fs.rmSync(ep(ID).engineDir, {recursive: true, force: true});
});

test('state machine has no dead ends except COMPLETED', async () => {
  const {STATES} = await import('../src/states.ts');
  for (const s of STATES) if (s !== 'COMPLETED') assert.ok(STATES.some((t) => canTransition(s, t)), s);
});

test('writer → QA revise → writer again → QA pass → waits for the human → approve → storyboard', async () => {
  insertTask({episode_id: ID, subject: 'MATH', grade: 'G10'});
  const r = scripted({scriptQA: ['revise', 'pass']});
  let t = await advance(r, 4); // QUEUED→RESEARCHING→WRITING→SCRIPT_QA→REVISION_REQUIRED
  assert.equal(t.state, 'REVISION_REQUIRED');
  assert.equal(t.resume_state, 'WRITING');
  assert.equal(t.rounds.script_qa, 1);
  t = await advance(r, 1);
  assert.equal(t.state, 'WRITING');
  const writerPrompt = (await advance(r, 1), r.calls.filter((c) => c.stage === 'WRITING').pop()!.prompt);
  assert.match(writerPrompt, /الهوك ضعيف/, 'writer receives only its QA findings');
  t = await advance(r, 1);
  assert.equal(t.state, 'AWAITING_SCRIPT_APPROVAL');
  assert.ok(fs.existsSync(ep(ID).action), 'human is told what to do');
  assert.equal(claimNext('w', RUNNABLE, {per_grade: 3, global_max: 3}, 1000), null, 'scheduler never picks a human-gated task');
  approve(ID, 'script', 'tester');
  t = getTask(ID)!;
  assert.equal(t.state, 'STORYBOARD');
  const s = JSON.parse(fs.readFileSync(path.join(ep(ID).script, 'script.json'), 'utf8'));
  assert.equal(s.approval.status, 'approved');
  assert.match(fs.readFileSync(ep(ID).action, 'utf8'), /سجّل/, 'recording request issued immediately after approval');
  t = await advance(r, 1);
  assert.equal(t.state, 'PRODUCING', 'storyboard validated and resolved');
  const meta = JSON.parse(fs.readFileSync(ep(ID).metadata, 'utf8'));
  assert.ok(meta.history.length >= 7, 'every transition is in the episode history');
});

test('repeated failures end in FAILED with a clear action; retry resumes the same stage', async () => {
  const failing: AgentRunner = async () => ({status: 'failed', summary: 'boom', outputs: []});
  updateTask(ID, {state: 'STORYBOARD', failures: 0, not_before: null});
  for (let i = 0; i < 3; i++) {
    const t = getTask(ID)!;
    commit(t, await step(t, {runner: failing, owner: 'test'}));
  }
  assert.equal(getTask(ID)!.state, 'FAILED');
  retry(ID);
  assert.equal(getTask(ID)!.state, 'STORYBOARD');
});

test('lease expiry = automatic resume after a crash', () => {
  updateTask(ID, {state: 'STORYBOARD', not_before: null, lease_owner: null, lease_until: null});
  const a = claimNext('worker-A', RUNNABLE, {per_grade: 3, global_max: 3}, 30);
  assert.equal(a?.episode_id, ID);
  assert.equal(claimNext('worker-B', RUNNABLE, {per_grade: 3, global_max: 3}, 30), null, 'no double processing while leased');
  const until = Date.now() + 60;
  while (Date.now() < until) {
    /* worker-A "crashes": its lease is never renewed */
  }
  const b = claimNext('worker-B', RUNNABLE, {per_grade: 3, global_max: 3}, 30);
  assert.equal(b?.episode_id, ID, 'another worker picks it up from the same stage');
  assert.equal(b?.state, 'STORYBOARD');
});

test('AWAITING_MEDIA polls cheaply with back-off until the presenter uploads', async () => {
  updateTask(ID, {state: 'AWAITING_MEDIA', lease_owner: null, lease_until: null, not_before: null});
  const t = await advance(scripted({}), 1);
  assert.equal(t.state, 'AWAITING_MEDIA');
  assert.ok((t.not_before ?? 0) > Date.now() + 30_000, 'backs off instead of spinning');
});
