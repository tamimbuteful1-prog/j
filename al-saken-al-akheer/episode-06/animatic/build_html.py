"""Assemble episode-06.html (the rig lives in rig.js, timing in timeline.js, lip sync in voice_env.js)."""
import os
d = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(d, "episode-06.src.html")).read().replace("{{DEFS}}", open(os.path.join(d, "_shared_defs.svg")).read())
open(os.path.join(d, "episode-06.html"), "w").write(s)
print("ok")
