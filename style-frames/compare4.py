"""Round 4 comparison sheets (run with python3 after the agents finish).

compare4-paper.png   the three paper frames + hands detail (does it read as one film?)
compare4-swarm.png   paper swarm vs pixel swarm, same shot
compare4-cuts.png    montage test at thumbnail size: inside/outside alternation as in
                     bars 53-80, and the verse-1 lab -> first-environment cut,
                     once with paper outside and once with pixel outside
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

R = Path("C:/Users/USER/Projects/shelter-mv/style-frames")
F = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 22)
FS = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 15)


def load(rel, size):
    p = R / rel
    if p.exists():
        return Image.open(p).convert("RGB").resize(size, Image.LANCZOS)
    im = Image.new("RGB", size, (40, 40, 40))
    ImageDraw.Draw(im).text((10, 10), "missing: " + rel, font=FS, fill=(200, 80, 80))
    return im


def grid(cells, cols, size, label_h, out, bg=(16, 16, 16)):
    rows = (len(cells) + cols - 1) // cols
    W, H = size
    sheet = Image.new("RGB", (cols * W, rows * (H + label_h)), bg)
    d = ImageDraw.Draw(sheet)
    for i, (rel, label) in enumerate(cells):
        x, y = (i % cols) * W, (i // cols) * (H + label_h)
        sheet.paste(load(rel, size), (x, y))
        d.text((x + 8, y + H + 4), label, font=F if label_h > 26 else FS, fill=(230, 225, 215))
    sheet.save(R / out)


grid([("11-paper-lab/frame.png", "S08 lab (paper)"), ("11-paper-lab/detail.png", "S09 hands (paper)"),
      ("12-paper-fusion/frame.png", "S21 fusion (paper)"), ("13-paper-swarm/frame.png", "S32 swarm (paper)")],
     2, (960, 540), 34, "compare4-paper.png")

grid([("13-paper-swarm/frame.png", "swarm: backlit paper"), ("14-pixel-swarm/frame.png", "swarm: pixel")],
     2, (960, 540), 34, "compare4-swarm.png")

T = (320, 180)
paper_seq = [("10-world-ladder/rung4.png", "in r4"), ("12-paper-fusion/frame.png", "OUT"),
             ("10-world-ladder/rung4.png", "in r4"), ("11-paper-lab/frame.png", "OUT"),
             ("10-world-ladder/rung5.png", "in r5"), ("13-paper-swarm/frame.png", "OUT")]
pixel_seq = [("10-world-ladder/rung4.png", "in r4"), ("09-style-pixel/frame-v2.png", "OUT"),
             ("10-world-ladder/rung4.png", "in r4"), ("09-style-pixel/frame-v2.png", "OUT"),
             ("10-world-ladder/rung5.png", "in r5"), ("14-pixel-swarm/frame.png", "OUT")]
paper_v1 = [("11-paper-lab/frame.png", "OUT lab"), ("10-world-ladder/rung1.png", "in r1 (first env)")]
pixel_v1 = [("09-style-pixel/frame-v2.png", "OUT lab"), ("10-world-ladder/rung1.png", "in r1 (first env)")]
cells = paper_seq + paper_v1 + pixel_seq + pixel_v1
grid(cells, 8, T, 22, "compare4-cuts.png")
print("wrote compare4-paper.png, compare4-swarm.png, compare4-cuts.png (rows: paper outside, pixel outside)")
