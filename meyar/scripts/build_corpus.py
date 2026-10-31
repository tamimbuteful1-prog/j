"""Step 2 of the reference pipeline: split each reference document into
articles/sections, attach page numbers, cross-references and quality flags,
and write public/data/corpus.json for the browser.

Usage:  python3 -I scripts/build_corpus.py
Inputs: sources/documents.json, sources/extracted/<id>/p-NNN.txt (digital PDFs),
        sources/text/<id>.txt (hand transcriptions of scanned PDFs).
Never invents article numbers: a heading is only accepted when it matches the
document's numbering scheme, and numeric sequences must be continuous.
"""
import glob
import hashlib
import json
import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'sources')
OUT = os.path.join(ROOT, 'public', 'data', 'corpus.json')
MAX_CHUNK = 1600  # characters; long articles are split only at item boundaries

# ---------------------------------------------------------------- ordinals
UNITS = ['', 'الاولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة']
UNITS_COMPOUND = dict(enumerate(UNITS))
UNITS_COMPOUND[1] = 'الحادية'
TENS = {20: 'العشرون', 30: 'الثلاثون', 40: 'الاربعون', 50: 'الخمسون', 60: 'الستون', 70: 'السبعون', 80: 'الثمانون', 90: 'التسعون'}


def norm_hamza(s):
    return re.sub('[أإآ]', 'ا', s)


ORDINALS = {}
for n in range(1, 100):
    if n < 10:
        names = [UNITS[n]]
    elif n == 10:
        names = ['العاشرة']
    elif n < 20:
        names = [UNITS_COMPOUND[n - 10] + ' عشرة', UNITS_COMPOUND[n - 10] + ' عشر']
    elif n % 10 == 0:
        names = [TENS[n]]
    else:
        names = [UNITS_COMPOUND[n % 10] + ' و' + TENS[n - n % 10]]
    for name in names:
        ORDINALS[name] = n
ORD_RE = '|'.join(sorted((re.escape(k) for k in ORDINALS), key=len, reverse=True))
ORD_HEADING = re.compile(r'^المادة\s+(' + ORD_RE + r')\s*(?::\s*(.*))?$')
NUM_HEADING = re.compile(r'^المادة\s*(?::\s*(\d+)|(\d+)\s*:)\s*(.*)$')


def ordinal_label(n):
    for k, v in ORDINALS.items():
        if v == n:
            return k
    return str(n)


# ---------------------------------------------------------------- loading
def load_pages(doc):
    pages = {}
    if doc['text'] == 'extracted':
        for f in sorted(glob.glob(os.path.join(SRC, 'extracted', doc['id'], 'p-*.txt'))):
            n = int(re.search(r'p-(\d+)', f).group(1))
            pages[n] = open(f, encoding='utf-8').read().splitlines()
    else:
        cur = None
        for line in open(os.path.join(SRC, 'text', doc['id'] + '.txt'), encoding='utf-8'):
            line = line.rstrip('\n')
            if line.startswith('#'):
                continue
            m = re.match(r'^=== PAGE (\d+)', line)
            if m:
                cur = int(m.group(1))
                pages[cur] = []
                continue
            if cur is not None:
                pages[cur].append(line)
    return pages


def clean_lines(doc, pages):
    """Yield (page, line) after dropping running headers, page numbers, site chrome."""
    did = doc['id']
    for p in sorted(pages):
        for raw in pages[p]:
            line = re.sub(r'\s+', ' ', raw).strip()
            if not line:
                continue
            if re.fullmatch(r'\d{1,3}', line):
                continue  # printed page number
            if did == 'press-law' and line.startswith('تاريخ الطباعة'):
                continue
            if did == 'av-media-exec-reg' and re.match(r'^\d+ اللائحة التنفيذية', line):
                continue
            if did == 'age-rating' and line.startswith('هل استفدت'):
                return
            yield p, line


# ---------------------------------------------------------------- segmentation
PRESS_LAW_SECTIONS = {'المطبوعات الداخلية', 'المطبوعات الخارجية', 'الصحافة المحلية', 'الجزاءات', 'أحكام عامة'}
AGE_HEADINGS = re.compile(r'^(\((?:G|PG|PG12|PG15|R15|R18)\):.*|ألعاب مناسبة لعمر \d+ فما فوق|التصنيف العمري للأفلام السينمائية|التصنيف العمري للألعاب الإلكترونية)$')


