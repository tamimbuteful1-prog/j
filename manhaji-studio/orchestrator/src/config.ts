import fs from 'node:fs';
import path from 'node:path';
import {P} from './paths.ts';

export type StudioConfig = {
  approvals: {require_script_approval: boolean; require_final_approval: boolean};
  slots: {per_grade: number; global_max: number};
  retries: {max_revision_rounds_per_stage: number; max_agent_failures: number};
  budget: {per_agent_run_usd: Record<AgentRole, number>; daily_usd: number};
  models: Record<AgentRole, string>;
  effort: Record<AgentRole, 'low' | 'medium' | 'high' | 'xhigh' | 'max'>;
  episode: {
    target_duration_sec: [number, number];
    speech_rate_words_per_sec: number;
    line_gap_sec: number;
    scene_lead_sec: number;
    loudness_lufs: number;
    fps: number;
    width: number;
    height: number;
  };
  notify: {mode: 'file'; webhook_url: string};
};

export type AgentRole = 'writer' | 'motion' | 'quality' | 'assembly';

export type Book = {id: string; file: string; semester?: string; title?: string};
export type Subject = {id: string; name_ar: string; grades: Record<string, {name_ar: string; books: Book[]}>};

export const loadConfig = (): StudioConfig => JSON.parse(fs.readFileSync(path.join(P.config, 'studio.json'), 'utf8'));

export const loadSubjects = (): Subject[] =>
  fs
    .readdirSync(path.join(P.config, 'subjects'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(P.config, 'subjects', f), 'utf8')));

export const saveSubject = (s: Subject) => {
  const file = fs.readdirSync(path.join(P.config, 'subjects')).find((f) => JSON.parse(fs.readFileSync(path.join(P.config, 'subjects', f), 'utf8')).id === s.id);
  if (!file) throw new Error(`unknown subject ${s.id}`);
  fs.writeFileSync(path.join(P.config, 'subjects', file), JSON.stringify(s, null, 2) + '\n');
};

export const subjectOf = (episodeId: string) => {
  const [sub, grade] = episodeId.split('-');
  const s = loadSubjects().find((x) => x.id === sub);
  if (!s) throw new Error(`unknown subject in ${episodeId}`);
  const g = s.grades[grade];
  if (!g) throw new Error(`grade ${grade} has no track in subject ${sub}`);
  return {subject: s, grade, gradeInfo: g};
};
