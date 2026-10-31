#!/usr/bin/env bash
# OCR a PDF page-by-page with Tesseract (Arabic).
# Usage: ocr.sh <pdf> <outdir> [dpi]
# Output: <outdir>/p-NNN.txt (one file per physical PDF page) and p-NNN.tsv (word confidences)
set -euo pipefail
export OMP_THREAD_LIMIT=1
pdf="$1"; out="$2"; dpi="${3:-300}"
mkdir -p "$out"
n=$(pdfinfo "$pdf" | awk '/^Pages:/{print $2}')
tmp=$(mktemp -d)
for i in $(seq 1 "$n"); do
  p=$(printf "%03d" "$i")
  [ -s "$out/p-$p.tsv" ] && continue
  pdftoppm -f "$i" -l "$i" -r "$dpi" -gray -png "$pdf" "$tmp/pg"
  img=$(ls "$tmp"/pg*.png | head -1)
  tesseract "$img" "$out/p-$p" -l ara --psm 6 txt tsv quiet
  rm -f "$tmp"/pg*.png
done
rm -rf "$tmp"
