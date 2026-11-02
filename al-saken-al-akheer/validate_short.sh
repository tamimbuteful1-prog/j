#!/usr/bin/env bash
# Usage: ./validate_short.sh video.mp4 [more.mp4 ...]
# Fails (exit 1) unless every file is exactly 1080x1920 and <= 175.0 s.
set -u; fail=0
for f in "$@"; do
  read -r w h < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$f" | tr x ' ')
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  ok=$(python3 -c "print(int($w==1080 and $h==1920 and $d<=175.0))")
  if [ "$ok" = 1 ]; then echo "PASS  ${w}x${h}  ${d}s  $f"; else echo "FAIL  ${w}x${h}  ${d}s  $f"; fail=1; fi
done
exit $fail
