import data from './lines.json';

export type Speaker = 'N' | 'K' | 'MD' | 'MP' | 'MB' | 'NW' | 'MSG';
export type Line = {id: string; speaker: Speaker; text: string; scene: number; start: number; end: number; words: [number, number][]};

/** measured from the recording (public/vo/E01.wav) — see scripts/README in the episode folder */
export const LINES = data.lines as unknown as Line[];
export const VO_SEC = data.voDuration;

export const line = (id: string) => {
  const l = LINES.find((x) => x.id === id);
  if (!l) throw new Error(id);
  return l;
};
/** time the n-th word (0-based) of a line starts */
export const word = (id: string, n: number) => line(id).words[Math.min(n, line(id).words.length - 1)][0];

/** scene windows: from its first line (minus a lead) to the next scene's start */
const LEAD = 0.35;
const sceneIds = Array.from(new Set(LINES.map((l) => l.scene)));
export const SCENES = sceneIds.map((s, i) => {
  const first = LINES.find((l) => l.scene === s)!;
  const nextFirst = LINES.find((l) => l.scene === sceneIds[i + 1]);
  const start = i === 0 ? 0 : first.start - LEAD;
  const end = nextFirst ? nextFirst.start - LEAD : VO_SEC + 0.2;
  return {id: s, start, end};
});
export const scene = (n: number) => SCENES.find((s) => s.id === n)!;

/** after the last line: hard cut to black, silence, then the title */
export const BLACK_AT = line('L41').end + 0.15;
export const TITLE_AT = BLACK_AT + 1.4;
export const TOTAL = TITLE_AT + 4.2;
