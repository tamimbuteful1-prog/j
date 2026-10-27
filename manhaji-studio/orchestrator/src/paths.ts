import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = process.env.MANHAJI_ROOT ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const P = {
  root: ROOT,
  config: path.join(ROOT, 'config'),
  contracts: path.join(ROOT, 'contracts'),
  books: path.join(ROOT, 'books'),
  memory: path.join(ROOT, 'memory', 'creative-memory.jsonl'),
  episodes: path.join(ROOT, 'episodes'),
  engine: path.join(ROOT, 'engine'),
  engineEpisodes: path.join(ROOT, 'engine', 'src', 'episodes'),
  db: process.env.MANHAJI_DB ?? path.join(ROOT, 'studio.db'),
  actionBoard: path.join(ROOT, 'ACTION_REQUIRED.md'),
};

export const ep = (id: string) => {
  const d = path.join(P.episodes, id);
  return {
    dir: d,
    source: path.join(d, 'source'),
    research: path.join(d, 'research'),
    script: path.join(d, 'script'),
    hook: path.join(d, '01_hook'),
    voice: path.join(d, '02_voiceover'),
    motion: path.join(d, '03_motion'),
    production: path.join(d, 'production'),
    publicDir: path.join(d, 'production', 'public'),
    final: path.join(d, 'final'),
    quality: path.join(d, 'quality'),
    metadata: path.join(d, 'metadata.json'),
    action: path.join(d, 'ACTION_REQUIRED.md'),
    engineDir: path.join(P.engineEpisodes, id),
  };
};
