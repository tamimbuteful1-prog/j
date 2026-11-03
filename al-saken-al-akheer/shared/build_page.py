"""Assemble an episode page: python3 build_page.py <episode-dir> <name>
Inlines the shared head/templates; copies rig.js + engine.js next to the page.
Includes voice_env.js only when the real narration has been processed."""
import os, shutil, sys
sh = os.path.dirname(os.path.abspath(__file__)); d = os.path.abspath(sys.argv[1]); name = sys.argv[2]
s = open(os.path.join(d, f"{name}.src.html")).read()
R = lambda f: open(os.path.join(sh, f)).read()
s = (s.replace("{{HEAD}}", R("page_head.html")).replace("{{DEFS}}", R("_shared_defs.svg")).replace("{{TFACE}}", R("_shared_face.svg"))
      .replace("{{TBODY}}", R("_shared_body.svg")).replace("{{PHOTO_DEFS}}", R("photo_defs.html")).replace("{{PEOPLE_JS}}", R("people.js"))
      .replace("{{VENV}}", '<script src="voice_env.js"></script>' if os.path.exists(os.path.join(d, "voice_env.js")) else ""))
open(os.path.join(d, f"{name}.html"), "w").write(s)
for f in ("rig.js", "engine.js"): shutil.copy(os.path.join(sh, f), d)
print("built", name)
