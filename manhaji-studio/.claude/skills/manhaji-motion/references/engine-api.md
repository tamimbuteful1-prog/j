# Engine API
The authoritative engine reference is `engine/ENGINE.md` — read it fully before writing scenes.
Summary: scenes live in `engine/src/episodes/<ID>/`, timing comes from `useScene().beat()/line()` (line-anchored beats resolved from storyboard.json), the kit provides typography/badges/tables/symbols/backdrops/outro, worlds provide environments, SFX are declared in the storyboard.
