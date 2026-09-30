"""Compose frame.png: one 1920x1080 frame cut into five vertical bands, rung 1 on
the left to rung 5 on the right. The camera is identical, so the hill line runs
unbroken across the seams. Seams avoid cutting Clawd (1115-1245) and the sun.

usage: python3 slices.py
"""
from PIL import Image

D = "C:/Users/USER/Projects/shelter-mv/style-frames/10-world-ladder/"
seams = [0, 384, 768, 1096, 1436, 1920]
out = Image.new("RGB", (1920, 1080))
for i in range(5):
    im = Image.open(f"{D}rung{i + 1}.png").convert("RGB")
    box = (seams[i], 0, seams[i + 1], 1080)
    out.paste(im.crop(box), box[:2])
out.save(D + "frame.png")
print("saved frame.png")
