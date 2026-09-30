"""Compose researcher A's head sprite (facing right, tilted down toward Clawd;
warm key from lower right, cool moon rim from upper left) from explicit spans
and hand-placed pixels, print it as ASCII rows for frame.html, and preview it.

python3 headgen.py                -> prints rows, writes head_prev.png
python3 headgen.py preview F OUT  -> preview rows from a text file
"""
import sys
from PIL import Image

W, H = 27, 29
g = [['.'] * W for _ in range(H)]


def inside(x, y, cx, cy, r):
    return (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r


# ---- regions ---------------------------------------------------------------
REG = [['.'] * W for _ in range(H)]
for y in range(H):
    for x in range(W):
        if inside(x, y, 5.5, 4.5, 4.3):
            REG[y][x] = 'B'
        if inside(x, y, 12.5, 14.5, 10.5):
            REG[y][x] = 'H'
FACE = {10: (20, 21), 11: (16, 22), 12: (13, 22), 13: (12, 22), 14: (12, 23), 15: (12, 24),
        16: (12, 23), 17: (12, 22), 18: (12, 22), 19: (12, 21), 20: (13, 21), 21: (14, 20),
        22: (15, 20), 23: (16, 19), 24: (16, 17)}
for y, (a, b) in FACE.items():
    for x in range(a, b + 1):
        REG[y][x] = 'F'
EAR = {13: (10, 11), 14: (9, 11), 15: (9, 11), 16: (9, 11), 17: (10, 11)}
for y, (a, b) in EAR.items():
    for x in range(a, b + 1):
        REG[y][x] = 'E'
NECK = {22: (11, 14), 23: (11, 15), 24: (10, 15), 25: (9, 14), 26: (9, 14), 27: (8, 13), 28: (8, 13)}
for y, (a, b) in NECK.items():
    for x in range(a, b + 1):
        if REG[y][x] in '.H':
            REG[y][x] = 'N'
# hair below row 20 only behind the jaw (nape)
for y in range(20, H):
    for x in range(W):
        if REG[y][x] == 'H' and x > {20: 12, 21: 13, 22: 10, 23: 10, 24: 9}.get(y, 8):
            REG[y][x] = '.'


def R(x, y):
    return REG[y][x] if 0 <= x < W and 0 <= y < H else '.'


# ---- hair ------------------------------------------------------------------
for y in range(H):
    for x in range(W):
        if R(x, y) not in 'HB':
            continue
        c = '2'
        up, lf = R(x, y - 1) == '.', R(x - 1, y) == '.'
        dn, rt = R(x, y + 1) == '.', R(x + 1, y) == '.'
        if up or lf:
            c = '5'
            if (up and x < 11) or (lf and y < 9):
                c = '7'
        elif dn or rt:
            c = '1'
        g[y][x] = c
# bun seam against the skull
for (x, y) in [(8, 5), (8, 6), (7, 7), (6, 8), (5, 8)]:
    if R(x, y) in 'HB':
        g[y][x] = '1'
# strands (flow from the forehead back to the bun)
for pts in ([(19, 9), (18, 8), (17, 7), (16, 7), (15, 6), (14, 6), (13, 5)],
            [(16, 11), (15, 10), (14, 9), (13, 9), (12, 8), (11, 8), (10, 7)],
            [(12, 12), (11, 11), (10, 11), (9, 10), (8, 10)],
            [(3, 2), (4, 1), (5, 1)], [(2, 5), (2, 4), (3, 3)]):
    for (x, y) in pts:
        if R(x, y) in 'HB' and g[y][x] == '2':
            g[y][x] = '3'
# fringe tip catching Clawd's light
for (x, y, c) in [(20, 10, 'b'), (19, 10, 'a'), (17, 11, 'a'), (21, 9, 'a')]:
    if R(x, y) in 'HB':
        g[y][x] = c

# ---- skin ------------------------------------------------------------------
for y, (a, b) in FACE.items():
    for x in range(a, b + 1):
        d = b - x
        if y <= 11:
            c = 's' if d == 0 else 'r'
        elif d == 0:
            c = 't'
        elif d <= 3:
            c = 's'
        elif x <= a:
            c = 'q'
        else:
            c = 'r'
        g[y][x] = c
for y, (a, b) in EAR.items():
    for x in range(a, b + 1):
        g[y][x] = 'q'
g[15][10] = 'p'
g[16][10] = 'p'
g[14][11] = 'r'
g[15][11] = 'r'
for y, (a, b) in NECK.items():
    for x in range(a, b + 1):
        if REG[y][x] == 'N':
            g[y][x] = 'r' if x == b else 'q'
for (x, y) in [(11, 22), (12, 22), (13, 22), (14, 22), (11, 23), (12, 23), (15, 23)]:
    if REG[y][x] == 'N':
        g[y][x] = 'p'

# features: downcast eye, brow, nose, mouth, chin light
for (x, y, c) in [
    (18, 14, 'e'), (19, 14, 'p'), (17, 13, 'p'), (20, 13, 'q'),       # lid line (convex down) + lash
    (18, 13, 'r'), (19, 13, 'r'),
    (19, 12, 'q'), (20, 12, 'q'),                                     # soft brow
    (22, 13, 's'), (22, 14, 't'), (23, 14, 't'), (24, 15, 'v'), (23, 15, 't'),
    (22, 16, 'q'), (23, 16, 't'),                                     # nose + nostril
    (21, 17, 's'), (22, 17, 't'),
    (20, 19, 'p'), (21, 18, 's'), (21, 19, 't'), (20, 20, 's'), (21, 20, 'v'),   # mouth + lower lip
    (20, 22, 't'), (19, 23, 'v'), (20, 21, 's'),                                  # chin
    (10, 13, 'q'), (11, 13, 'r'), (9, 14, 'q'), (10, 14, 'r'), (11, 14, 's'),     # ear
    (9, 15, 'q'), (10, 15, 'p'), (11, 15, 'r'), (9, 16, 'q'), (10, 16, 'p'), (11, 16, 'r'),
    (10, 17, 'q'), (11, 17, 'r'),
]:
    g[y][x] = c
# moonlit sheen band on the crown and bun (clumped strands)
for (x, y) in [(7, 6), (8, 6), (9, 5), (10, 5), (11, 5), (6, 7), (7, 7), (5, 9), (5, 10), (4, 11),
               (12, 6), (13, 6), (4, 12), (3, 2), (4, 2), (2, 4), (2, 5)]:
    if REG[y][x] in 'HB' and g[y][x] in '23':
        g[y][x] = '4'
for (x, y) in [(9, 6), (8, 7), (6, 9), (3, 3)]:
    if REG[y][x] in 'HB' and g[y][x] in '234':
        g[y][x] = '5'

KEY = {'1': '#12121c', '2': '#1a1a28', '3': '#232335', '4': '#2d2e43', '5': '#3a3c54', '6': '#4a4d67',
       '7': '#5d617b', '8': '#747a92', 'a': '#3f2229', 'b': '#5e2e31', 'c': '#86403c',
       'p': '#3b2b35', 'q': '#5c424a', 'r': '#82605f', 's': '#a98176', 't': '#cfa591', 'v': '#f6c296',
       'e': '#12121c', 'm': '#86403c', 'w': '#fde8cc', 'o': '#0a0a12'}


def save_preview(rows, outp):
    w = max(len(r) for r in rows)
    im = Image.new('RGB', (w, len(rows)), (35, 35, 53))
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch in KEY:
                h = KEY[ch]
                im.putpixel((x, y), tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)))
    im.resize((w * 14, len(rows) * 14), Image.NEAREST).save(outp)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'preview':
        rows = [ln.strip().strip(',').strip("'") for ln in open(sys.argv[2], encoding='utf-8') if ln.strip().startswith("'")]
        save_preview(rows, sys.argv[3])
    else:
        rows = [''.join(r) for r in g]
        for r in rows:
            print("    '" + r + "',")
        save_preview(rows, 'C:/Users/USER/Projects/shelter-mv/style-frames/09-style-pixel/head_prev.png')
