#!/bin/bash
# Robust render: video-only chunks with retry, lossless concat, then mux the mastered mix.
# usage: scripts/render.sh <Landscape|Vertical> <out.mp4>
set -u
COMP=$1
OUT=$2
CH=150
cd "$(dirname "$0")/.."
TOTAL=$(node -e "const t=require('./src/timeline.json');const s=t.voiceStart+t.segments.reduce((a,[x,y])=>a+y-x,0)+t.tail;console.log(Math.ceil(s*t.fps))")
DIR=build/chunks_$COMP
mkdir -p "$DIR"
: > "$DIR/list.txt"
npx remotion bundle --out-dir build/bundle --log=error > /dev/null 2>&1 || { echo "bundle failed"; exit 1; }
for ((a = 0; a < TOTAL; a += CH)); do
  b=$((a + CH - 1))
  [ $b -ge $TOTAL ] && b=$((TOTAL - 1))
  f="$DIR/c_$(printf %05d $a).mp4"
  for try in 1 2 3 4; do
    [ -s "$f" ] && break
    npx remotion render build/bundle "$COMP" "$f" --frames=$a-$b --muted --concurrency=3 --timeout=60000 --log=error > "$DIR/log_$a.txt" 2>&1 && break
    rm -f "$f"
    echo "retry $a-$b ($try)"
  done
  [ -s "$f" ] || { echo "FAILED chunk $a-$b"; exit 1; }
  echo "file '$(basename "$f")'" >> "$DIR/list.txt"
  echo "chunk $a-$b ok"
done
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$DIR/list.txt" -i public/audio/mix.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$OUT" && echo "DONE $OUT"
