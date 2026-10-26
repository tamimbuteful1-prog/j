/**
 * ─────────────────────────────────────────────────────────────
 *  MEDIA SLOTS — the only file you need to touch to drop in assets
 * ─────────────────────────────────────────────────────────────
 *  1. Hook footage  → public/footage/hook.mp4   then set HOOK.enabled = true
 *  2. Voice-over    → public/voice/<file>       then set enabled = true on that line (timeline.ts)
 *  3. Music / SFX   → public/music, public/sfx  (same file names replace the temp ones)
 */

export const HOOK = {
  /** Flip to true once public/footage/hook.mp4 exists (Higgsfield-graded clip). */
  enabled: true,
  src: 'footage/hook.mp4',
  /**
   * Fallback length when the real clip is off. When enabled, the real clip
   * duration is read automatically (calculateMetadata) and the whole film re-flows.
   */
  placeholderDurationSec: 6.03,
  /** Second (inside the clip) right after Tamim says the 2nd «أو» — the dramatic beat. */
  orWordSec: 5.24,
  /** Hold-frame length at «أو» (frame + audio pause). 0 disables the stop. */
  freezeFrames: 12,
  /** Hold the last frame this long so the 3D exit never cuts into speech. */
  tailHoldSec: 0.7,
  /**
   * 'fit'  → the whole landscape shot, no crop / no zoom, over a soft blurred fill (natural).
   * 'fill' → crop to fill 9:16 (use with a vertical master).
   */
  framing: 'fit' as 'fit' | 'fill',
  /** Top of the shot on the 9:16 canvas in 'fit' mode. */
  fitTop: 560,
  /** Push-in during the clip (1 = none) and the small punch on «أو» (0 = none). */
  pushIn: 1,
  orPunch: 0,
  volume: 1,
} as const;

export const MUSIC = {
  enabled: true,
  /** Temporary generated bed — replace with a licensed track of the same name. */
  src: 'music/bed.wav',
  /** Music level when nobody is speaking. */
  volume: 0.2,
  /** Music level under dialogue (auto-ducked from caption windows). */
  duckedVolume: 0.07,
  /** Music starts after the hook (the hook stays raw & intimate). */
  startAfterHook: true,
} as const;

export const SFX_ENABLED = true;
export const SFX_MASTER = 1;

/** Show caption subtitles of the spoken lines. */
export const SHOW_CAPTIONS = true;
/** Draw safe-area guides (studio only — keep false for final render). */
export const SHOW_SAFE_GUIDES = false;
