#!/bin/bash
# Resumable render: video in 450-frame chunks (skips finished ones), audio separately, then mux.
set -e
cd "$(dirname "$0")/.."
B=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
mkdir -p out/chunks
TOTAL=2250; STEP=450
for ((s=0; s<TOTAL; s+=STEP)); do
  e=$((s+STEP-1)); f=out/chunks/c_$(printf %04d $s).mp4
  [ -f "$f" ] && continue
  npx remotion render src/index.ts Manhaji "$f.tmp.mp4" --frames=$s-$e --muted --browser-executable=$B --gl=swangle --concurrency=4 --log=error
  mv "$f.tmp.mp4" "$f"; echo "chunk $s-$e done"
done
[ -f out/audio.wav ] || npx remotion render src/index.ts Manhaji out/audio.wav --codec=wav --browser-executable=$B --log=error
ls out/chunks/c_*.mp4 | sed "s#^out/##;s#^#file '#;s#\$#'#" > out/list.txt
ffmpeg -v error -y -f concat -safe 0 -i out/list.txt -i out/audio.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -af "loudnorm=I=-14:TP=-1.0:LRA=9" -movflags +faststart out/manhaji_short.mp4
echo ALL_DONE
