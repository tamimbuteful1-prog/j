import fs from 'node:fs';
import path from 'node:path';
import {ep, P} from './paths.ts';
import {writeJson} from './contracts.ts';
import {getTask, listTasks} from './db.ts';
import {HUMAN_STATES} from './states.ts';

/** The fixed folder layout of an episode — three media sections + production records. */
export const scaffoldEpisode = (id: string) => {
  const e = ep(id);
  for (const d of [e.source, e.research, e.script, e.hook, e.voice, e.motion, e.publicDir, e.final, e.quality]) fs.mkdirSync(d, {recursive: true});
  const readme: [string, string][] = [
    [path.join(e.hook, 'README.md'), `# 01_hook — فيديو الهوك\nارفع لقطة الهوك من Higgsfield هنا باسم **hook.mp4** (أفقي أو عمودي).\nالنص المطلوب أداؤه في \`script/script.md\` (قسم الهوك).\n`],
    [path.join(e.voice, 'README.md'), `# 02_voiceover — الفويس أوفر\nسجّل حسب \`RECORDING_SHEET.md\`: ملف لكل سطر (L03.wav …) أو ملف واحد \`full.wav\` بوقفة ثانية كاملة بين السطور.\nالصيغ المقبولة: wav, m4a, mp3.\n`],
    [path.join(e.motion, 'README.md'), `# 03_motion — الموشن جرافيك\nيُنتج آليًا: preview.mp4 (بتوقيت تقديري) — الكود في engine/src/episodes/${id}/\n`],
  ];
  for (const [f, c] of readme) if (!fs.existsSync(f)) fs.writeFileSync(f, c);
  if (!fs.existsSync(e.metadata)) writeJson(e.metadata, {episode_id: id, created_at: new Date().toISOString(), revision: 1, history: [], outputs: {}});
};

export type Metadata = {
  episode_id: string;
  created_at: string;
  revision: number;
  status?: string;
  history: {at: string; from: string; to: string; reason: string; revision: number}[];
  outputs: Record<string, string>;
  [k: string]: unknown;
};

export const readMeta = (id: string): Metadata => JSON.parse(fs.readFileSync(ep(id).metadata, 'utf8'));
export const patchMeta = (id: string, patch: Partial<Metadata>) => writeJson(ep(id).metadata, {...readMeta(id), ...patch});

export const appendHistory = (id: string, from: string, to: string, reason: string) => {
  const m = readMeta(id);
  m.history.push({at: new Date().toISOString(), from, to, reason, revision: m.revision});
  m.status = to;
  writeJson(ep(id).metadata, m);
};

/** Human-facing to-do: one file per episode + a studio-wide board. */
export const setAction = (id: string, title: string, body: string) => {
  fs.writeFileSync(ep(id).action, `# ⏳ ${title}\n\n${body}\n`);
  refreshActionBoard();
};
export const clearAction = (id: string) => {
  if (fs.existsSync(ep(id).action)) fs.rmSync(ep(id).action);
  refreshActionBoard();
};

export const refreshActionBoard = () => {
  const rows = listTasks()
    .filter((t) => HUMAN_STATES.includes(t.state) || t.state === 'AWAITING_MEDIA' || t.state === 'FAILED')
    .map((t) => {
      const f = ep(t.episode_id).action;
      const first = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n')[0].replace(/^#\s*/, '') : t.blocked_reason ?? '';
      return `| ${t.episode_id} | ${t.state} | ${first} |`;
    });
  fs.writeFileSync(
    P.actionBoard,
    `# مطلوب منك\n\n${rows.length ? `| الحلقة | الحالة | المطلوب |\n|---|---|---|\n${rows.join('\n')}` : 'لا شيء الآن ✓'}\n\nالتفاصيل في episodes/<ID>/ACTION_REQUIRED.md\n`,
  );
};

export const isTaskFree = (id: string) => {
  const t = getTask(id);
  return !t?.lease_until || t.lease_until < Date.now();
};
