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
  npx remotion render src/index.ts Manhaji "$f.tmp.mp4" --frames=$s-$e --muted --browser-executable=$B --gl=angle --concurrency=4 --log=error
  mv "$f.tmp.mp4" "$f"; echo "chunk $s-$e done"
done
[ -f out/audio.wav ] || python3 scripts/mix_audio.py
# join with the concat *filter* (decodes every chunk, immune to mixed time bases), then encode once
mapfile -t CH < <(ls out/chunks/c_*.mp4)
IN=(); FC=""
for i in "${!CH[@]}"; do IN+=(-i "${CH[$i]}"); FC+="[$i:v]setpts=PTS-STARTPTS[v$i];"; done
for i in "${!CH[@]}"; do FC+="[v$i]"; done
FC+="concat=n=${#CH[@]}:v=1:a=0,scale=out_range=tv,format=yuv420p[v]"
ffmpeg -v error -y "${IN[@]}" -i out/audio.wav -filter_complex "$FC" -map "[v]" -map ${#CH[@]}:a -c:v libx264 -preset slow -crf 16 -profile:v high -r 30 -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 256k -af "loudnorm=I=-14:TP=-1.0:LRA=9" -ar 48000 -movflags +faststart out/manhaji_short.mp4
echo ALL_DONE
