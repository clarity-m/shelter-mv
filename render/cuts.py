"""Check every cut: last frame of shot A beside first frame of shot B, for each adjacent
pair in shots.json where both clips exist.

usage: python3 render/cuts.py [S31 S32 ...]   (default: all available pairs)
Writes out/stills/cuts.png: one row per cut, with the mean absolute difference, so jarring
colour or brightness jumps stand out (a hard cut SHOULD differ; a designed continuity cut,
like S02->S03 or S31->S32, should not).
"""
import json, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np

ROOT = Path("C:/Users/USER/Projects/shelter-mv")
TW, TH = 480, 270
shots = json.loads((ROOT / "shots.json").read_text(encoding="utf-8"))["shots"]
ids = [s["id"] for s in shots]
want = set(sys.argv[1:])


def nframes(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries",
                        "stream=nb_read_packets", "-of", "csv=p=0", str(p)], capture_output=True, text=True)
    return int(r.stdout.strip())


def grab(p, idx):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(p), "-vf", f"select=eq(n\\,{idx}),scale={TW}:{TH}",
                          "-fps_mode", "passthrough", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True).stdout
    return Image.frombytes("RGB", (TW, TH), raw)


rows = []
for a, b in zip(ids, ids[1:]):
    pa, pb = ROOT / "out" / "shots" / f"{a}.mp4", ROOT / "out" / "shots" / f"{b}.mp4"
    if not (pa.exists() and pb.exists()):
        continue
    if want and not ({a, b} & want):
        continue
    ia, ib = grab(pa, nframes(pa) - 1), grab(pb, 0)
    d = float(np.abs(np.asarray(ia, float) - np.asarray(ib, float)).mean())
    rows.append((a, b, ia, ib, d))

font = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 16)
sheet = Image.new("RGB", (2 * TW + 10, max(1, len(rows)) * (TH + 24)), (12, 12, 12))
dr = ImageDraw.Draw(sheet)
for k, (a, b, ia, ib, d) in enumerate(rows):
    y = k * (TH + 24)
    sheet.paste(ia, (0, y)); sheet.paste(ib, (TW + 10, y))
    dr.text((6, y + TH + 4), f"{a} last  ->  {b} first    mean |diff| {d:.1f}", font=font, fill=(230, 225, 215))
    print(f"{a} -> {b}: mean abs diff {d:.1f}")
out = ROOT / "out" / "stills" / "cuts.png"
sheet.save(out)
print(f"wrote {out} ({len(rows)} cuts)")
