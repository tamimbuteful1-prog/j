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
  enabled: false,
  src: 'footage/hook.mp4',
  /**
   * Fallback length when the real clip is off. When enabled, the real clip
   * duration is read automatically (calculateMetadata) and the whole film re-flows.
   */
  placeholderDurationSec: 5.4,
  /** Second (inside the clip) where Tamim says the 2nd «أو» — the dramatic beat. */
  orWordSec: 3.55,
  /** Hold-frame length at «أو» (frame + audio pause). 0 disables the stop. */
  freezeFrames: 12,
  /** Push-in during the clip (1 = none). Keep subtle. */
  pushIn: 1.07,
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