def segment_articles(doc, lines):
    """Return list of articles: dict(number, label, title, chapter, lines=[(page,line)])."""
    arts, cur, chapter, last_num = [], None, '', 0
    part = ''  # الباب (outer level), kept alongside الفصل
    scheme = doc['segmenter']
    pending_chapter = None
    for p, line in lines:
        heading = None
        if scheme == 'ordinal':
            m = ORD_HEADING.match(norm_hamza(line))
            if m:
                n = ORDINALS[m.group(1)]
                if n == last_num + 1:
                    title = line.split(':', 1)[1] if ':' in line else ''
                    heading = (n, line.split(':')[0].strip(), title.strip().rstrip(':').strip())
        elif scheme == 'numeric':
            m = NUM_HEADING.match(line)
            if m:
                n = int(m.group(1) or m.group(2))
                if n == last_num + 1:
                    heading = (n, f'المادة {n}', m.group(3).strip())
        if heading:
            n, label, title = heading
            cur = {'number': n, 'label': label, 'title': title, 'chapter': chapter, 'lines': []}
            arts.append(cur)
            last_num = n
            continue
        # chapter / section headings
        if re.match(r'^(الفصل|الباب) ', line) and len(line) < 70:
            h = line.replace(':', ': ').replace('  ', ' ').strip(' :')
            if h.startswith('الباب'):
                part, chapter = h, h
            else:
                chapter = (part + ' › ' + h) if part else h
            pending_chapter = scheme == 'numeric' and ':' not in line
            continue
        if pending_chapter and cur is not None and len(line) < 60 and not re.match(r'^\d', line):
            # "الفصل الأول" followed by its title on the next line
            chapter = chapter + ': ' + line
            if chapter.startswith('الباب') and '›' not in chapter:
                part = chapter
            pending_chapter = False
            continue
        pending_chapter = False
        if doc['id'] == 'press-law' and line in PRESS_LAW_SECTIONS:
            chapter = line
            continue
        if cur is not None:
            cur['lines'].append((p, line))
    # numeric continuity check
    for i, a in enumerate(arts, 1):
        assert a['number'] == i, (doc['id'], i, a['number'])
    # article title on the line after a bare heading (e.g. "المادة الخامسة:")
    for a in arts:
        if not a['title'] and a['lines'] and doc['id'] == 'av-media-exec-reg' and a['lines'][0][1].endswith(':') and len(a['lines'][0][1]) < 90:
            a['title'] = a['lines'][0][1].rstrip(':')
            a['lines'] = a['lines'][1:]
    return arts


def segment_headings(doc, lines):
    arts, cur = [], {'number': None, 'label': 'مقدمة', 'title': 'التصنيف العمري', 'chapter': '', 'lines': []}
    arts.append(cur)
    chapter = ''
    for p, line in lines:
        if line == 'التصنيف العمري':
            continue
        if line.startswith('ايميل الألعاب') or line.startswith('Gmedia.gov.sa'):
            continue
        m = AGE_HEADINGS.match(line)
        if m:
            if line.startswith('التصنيف العمري لل'):
                chapter = line
                continue
            cur = {'number': None, 'label': line.split(':')[0] if line.startswith('(') else line,
                   'title': line, 'chapter': chapter, 'lines': []}
            arts.append(cur)
            continue
        cur['lines'].append((p, line))
    return arts


# ---------------------------------------------------------------- text helpers
def join_lines(lines):
    """Re-flow PDF lines into paragraphs. New paragraph at numbered/lettered items."""
    out = []
    for _, line in lines:
        starts_item = re.match(r'^(\d+\s*[-)]|[أ-ي]\s*[-)]|•)', line)
        if out and not starts_item and not out[-1].endswith(':'):
            out[-1] = out[-1] + ' ' + line
        else:
            out.append(line)
    return out


ITEM_RE = re.compile(r'^(\d+\s*[-)]|[أ-ي]\s*[-)]|•)')


def chunk_article(paras):
    """Split an article's paragraphs into chunks that never cut an item.
    Returns (lead, [chunk_paragraph_lists])."""
    lead_n = 0
    while lead_n < len(paras) and not ITEM_RE.match(paras[lead_n]):
        lead_n += 1
    lead = paras[:lead_n]
    items = paras[lead_n:]
    total = sum(len(x) for x in paras)
    if total <= MAX_CHUNK or not items:
        return lead, [paras]
    chunks, cur, size = [], [], 0
    for para in items:
        if cur and size + len(para) > MAX_CHUNK and re.match(r'^(\d+\s*[-)]|•)', para):
            chunks.append(cur)
            cur, size = [], 0
        cur.append(para)
        size += len(para)
    if cur:
        chunks.append(cur)
    chunks[0] = lead + chunks[0]
    return lead, chunks


REF_RE = re.compile(r'المادة\s*\(?\s*(\d+|' + ORD_RE + r')\s*\)?\s*(?:من\s*)?(النظام|هذا النظام|هذه اللائحة|اللائحة|التنظيم)?')
PARENT = {'press-law-exec-reg': 'press-law', 'av-media-exec-reg': 'av-media-law'}


