"""Decode press-law-exec-reg.pdf by glyph ID (royal_map.py) instead of its
broken ToUnicode table. Output: one text file per PDF page.
Usage: python3 -I extract_royal.py <pdf> <outdir>"""
import sys, os, re, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf
from royal_map import M, MARK_CHARS

MIRROR = str.maketrans('()[]', ')(][')
UNKNOWN = '�'

def glyphs(page):
    for sp in page.get_texttrace():
        royal = 'Royal' in sp['font']
        cs = sp['chars']
        for i, ch in enumerate(cs):
            uni, gid, origin, bbox = ch[0], ch[1], ch[2], ch[3]
            if gid < 0:
                continue  # continuation of a multi-char ToUnicode entry
            x0, y0, x1, y1 = bbox
            if royal:
                if gid in MARK_CHARS:
                    yield ('MARK', MARK_CHARS[gid], x0, x1, y0, y1)
                    continue
                t = M.get(gid, UNKNOWN)
            else:
                t = unicodedata.normalize('NFKC', chr(uni)) if uni > 0 else ''
                if t and unicodedata.category(t[0]) == 'Mn':
                    yield ('MARK', t, x0, x1, y0, y1)
                    continue
            if t == '':
                continue
            yield ('BASE', t, x0, x1, y0, y1)

def decode_row(items):
    bases = [[g[2], g[3], g[1], ''] for g in items if g[0] == 'BASE']
    for g in items:
        if g[0] != 'MARK':
            continue
        cx = (g[2] + g[3]) / 2
        cands = [b for b in bases if b[2].strip()]
        if not cands:
            continue
        best = min(cands, key=lambda b: 0 if b[0] - .5 <= cx <= b[1] + .5 else min(abs(b[0]-cx), abs(b[1]-cx)) + 1)
        best[3] += g[1]
    bases.sort(key=lambda b: -(b[0] + b[1]) / 2)
    out, prev = [], None
    for b in bases:
        if prev is not None and prev[0] - b[1] > 6 and b[2] != ' ' and prev[2] != ' ':
            out.append('  ')
        out.append(b[2] + b[3]); prev = b
    s = ''.join(out)
    s = s.replace('ـ', '')  # kashida used for justification only
    s = re.sub(r'[0-9A-Za-z]+(?:[./:,\-][0-9A-Za-z]+)*', lambda m: m.group(0)[::-1], s)
    s = s.translate(MIRROR)
    return re.sub(r'\s+', ' ', s).strip()

def main(pdf, out):
    os.makedirs(out, exist_ok=True)
    d = pymupdf.open(pdf)
    for i, pg in enumerate(d, 1):
        # Word fakes bold by drawing a run twice with a tiny offset: drop near-duplicates
        seen, gl = [], []
        for g in glyphs(pg):
            if any(h[1] == g[1] and abs(h[2] - g[2]) < 1.2 and abs(h[4] - g[4]) < 1.2 for h in seen[-80:]):
                continue
            seen.append(g); gl.append(g)
        gl.sort(key=lambda g: (g[4] + g[5]) / 2)
        rows = []
        for g in gl:
            cy = (g[4] + g[5]) / 2
            if g[0] == 'MARK':
                # attach to the nearest row (marks sit above/below the line)
                if rows and abs(rows[-1][0] - cy) < 12:
                    rows[-1][1].append(g)
                else:
                    rows.append([cy, [g]])
                continue
            if rows and abs(rows[-1][0] - cy) < 5:
                rows[-1][1].append(g)
            else:
                rows.append([cy, [g]])
        texts = [decode_row(r[1]) for r in rows]
        with open(os.path.join(out, f'p-{i:03d}.txt'), 'w', encoding='utf-8') as f:
            f.write('\n'.join(t for t in texts if t) + '\n')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
