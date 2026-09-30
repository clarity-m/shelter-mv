"""Contact sheet of a rendered clip, for reviewing motion without watching it.

usage: python3 render/sheet.py out/shots/S21.mp4 [N=12] [COLS=4]
Writes out/shots/S21_sheet.png: N evenly spaced frames, each labelled with its local frame,
global frame and bar.beat (global frame = shot f0 + local, read from shots.json).
"""
import json, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path("C:/Users/USER/Projects/shelter-mv")
clip = Path(sys.argv[1]) if Path(sys.argv[1]).is_absolute() else ROOT / sys.argv[1]
N = int(sys.argv[2]) if len(sys.argv) > 2 else 12
COLS = int(sys.argv[3]) if len(sys.argv) > 3 else 4
TW, TH = 480, 270

n = int(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries",
                        "stream=nb_read_packets", "-of", "csv=p=0", str(clip)], capture_output=True, text=True).stdout.strip())
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(clip), "-vf", f"scale={TW}:{TH}", "-f", "rawvideo",
                      "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
frames = [raw[i * TW * TH * 3:(i + 1) * TW * TH * 3] for i in range(n)]

sid = clip.stem.split("_")[0]
f0 = 0
try:
    shots = json.loads((ROOT / "shots.json").read_text(encoding="utf-8"))["shots"]
    s = next(x for x in shots if x["id"] == sid)
    b0 = s["bars"][0]
    t0 = 0.0 if b0 <= 1 else 0.38 + (b0 - 1) * 2.4
    f0 = round(t0 * 30) + s.get("shift0", 0)
    if "_" in clip.stem and "-" in clip.stem.split("_")[1]:
        f0 = int(clip.stem.split("_")[1].split("-")[0])
except Exception:
    pass

idx = [round(i * (n - 1) / max(N - 1, 1)) for i in range(N)]
rows = (N + COLS - 1) // COLS
sheet = Image.new("RGB", (COLS * TW, rows * (TH + 22)), (12, 12, 12))
d = ImageDraw.Draw(sheet)
font = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 15)
for k, i in enumerate(idx):
    im = Image.frombytes("RGB", (TW, TH), frames[i])
    x, y = (k % COLS) * TW, (k // COLS) * (TH + 22)
    sheet.paste(im, (x, y))
    g = f0 + i
    bar = 1 + (g / 30 - 0.38) / 2.4
    beat = int(((bar - int(bar)) * 4)) + 1
    d.text((x + 6, y + TH + 3), f"local {i}  f{g}  bar {int(bar)}.{beat}", font=font, fill=(230, 225, 215))
out = clip.with_name(clip.stem + "_sheet.png")
sheet.save(out)
print(f"wrote {out} ({n} frames, showing {N})")
