#!/usr/bin/env bash
# Step 1 of the reference pipeline: turn each source PDF into per-page text.
# Digital PDFs are decoded at glyph level (their text layers are broken; see
# extract_bukra.py / extract_royal.py). Scanned PDFs were transcribed by hand
# into sources/text/*.txt and are not regenerated here.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=sources/extracted
rm -rf "$OUT"; mkdir -p "$OUT"
python3 -I scripts/extract_royal.py sources/pdf/press-law.pdf          "$OUT/press-law"
python3 -I scripts/extract_royal.py sources/pdf/press-law-exec-reg.pdf "$OUT/press-law-exec-reg"
python3 -I scripts/extract_bukra.py sources/pdf/av-media-exec-reg.pdf  "$OUT/av-media-exec-reg"
python3 -I scripts/extract_royal.py sources/pdf/age-rating.pdf         "$OUT/age-rating"
# Chrome-printed PDFs use Persian/Urdu presentation forms for ي/ه/ك; map to Arabic letters.
python3 -I scripts/normalize_letters.py "$OUT/press-law" "$OUT/age-rating"
sha256sum sources/pdf/*.pdf > sources/pdf/SHA256SUMS
echo "extracted -> $OUT"
