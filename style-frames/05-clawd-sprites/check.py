# Validate sprite grids in clawd-sprites.js: every array of quoted rows must be rectangular.
import re, sys
src = open('C:/Users/USER/Projects/shelter-mv/style-frames/05-clawd-sprites/clawd-sprites.js', encoding='utf-8').read()
blocks = re.findall(r"(?:const\s+(\w+)\s*=\s*\[|(\w+):\s*\[)\s*\n((?:\s*'[^'\n]*',\s*\n)+)", src)
bad = 0
for a, b, body in blocks:
    name = a or b
    rows = re.findall(r"'([^'\n]*)'", body)
    widths = {len(r) for r in rows}
    ok = len(widths) == 1
    exp = None
    if len(rows) == 8: exp = 22
    if name == 'PX2': exp = 36
    if name == 'GLYPH': exp = 18
    if exp and widths != {exp}: ok = False
    print(f"{name:16s} {len(rows)}x{sorted(widths)} {'OK' if ok else 'BAD'}")
    if not ok: bad += 1
    if len(sys.argv) > 1:
        for r in rows: print('   ', r)
print('bad:', bad)