def find_refs(doc_id, text, self_num):
    refs = set()
    for m in REF_RE.finditer(norm_hamza(text)):
        tok, scope = m.group(1), m.group(2)
        n = int(tok) if tok.isdigit() else ORDINALS.get(tok)
        if not n:
            continue
        if scope in ('النظام', 'هذا النظام') and doc_id in PARENT:
            target = PARENT[doc_id]
        elif scope in ('النظام', 'هذا النظام', 'هذه اللائحة', 'اللائحة', 'التنظيم') or scope is None:
            target = doc_id
        else:
            continue
        if scope is None and doc_id in PARENT:
            continue  # ambiguous bare reference inside a regulation
        if target == doc_id and n == self_num:
            continue
        refs.add(f'{target}:{n}')
    return sorted(refs)


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


# ---------------------------------------------------------------- main
def main():
    meta = json.load(open(os.path.join(SRC, 'documents.json'), encoding='utf-8'))
    docs_out, segs_out = [], []
    for doc in meta['documents']:
        pages = load_pages(doc)
        lines = list(clean_lines(doc, pages))
        arts = segment_headings(doc, lines) if doc['segmenter'] == 'headings' else segment_articles(doc, lines)
        off = doc.get('printed_page_offset')
        nc_from = doc.get('noncitable_from_page')
        n_seg = 0
        for ai, a in enumerate(arts):
            if not a['lines']:
                continue
            # annex material after the last article (tables) is stored as non-citable
            art_lines = a['lines']
            annex_lines = []
            if nc_from:
                annex_lines = [l for l in art_lines if l[0] >= nc_from]
                art_lines = [l for l in art_lines if l[0] < nc_from]
            paras = join_lines(art_lines)
            full_text = '\n'.join(paras)
            base_id = f"{doc['id']}:{a['number']}" if a['number'] else f"{doc['id']}:s{ai}"
            lead, chunks = chunk_article(paras)
            refs = find_refs(doc['id'], full_text, a['number'])
            for ci, ch in enumerate(chunks):
                text = '\n'.join(ch)
                # pages actually covered by this chunk
                pg = [p for p, l in art_lines if any(l in para for para in ch)] or [art_lines[0][0]]
                seg = {
                    'id': base_id if len(chunks) == 1 else f'{base_id}#{ci + 1}',
                    'doc': doc['id'],
                    'article': a['number'],
                    'label': a['label'],
                    'title': a['title'],
                    'chapter': a['chapter'],
                    'page_start': min(pg), 'page_end': max(pg),
                    'text': text,
                    'lead': '\n'.join(lead) if ci > 0 and lead else '',
                    'part': [ci + 1, len(chunks)] if len(chunks) > 1 else None,
                    'refs': refs,
                    'citable': True,
                }
                if off:
                    seg['printed_start'] = seg['page_start'] - off
                    seg['printed_end'] = seg['page_end'] - off
                segs_out.append(seg)
                n_seg += 1
            if annex_lines:
                segs_out.append({
                    'id': f"{doc['id']}:annex", 'doc': doc['id'], 'article': None,
                    'label': 'الملاحق (أ) و(ب)', 'title': 'دليل التراخيص وجدول المخالفات — جداول',
                    'chapter': 'الملاحق', 'page_start': min(p for p, _ in annex_lines),
                    'page_end': max(p for p, _ in annex_lines), 'text': '\n'.join(l for _, l in annex_lines),
                    'lead': '', 'part': None, 'refs': [], 'citable': False,
                    'note': 'جداول استُخرجت دون الحفاظ على ترتيب الأعمدة؛ غير معتمدة للاقتباس. راجع الملف الأصلي.'})
        path = os.path.join(SRC, 'pdf', doc['file'])
        d = {k: doc[k] for k in ('id', 'title', 'category', 'issuer', 'version', 'currency', 'currency_note', 'extraction', 'official_url')}
        d.update({
            'file': 'sources/' + doc['file'],
            'sha256': sha256(path),
            'reviewed_on': meta['reviewed_on'],
            'articles': sum(1 for a in arts if a['number']),
            'segments': n_seg,
            'pages': max(pages) if pages else 0,
        })
        docs_out.append(d)
        print(f"{doc['id']:22s} articles={d['articles']:3d} segments={n_seg:3d}", file=sys.stderr)
    # resolve refs to segment ids that exist
    ids = {s['id'] for s in segs_out}
    base = {}
    for s in segs_out:
        base.setdefault(s['id'].split('#')[0], []).append(s['id'])
    for s in segs_out:
        s['refs'] = [r for r in s['refs'] if r in base]
    out = {
        'schema': 1,
        'reviewed_on': meta['reviewed_on'],
        'documents': docs_out,
        'excluded': meta['excluded'],
        'segments': segs_out,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
    print(f'wrote {OUT}: {len(segs_out)} segments, {os.path.getsize(OUT)//1024} KB', file=sys.stderr)


if __name__ == '__main__':
    main()
