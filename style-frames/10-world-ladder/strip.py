"""Compose ladder-strip.png: the five rungs side by side, with small labels.

usage: python3 strip.py [prefix]      reads rung1.png..rung5.png (or <prefix>1.png..)
"""
import sys
from PIL import Image, ImageDraw, ImageFont

D = "C:/Users/USER/Projects/shelter-mv/style-frames/10-world-ladder/"
prefix = sys.argv[1] if len(sys.argv) > 1 else "rung"
out = sys.argv[2] if len(sys.argv) > 2 else "ladder-strip.png"
names = ["PIXEL", "VECTOR", "DIMENSION", "LUMINOUS", "LIGHT"]
tw, th = 960, 540
gap, top, bottom, side = 16, 0, 64, 16
W = side * 2 + tw * 5 + gap * 4
H = top + th + bottom
strip = Image.new("RGB", (W, H), (19, 18, 17))
dr = ImageDraw.Draw(strip)
try:
    font = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 20)
    fontb = ImageFont.truetype("C:/Windows/Fonts/consolab.ttf", 20)
except OSError:
    font = fontb = ImageFont.load_default()
for i in range(5):
    im = Image.open(f"{D}{prefix}{i + 1}.png").convert("RGB")
    # rung 1 is pixel art: keep it crisp when halving
    im = im.resize((tw, th), Image.NEAREST if i == 0 else Image.LANCZOS)
    x = side + i * (tw + gap)
    strip.paste(im, (x, top))
    dr.text((x, top + th + 20), f"{i + 1:02d}", fill=(217, 119, 87), font=fontb)
    dr.text((x + 44, top + th + 20), names[i], fill=(235, 228, 220), font=font)
strip.save(D + out)
print("saved", out, strip.size)
