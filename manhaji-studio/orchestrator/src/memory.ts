import fs from 'node:fs';
import path from 'node:path';
import {ep, P} from './paths.ts';

/**
 * Creative Memory — what was already used (ideas, hooks, situations, worlds, techniques)
 * and what reviews taught us. Writers/Motion read it to avoid repeating themselves.
 */
export const appendMemory = (id: string) => {
  const e = ep(id);
  const j = (f: string) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null);
  const script = j(path.join(e.script, 'script.json'));
  const ideas = j(path.join(e.research, 'idea_candidates.json'));
  const sb = j(path.join(e.script, 'storyboard.json'));
  const chosen = ideas?.ideas?.find((i: {id: string}) => i.id === ideas.selected_id);
  const reviews = fs.existsSync(e.quality)
    ? fs
        .readdirSync(e.quality)
        .filter((f) => f.endsWith('_review.json'))
        .flatMap((f) => (j(path.join(e.quality, f))?.findings ?? []).map((x: {problem: string}) => x.problem))
    : [];
  const entry = {
    episode_id: id,
    subject: id.split('-')[0],
    grade: id.split('-')[1],
    lesson: script?.title,
    idea: chosen?.situation,
    situation: chosen?.situation,
    confusion_mechanism: chosen?.confusion,
    hook: script?.hook?.text,
    world: sb?.world?.name,
    visual_techniques: (sb?.scenes ?? []).flatMap((s: {transition_out?: {type: string}}) => (s.transition_out ? [s.transition_out.type] : [])),
    rejected_ideas: (ideas?.ideas ?? []).filter((i: {id: string}) => i.id !== ideas?.selected_id).map((i: {situation: string}) => i.situation),
    qa_notes: reviews.slice(0, 20),
    rating: null,
    status: 'completed',
    at: new Date().toISOString(),
  };
  fs.appendFileSync(P.memory, JSON.stringify(entry) + '\n');
  return entry;
};
