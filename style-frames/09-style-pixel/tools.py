"""Helpers for inspecting the pixel frame.

python3 tools.py zoom SRC X Y W H Z OUT   -> crop native-res region (native coords) and upscale by Z (nearest)
python3 tools.py check SRC                 -> verify 4x4 block structure and count colours
python3 tools.py detail SRC X Y SIZE OUT   -> 1:1 crop of the 1920x1080 frame (output-pixel coords)
"""
import sys
import numpy as np
from PIL import Image


def native(src):
    a = np.asarray(Image.open(src).convert('RGB'))
    return a, a[::4, ::4]


def main():
    cmd = sys.argv[1]
    if cmd == 'zoom':
        src, x, y, w, h, z, out = sys.argv[2], *map(int, sys.argv[3:8]), sys.argv[8]
        _, n = native(src)
        crop = Image.fromarray(np.ascontiguousarray(n[y:y + h, x:x + w]))
        crop.resize((w * z, h * z), Image.NEAREST).save(out)
        print('saved', out, crop.size, '->', (w * z, h * z))
    elif cmd == 'check':
        a, n = native(sys.argv[2])
        up = np.repeat(np.repeat(n, 4, 0), 4, 1)
        same = np.array_equal(up, a)
        cols = np.unique(n.reshape(-1, 3), axis=0)
        print('size', a.shape, 'exact 4x4 blocks:', same, 'unique colours:', len(cols))
        if not same:
            diff = np.any(up != a, axis=2)
            print('mismatched output pixels:', int(diff.sum()))
    elif cmd == 'detail':
        src, x, y, s, out = sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]), sys.argv[6]
        im = Image.open(src).convert('RGB')
        im.crop((x, y, x + s, y + s)).save(out)
        print('saved', out)


if __name__ == '__main__':
    main()
