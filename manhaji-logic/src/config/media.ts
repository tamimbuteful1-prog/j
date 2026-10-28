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
  /** Seconds inside the clip where «وصامولي» and the 2nd «أو» start (drive the order card). */
  waWordStartSec: 2.62,
  orWordStartSec: 4.98,
  /** Second (inside the clip) right after Tamim says the 2nd «أو» — the dramatic beat. */
  orWordSec: 5.24,
  /** Hold-frame length at «أو» (frame + audio pause). 0 disables the stop. */
  freezeFrames: 12,
  /** Hold the last frame this long so the 3D exit never cuts into speech. */
  tailHoldSec: 0.7,
  /**
   * 'fit'  → the whole landscape shot, no crop / no zoom, framed as a card inside a designed
   *          Manhaji layout (header + the father's order card) — it never reads as "landscape".
   * 'fill' → crop to fill 9:16 (use with a vertical master).
   */
  framing: 'fit' as 'fit' | 'fill',
  /** Top of the framed shot on the 9:16 canvas in 'fit' mode. */
  fitTop: 560,
  /** Push-in during the clip (1 = none) and the small punch on «أو» (0 = none). */
  pushIn: 1,
  orPunch: 0,
  /** Lifts the camera audio (-16.9 LUFS) to the voice-over level (-16 LUFS). */
  volume: 1.11,
} as const;

export const MUSIC = {
  enabled: true,
  /** Generated lo-fi groove (scripts/generate-music.mjs) — replace with a licensed track of the same name. */
  src: 'music/groove.wav',
  /** Music level when nobody is speaking. */
  volume: 0.18,
  /** Music level under dialogue (auto-ducked from caption windows). */
  duckedVolume: 0.06,
  /** Music starts after the hook (the hook stays raw & intimate). */
  startAfterHook: true,
} as const;

/** Voice-over on/off for the whole film. Render with REMOTION_NO_VOICE=1 for a music+SFX-only version. */
export const VOICE_ENABLED = process.env.REMOTION_NO_VOICE !== '1';

export const SFX_ENABLED = true;
export const SFX_MASTER = 1;

/** Show caption subtitles of the spoken lines. */
export const SHOW_CAPTIONS = true;
/** Draw safe-area guides (studio only — keep false for final render). */
export const SHOW_SAFE_GUIDES = false;
