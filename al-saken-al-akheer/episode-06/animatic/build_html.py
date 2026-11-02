"""Assemble episode-06.html (the rig lives in rig.js, timing in timeline.js, lip sync in voice_env.js)."""
import os
d = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(d, "episode-06.src.html")).read().replace("{{DEFS}}", open(os.path.join(d, "_shared_defs.svg")).read()).replace("{{TFACE}}", open(os.path.join(d, "_shared_face.svg")).read()).replace("{{TBODY}}", open(os.path.join(d, "_shared_body.svg")).read())
for part, name in ((0, "episode-06.html"), (1, "episode-06a.html"), (2, "episode-06b.html")):
    open(os.path.join(d, name), "w").write(s.replace("{{PART}}", str(part)))
print("ok")
