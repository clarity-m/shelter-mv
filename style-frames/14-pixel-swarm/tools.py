"""Helpers for inspecting the pixel frame.

python3 tools.py zoom SRC X Y W H Z OUT   -> crop a native-res region (native coords), upscale by Z (nearest)
python3 tools.py check SRC                 -> verify the 4x4 block structure and count colours
python3 tools.py thumb SRC OUT             -> 320x180 box-filtered thumbnail
python3 tools.py stats SRC                 -> luminance stats (how much of the frame is dark)
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
    elif cmd == 'thumb':
        im = Image.open(sys.argv[2]).convert('RGB')
        im.resize((320, 180), Image.BOX).save(sys.argv[3])
        print('saved', sys.argv[3])
    elif cmd == 'stats':
        a = np.asarray(Image.open(sys.argv[2]).convert('RGB')).astype(np.float64) / 255
        lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
        for t in (0.05, 0.1, 0.2, 0.4, 0.7):
            print(f'fraction of frame with luminance < {t}: {np.mean(lum < t):.3f}')
        print('mean luminance', round(float(lum.mean()), 4), 'max', round(float(lum.max()), 4))


if __name__ == '__main__':
    main()
