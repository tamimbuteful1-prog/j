"""Map Persian/Urdu letter variants produced by NFKC of Chrome-printed PDFs to
the Arabic letters they display as (ی→ي, ھ→ه, ک→ك), and repair the one glyph
sequence the font has no Unicode for (ي + shadda-tanween + ا, rendered as U+FFFD)."""
import sys, glob, os
TABLE = str.maketrans({'ی': 'ي', 'ھ': 'ه', 'ک': 'ك', 'ە': 'ه'})
for d in sys.argv[1:]:
    for f in glob.glob(os.path.join(d, 'p-*.txt')):
        s = open(f, encoding='utf-8').read().translate(TABLE)
        s = s.replace('ي�ا', 'يًّا')
        assert '�' not in s, f
        open(f, 'w', encoding='utf-8').write(s)
