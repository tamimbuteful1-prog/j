"""Cut the full episode-06 mix into the two Shorts parts (no speed change, no narration removed).
Part 1: 0 → end of segment 66 (+ the question bed taken from the episode's own question section, + silent title).
Part 2: just before segment 67 → end.
Usage: python3 split_audio.py mix_ep6.wav timeline.js out_dir
"""
import json, re, subprocess, sys
mix, tl, out = sys.argv[1:4]
SEG = json.loads(re.search(r"SEG=(\[.*?\]);", open(tl).read(), re.S).group(1))
A = lambda i: SEG[i]["a"]; B = lambda i: SEG[i]["b"]
P1_END = B(66) + .25; P1_ASK_END = P1_END + .3 + 5.2; P1_DUR = P1_ASK_END + 5.2
VO_END = B(129); OFF = A(67) - .35
def run(*a): subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *a], check=True)
q = P1_ASK_END - P1_END
run("-i", mix, "-filter_complex",
    f"[0]atrim=0:{P1_END},afade=t=out:st={P1_END-.25}:d=0.25,asetpts=N/SR/TB[a];"
    f"[0]atrim={VO_END}:{VO_END+q},afade=t=in:d=0.3,afade=t=out:st={q-.5}:d=0.5,asetpts=N/SR/TB[b];"
    f"anullsrc=r=48000:cl=stereo,atrim=0:{P1_DUR-P1_ASK_END}[c];[a][b][c]concat=n=3:v=0:a=1[o]",
    "-map", "[o]", f"{out}/mix_ep6a.wav")
run("-i", mix, "-af", f"atrim={OFF},asetpts=N/SR/TB,afade=t=in:d=0.2", f"{out}/mix_ep6b.wav")
print("part1 %.2fs  part2 starts at %.2fs" % (P1_DUR, OFF))
