/** Shared screen-space layout so scenes hand products over seamlessly (match cuts). */
export const HERO = {
  aish: {x: 725, y: 1220},
  samoli: {x: 355, y: 1220},
  scale: 1,
} as const;

/** World position of the heroes in the aisle (projects exactly onto HERO when the camera arrives). */
export const HERO_WORLD = {
  aishX: 185,
  samoliX: -185,
  baseY: 360,
} as const;

/** Scene A ends on a slow 6% push-in around (540, 1056); Scene B picks the heroes up exactly there. */
export const A_END_ZOOM = 1.06;
const zoomed = (x: number, y: number) => ({x: 540 + (x - 540) * A_END_ZOOM, y: 1056 + (y - 1056) * A_END_ZOOM});
export const HANDOFF = {
  aish: zoomed(HERO.aish.x, HERO.aish.y),
  samoli: zoomed(HERO.samoli.x, HERO.samoli.y),
  scale: A_END_ZOOM,
} as const;
