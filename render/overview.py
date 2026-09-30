"""Overview sheet of the current cut: one frame per shot (from out/film.mp4), labelled for review.

usage: python3 render/overview.py [POS=0.6]  ->  out/overview.png
Each tile is the frame POS of the way through its shot, labelled with the shot id, its bars,
its time range and a short title. Titles live here; update them when a shot's content changes.
"""
import json, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path("C:/Users/USER/Projects/shelter-mv")
POS = float(sys.argv[1]) if len(sys.argv) > 1 else 0.6
TW, TH, LAB, COLS = 400, 225, 44, 6

TITLES = {
    "S01": "cursor draws the starburst, paper folds in", "S02": "burst folds into Clawd, fly through",
    "S03": "1D token world", "S04": "attention arcs", "S05": "loss curve, counters",
    "S06": "GPU rack (outside)", "S07": "new layers", "S08": "lab in the hook, push into screen",
    "S10": "pixel: explore, fail, block, flag", "S11": "physics: eased ramp, then steep alone",
    "S12": "white field gains depth", "S13": "the cursor draws the valley; explore", "S14": "the cursor draws crater, ice shore",
    "S15": "wall: cursors building worlds", "S16": "the GPU hall, dark (outside)", "S17": "dive back into one world (1 bar)",
    "S18": "catch, first edits, ten cursors", "S19": "hill rises, tree grows",
    "S20": "paints a funnel world > lab", "S25b": "knot's glow pours into a vial",
    "S34": "a compute card, a server farm", "S35": "die > hall > campus of halls",
    "S36": "aurora sea, sun into a ring", "S21": "the core lands, reactor ignites",
    "S23": "city online, satellite ring", "S26": "observatory, the two stars", "S27": "elevator blueprint, force diagram", "S29": "star trails, release, fleet",
    "S30": "leaving the solar system / build", "S31": "the shelter", "S32": "pull-back to the swarm",
    "S33": "starburst folds shut",
}

shots = json.loads((ROOT / "shots.json").read_text(encoding="utf-8"))["shots"]
def fbar(b): return round((0.38 + 2.4 * (b - 1)) * 30)
spans = []
for s in shots:
    b0, b1 = s["bars"]
    f0 = (0 if b0 <= 1 else fbar(b0)) + s.get("shift0", 0)
    f1 = (6532 if b1 >= 91 else fbar(b1 + 1)) + s.get("shift1", 0)
    spans.append((s, f0, f1))
frames = [int(f0 + POS * (f1 - f0 - 1)) for _, f0, f1 in spans]
sel = "+".join(f"eq(n\\,{f})" for f in frames)
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(ROOT / "out" / "film.mp4"), "-vf",
                      f"select='{sel}',scale={TW}:{TH}", "-fps_mode", "passthrough", "-f", "rawvideo",
                      "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
rows = (len(spans) + COLS - 1) // COLS
sheet = Image.new("RGB", (COLS * TW, rows * (TH + LAB)), (16, 16, 20))
d = ImageDraw.Draw(sheet)
try:
    f1b = ImageFont.truetype("C:/Windows/Fonts/consolab.ttf", 17)
    f2 = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 15)
except OSError:
    f1b = f2 = ImageFont.load_default()
mmss = lambda f: f"{int(f / 30 // 60)}:{f / 30 % 60:04.1f}"
for i, (s, f0, f1) in enumerate(spans):
    x, y = (i % COLS) * TW, (i // COLS) * (TH + LAB)
    chunk = raw[i * TW * TH * 3:(i + 1) * TW * TH * 3]
    if len(chunk) == TW * TH * 3:
        sheet.paste(Image.frombytes("RGB", (TW, TH), chunk), (x, y))
    b0, b1 = s["bars"]
    bars = f"bar {b0}" if b0 == b1 else f"bars {b0}-{b1}"
    d.text((x + 6, y + TH + 3), f"{s['id']}  {bars}  {mmss(f0)}-{mmss(f1)}", fill=(255, 214, 190), font=f1b)
    d.text((x + 6, y + TH + 23), TITLES.get(s["id"], ""), fill=(210, 210, 215), font=f2)
out = ROOT / "out" / "overview.png"
# save beside it, then swap it in: an image viewer holding overview.png open can make a direct save fail
import os, time
tmp = out.with_name("overview_tmp.png")
sheet.save(tmp)
for k in range(10):
    try:
        os.replace(tmp, out)
        break
    except OSError:
        time.sleep(1.0)
else:
    alt = out.with_name(time.strftime("overview_%m%d_%H%M.png"))
    os.replace(tmp, alt)
    out = alt
    print("overview.png is locked (open in a viewer?); wrote", alt.name, "instead")
print(out, len(spans), "shots")
