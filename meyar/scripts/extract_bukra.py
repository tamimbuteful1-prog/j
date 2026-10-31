"""Decode the text layer of av-media-exec-reg.pdf using the visually
identified glyph map (bukra_map.py). Output: one text file per PDF page.
Usage: python3 -I extract_bukra.py <pdf> <outdir>"""
import sys, os, re, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf
from bukra_map import M, MARKS, MARK_CHARS

LTR = re.compile(r'[0-9A-Za-z®%]+(?:[./:,\-][0-9A-Za-z]+)*')
MIRROR = str.maketrans('()[]', ')(][')

def glyph_text(font, ch):
    o = ord(ch)
    if 'Bukra' in font and (o < 32 or 200 < o < 0x600):
        if o in MARKS:
            return ('MARK', MARK_CHARS.get(o, ''))
        return ('BASE', M.get(o, '�'))
    t = unicodedata.normalize('NFKC', ch)
    if t and all(unicodedata.category(x) == 'Mn' for x in t):
        return ('MARK', t)
    return ('BASE', t)

def decode_line(line):
    bases = []  # [x0, x1, text, marks]
    marks = []
    for s in line['spans']:
        for c in s['chars']:
            kind, t = glyph_text(s['font'], c['c'])
            x0, x1 = c['bbox'][0], c['bbox'][2]
            if kind == 'MARK':
                marks.append(((x0 + x1) / 2, t))
            else:
                bases.append([x0, x1, t, ''])
    # InDesign splits spans around each diacritic and inserts a narrow
    # ASCII space touching the mark; it is not a real word space.
    mx = [cx for cx, _ in marks]
    bases = [b for b in bases if not (b[2] == ' ' and any(b[0] - 0.6 <= x <= b[1] + 0.6 for x in mx))]
    for cx, t in marks:
        best = None
        for b in bases:
            if b[2].strip() and b[0] - 0.5 <= cx <= b[1] + 0.5:
                if best is None or abs((b[0]+b[1])/2 - cx) < abs((best[0]+best[1])/2 - cx):
                    best = b
        if best is None and bases:
            best = min(bases, key=lambda b: abs((b[0]+b[1])/2 - cx))
        if best is not None:
            best[3] += t
    bases.sort(key=lambda b: -b[0])  # right-to-left
    out = []
    prev = None
    for b in bases:
        # a visible horizontal gap (table cells, header fields) becomes a space
        if prev is not None and prev[0] - b[1] > 6 and b[2] != ' ' and prev[2] != ' ':
            out.append('  ')
        out.append(b[2] + b[3])
        prev = b
    s = ''.join(out)
    # runs of LTR text were reversed by the RTL sort; flip them back
    def fix(m):
        return m.group(0)[::-1]
    s = re.sub(r'[0-9A-Za-z]+(?:[./:,\-][0-9A-Za-z]+)*', lambda m: m.group(0)[::-1], s)
    s = s.translate(MIRROR)
    return re.sub(r'\s+', ' ', s).strip()

def main(pdf, out):
    os.makedirs(out, exist_ok=True)
    d = pymupdf.open(pdf)
    for i, pg in enumerate(d, 1):
        lines = []
        rd = pg.get_text('rawdict')
        # merge all PDF 'lines' that share a visual row, then decode the row
        raw = [l for b in rd['blocks'] for l in b.get('lines', [])]
        def base_y(l):  # baseline: robust to tall diacritics stretching the bbox
            ys = sorted(c['origin'][1] for s in l['spans'] for c in s['chars'])
            return ys[len(ys) // 2] if ys else (l['bbox'][1] + l['bbox'][3]) / 2
        raw.sort(key=base_y)
        def marks_only(l):
            return all(glyph_text(s['font'], c['c'])[0] == 'MARK' or c['c'] == ' '
                       for s in l['spans'] for c in s['chars'])
        rows, pending = [], []
        for l in raw:
            if marks_only(l):
                pending.append(l)
                continue
            cy = base_y(l)
            if rows and abs(rows[-1][0] - cy) < 3:
                rows[-1][1]['spans'].extend(l['spans'])
            else:
                rows.append([cy, {'spans': list(l['spans'])}])
        for l in pending:  # diacritic-only lines belong to the nearest text row
            cy = base_y(l)
            if rows:
                r = min(rows, key=lambda r: abs(r[0] - cy))
                if abs(r[0] - cy) < 14:
                    r[1]['spans'].extend(l['spans'])
        texts = [decode_line(r[1]) for r in rows]
        with open(os.path.join(out, f'p-{i:03d}.txt'), 'w', encoding='utf-8') as f:
            f.write('\n'.join(t for t in texts if t) + '\n')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
