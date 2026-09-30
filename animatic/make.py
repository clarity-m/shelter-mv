"""Stillmatic: the shot list cut to the song, with style frames standing in.

Reads ../shots.json, ../analysis/{grid,sections}.json; pipes 960x540 30 fps
frames into ffmpeg with Shelter.mp3. Output: animatic/animatic.mp4.
Hard cuts on the drops, dissolves in the soft sections, a freeze on every
bass stutter-stop, a beat counter and a section strip along the bottom.
"""
import json, subprocess, textwrap
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
W, H, FPS = 960, 540, 30
g = json.loads((ROOT / "analysis" / "grid.json").read_text())
sections = json.loads((ROOT / "analysis" / "sections.json").read_text())
shots = json.loads((ROOT / "shots.json").read_text())["shots"]
END_T = sections[-1]["t1"]
N = int(round(END_T * FPS))

BAR, BEAT, T0 = g["bar_s"], g["beat_s"], g["bar1_t"]
bar_t = lambda b: T0 + (b - 1) * BAR
STOP_BARS = [9, 13, 14, 33, 37, 38, 40, 45, 46, 85]  # bass cuts ~0.3 s after beat 4
STOPS = [(bar_t(b) + 1.95, bar_t(b) + 2.28) for b in STOP_BARS]
SOFT = {"verse-1", "pre-1a", "breakdown", "drop-2-vox", "held"}
RUNG_NAME = {0: "1D tokens", 1: "pixel", 2: "vector", 3: "dimension", 3.5: "dimension > luminous",
             4: "luminous", 4.5: "luminous > light", 5: "light", "out": "OUTSIDE (backlit paper)"}
RUNG_COL = {0: (110, 110, 118), 1: (120, 118, 150), 2: (90, 130, 140), 3: (100, 150, 95),
            3.5: (140, 140, 150), 4: (165, 125, 200), 4.5: (200, 140, 150), 5: (217, 119, 87),
            "out": (35, 40, 62)}
ORANGE, WARM, INK = (217, 119, 87), (245, 240, 232), (20, 20, 19)

font_b = ImageFont.truetype("C:/Windows/Fonts/consolab.ttf", 15)
font = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 13)
font_s = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 11)

def placeholder(s):
    """Card for a shot with no style frame yet: a low-res night scene with the
    orange glow that marks Claude's impact, plus the set name."""
    lw, lh = 240, 135
    yy = np.linspace(0, 1, lh)[:, None, None]
    top, bot = np.array([14, 16, 26]), np.array([34, 38, 58])
    img = np.broadcast_to(top + (bot - top) * yy, (lh, lw, 3)).copy()
    img[int(lh * 0.72):] = [22, 24, 36]
    yx = np.mgrid[0:lh, 0:lw]
    r = np.hypot(yx[1] - lw * 0.5, (yx[0] - lh * 0.55) * 1.2)
    glow = np.exp(-(r / 26.0) ** 2)[..., None]
    img = img * (1 - glow) + np.array(ORANGE) * glow
    rng = np.random.default_rng(len(s["set"]))
    img += rng.integers(-6, 7, img.shape)  # dither
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).resize((1920, 1080), Image.NEAREST)
    d = ImageDraw.Draw(im)
    big = ImageFont.truetype("C:/Windows/Fonts/consolab.ttf", 64)
    d.text((960, 820), s["set"].upper(), font=big, fill=WARM, anchor="mm")
    d.text((960, 890), "outside (backlit paper), no frame yet", font=ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 30),
           fill=(170, 170, 185), anchor="mm")
    return im


for s in shots:
    b0, b1 = s["bars"]
    s["t0"] = 0.0 if b0 == 1 else bar_t(b0)
    s["t1"] = END_T if b1 >= 91 else bar_t(b1 + 1)
    s["img"] = Image.open(ROOT / s["still"]).convert("RGB") if s["still"] else placeholder(s)
    s.setdefault("kb", [1.0, 1.08, 0.5, 0.5])
    sec = next(x for x in sections if x["id"] == s["section"])
    s["secname"] = sec["name"]
    s["xf"] = 18 if s["section"] in SOFT else 0


def ease(u):
    return u * u * (3 - 2 * u)


def stop_frozen_time(t):
    """Shot-local clock that stands still during stutter-stops."""
    lost = 0.0
    for a, b in STOPS:
        if t > a:
            lost += min(t, b) - a
    return t - lost


