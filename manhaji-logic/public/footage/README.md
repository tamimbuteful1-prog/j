# Hook footage slot

Drop the final, Higgsfield-graded hook clip here as **`hook.mp4`** (landscape or vertical, 30 fps recommended),
then set `HOOK.enabled = true` in `src/config/media.ts`.

- The clip length is read automatically — the whole film re-flows after it.
- Set `HOOK.orWordSec` to the exact second Tamim says the 2nd «أو» (the hold-frame beat).
- Adjust the hook caption timings in `HOOK_CAPTIONS` (`src/config/timeline.ts`).
- `HOOK.framing = 'fit'` shows a landscape shot whole (no crop, no zoom) over a soft blurred fill;
  use `'fill'` for a vertical master.
- Current clip: take 1 (no greeting), loudness-normalised to -16 LUFS.
