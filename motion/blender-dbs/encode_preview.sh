#!/usr/bin/env bash
# يجمع إطارات بلندر في معاينة MP4 (‏1080×1920، ‏30 إطار/ث) مع أول 8 ثوانٍ من مسار المؤثرات المرجعي
set -e; cd "$(dirname "$0")"
ffmpeg -y -v error -framerate 30 -i render/frames/f_%04d.png -i ../audio.wav -t 8 \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 256k dbs_test_8s.mp4
echo "dbs_test_8s.mp4"
