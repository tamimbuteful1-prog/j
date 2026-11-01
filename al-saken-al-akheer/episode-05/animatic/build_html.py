"""Assemble episode-05.html from the source + shared assets/scenes from episodes 1–4."""
import os, re
d = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(d, "episode-05.src.html")).read()
for k, f in (("{{DEFS}}", "_shared_defs.svg"), ("{{TROOM}}", "_shared_room.svg"), ("{{TFACE}}", "_shared_face.svg"),
             ("{{TBODY}}", "_shared_body.svg"), ("{{PHOTO_DEFS}}", "_ep4_photo_defs.html"), ("{{PEOPLE_JS}}", "_ep4_people.js")):
    s = s.replace(k, open(os.path.join(d, f)).read())
s = re.sub(r"\{\{SCENE:(\w+)\}\}", lambda m: open(os.path.join(d, f"_scene_{m.group(1)}.html")).read(), s)
open(os.path.join(d, "episode-05.html"), "w").write(s)
print("ok")
