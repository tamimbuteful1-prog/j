"""Assemble episode-02.html from the source + shared episode-01 assets."""
import os
d = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(d, "episode-02.src.html")).read()
for k, f in (("{{DEFS}}", "_shared_defs.svg"), ("{{TROOM}}", "_shared_room.svg"), ("{{TFACE}}", "_shared_face.svg")):
    s = s.replace(k, open(os.path.join(d, f)).read())
open(os.path.join(d, "episode-02.html"), "w").write(s)
print("ok")
