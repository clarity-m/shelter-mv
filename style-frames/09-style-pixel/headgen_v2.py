"""v2: faceless version of researcher A's head. Starts from the v1 sprite's
hair and bun, replaces the face with a smooth egg (no nose, eyes or mouth) lit
only by Clawd from the lower right, and lets the hair fall over the ear.
Prints rows for frame-v2.html and writes head_v2_prev.png.
"""
from PIL import Image

V1 = [
    '....777....................',
    '..7733277..................',
    '..7442221..................',
    '.725222227.................',
    '.742222222755555...........',
    '.74222221444232255.........',
    '..72222415224433225........',
    '..712241523222223325.......',
    '....71122223322222325......',
    '...724522222233222232a.....',
    '...5242233222223222ars.....',
    '..72422222332222rrrrrrs....',
    '..52422222223qrrrrrqqst....',
    '..52222222qrqrrrrprrqss....',
    '..5222222qrsqrrrrrepsstt...',
    '..5222222qprqrrrrrrrrsstv..',
    '..5222222qprqrrrrrrrssqt...',
    '..52222222qrqrrrrrrssst....',
    '...522222222qrrrrrrssst....',
    '...522222222qrrrrrsspt.....',
    '....522222222qrrrrsssv.....',
    '.....522222222qrrssss......',
    '......52222ppppqrssst......',
    '.......5122ppqqpsssv.......',
    '.........5qqqqqrst.........',
    '.........qqqqqr............',
    '.........qqqqqr............',
    '........qqqqqr.............',
    '........qqqqqr.............',
]
W, H = 27, len(V1)
g = [list(r) for r in V1]

# smooth egg-shaped face: [left, right] skin columns per row (hair covers the ear)
FACE = {10: (20, 21), 11: (16, 22), 12: (13, 22), 13: (13, 23), 14: (13, 23), 15: (13, 23),
        16: (13, 23), 17: (13, 22), 18: (13, 22), 19: (13, 22), 20: (14, 21), 21: (14, 21),
        22: (15, 20), 23: (16, 19), 24: (16, 17)}
skin = set()
for y, (a, b) in FACE.items():
    for x in range(a, b + 1):
        skin.add((x, y))
# clear old face pixels outside the new egg (nose tip etc.), turn old ear into hair
for y in range(9, 25):
    for x in range(W):
        ch = g[y][x]
        if (x, y) in skin:
            continue
        if ch in 'pqrstvem' and y <= 21 and x <= 12:
            g[y][x] = '2'                      # hair now covers the ear
        elif ch in 'pqrstvem' and x > 12 and y <= 21:
            g[y][x] = '.'                      # outside the egg profile
        elif ch in 'rstv' and y >= 22 and (x, y) not in skin and x > 14:
            g[y][x] = '.'


def is_skin(x, y):
    return (x, y) in skin


# light from Clawd, lower right: bands by position across the face, the
# underside one step brighter because the light comes from below
ORDER = 'qrst'
for (x, y) in skin:
    a_, b_ = FACE[y]
    u = (x - a_) / max(1, b_ - a_)
    if y <= 11:
        c = 's' if x == b_ else 'r'
    else:
        k = 0 if u < 0.2 else 1 if u < 0.6 else 2 if u < 0.88 else 3
        if y >= 20 and k < 3:
            k += 1
        c = ORDER[k]
    g[y][x] = c
# warm kiss of light on the lower curve nearest Clawd
for (x, y) in [(21, 20), (20, 22)]:
    g[y][x] = 'v'
# hair strand falling over the ear, fringe tip keeps its warm edge
for (x, y) in [(11, 12), (11, 13), (12, 14), (12, 15), (12, 16), (11, 17), (10, 18)]:
    if g[y][x] in '12':
        g[y][x] = '3'
for (x, y) in [(12, 17), (12, 18), (12, 19), (13, 20), (13, 21)]:
    if g[y][x] in '2':
        g[y][x] = '1'

g[20][13] = '1'                             # hair edge where the old cheek was
g[24][15] = 'p'                             # shadow under the chin
rows = [''.join(r) for r in g]
for r in rows:
    print("  '" + r + "',")

KEY = {'1': '#12121c', '2': '#1a1a28', '3': '#232335', '4': '#2d2e43', '5': '#3a3c54', '7': '#5d617b',
       'a': '#3f2229', 'b': '#5e2e31', 'p': '#3b2b35', 'q': '#5c424a', 'r': '#82605f', 's': '#a98176',
       't': '#cfa591', 'v': '#f6c296'}
im = Image.new('RGB', (W, H), (35, 35, 53))
for y, r in enumerate(rows):
    for x, ch in enumerate(r):
        if ch in KEY:
            h = KEY[ch]
            im.putpixel((x, y), tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)))
im.resize((W * 14, H * 14), Image.NEAREST).save('C:/Users/USER/Projects/shelter-mv/style-frames/09-style-pixel/head_v2_prev.png')