def render_still(s, t):
    im = s["img"]
    iw, ih = im.size
    z0, z1, cx, cy = s["kb"]
    ta, tb = stop_frozen_time(s["t0"]), stop_frozen_time(s["t1"])
    u = (stop_frozen_time(t) - ta) / max(tb - ta, 1e-6)
    z = z0 + (z1 - z0) * ease(min(max(u, 0), 1))
    bw, bh = iw / z, ih / z
    x0 = min(max(cx * iw - bw / 2, 0), iw - bw)
    y0 = min(max(cy * ih - bh / 2, 0), ih - bh)
    return im.resize((W, H), Image.BILINEAR, box=(x0, y0, x0 + bw, y0 + bh))


def shot_at(t):
    for i, s in enumerate(shots):
        if s["t0"] <= t < s["t1"]:
            return i
    return len(shots) - 1


strip = Image.new("RGB", (W, 12))
sd = ImageDraw.Draw(strip)
for s in shots:
    x0, x1 = int(s["t0"] / END_T * W), int(s["t1"] / END_T * W)
    sd.rectangle([x0, 0, x1 - 1, 11], fill=RUNG_COL[s["rung"]])
    sd.line([x0, 0, x0, 11], fill=INK)

ff = subprocess.Popen([
    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
    "-i", str(ROOT / "Shelter.mp3"),
    "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart",
    str(ROOT / "animatic" / "animatic.mp4")], stdin=subprocess.PIPE)

for f in range(N):
    t = f / FPS
    i = shot_at(t)
    s = shots[i]
    frame = render_still(s, t)
    if s["xf"] and i > 0 and t - s["t0"] < s["xf"] / FPS:
        prev = render_still(shots[i - 1], shots[i - 1]["t1"] - 1e-3)
        a = (t - s["t0"]) / (s["xf"] / FPS)
        frame = Image.blend(prev, frame, ease(a))
    if t > END_T - 1.5:
        frame = Image.blend(frame, Image.new("RGB", (W, H), (0, 0, 0)), (t - (END_T - 1.5)) / 1.5)
    in_stop = any(a <= t < b for a, b in STOPS)

    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    d.rectangle([0, 0, W, 62], fill=(12, 12, 12, 170))
    b0, b1 = s["bars"]
    where = RUNG_NAME[s["rung"]] if s["rung"] == "out" else "rung " + RUNG_NAME[s["rung"]]
    head = f"{s['id']}  {s['secname'].upper()}  bars {b0}-{b1}  {where}  set:{s['set']}"
    if s.get("humans"):
        head += f"  [human scene {s['humans']}/3]"
    d.text((12, 6), head, font=font_b, fill=ORANGE + (255,))
    for k, line in enumerate(textwrap.wrap(s["desc"], 128)[:3]):
        d.text((12, 25 + 15 * k), line, font=font, fill=WARM + (235,))
    # bottom HUD: timecode, bar.beat, beat dots, section strip
    bf = (t - T0) / BAR
    bar_no = int(np.floor(bf)) + 1
    beat_no = int(np.floor((bf % 1) * 4)) + 1
    beat_phase = ((t - T0) / BEAT) % 1
    d.rectangle([0, H - 38, 250, H - 12], fill=(12, 12, 12, 150))
    tc = f"{int(t // 60)}:{t % 60:04.1f}  bar {max(bar_no, 0):>2}.{beat_no if t >= T0 else 0}"
    d.text((10, H - 33), tc, font=font_b, fill=WARM + (255,))
    for k in range(4):
        on = (k + 1 == beat_no) and t >= T0
        a = int(255 * (1 - 0.7 * beat_phase)) if on else 60
        col = (ORANGE if k == 0 else WARM) + (a,)
        x = 190 + k * 13
        d.rectangle([x, H - 30, x + 8, H - 20], fill=col)
    if in_stop:
        d.text((W - 70, H - 34), "STOP", font=font_b, fill=ORANGE + (255,))
    if t < 5:
        d.text((W - 380, 70), "animatic: style frames stand in for unbuilt shots", font=font_s,
               fill=WARM + (int(220 * min(1, (5 - t))),))
    frame = frame.convert("RGBA")
    frame.alpha_composite(ov)
    frame = frame.convert("RGB")
    frame.paste(strip, (0, H - 12))
    px = int(t / END_T * W)
    ImageDraw.Draw(frame).rectangle([px - 1, H - 14, px + 1, H], fill=(255, 255, 255))
    ff.stdin.write(frame.tobytes())
    if f % 600 == 0:
        print(f"{f}/{N}", flush=True)

ff.stdin.close()
ff.wait()
print("done", ff.returncode)
