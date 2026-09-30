"""Scan a film for glitches: frame-to-frame jumps that are not cuts.

usage: python3 render/glitch.py [out/film.mp4] [THRESH=18]
Decodes the film at 160x90 grey, measures the mean absolute difference between consecutive frames,
and lists every jump above THRESH (0-255 scale) that is not at a shot boundary (shots.json, +-1 frame),
plus single-frame spikes (a frame unlike both neighbours: a flash or a dropped frame).
Writes out/stills/glitch.png: the difference curve with the cuts marked.
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np

ROOT = Path("C:/Users/USER/Projects/shelter-mv")
clip = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "out" / "film.mp4")
TH = float(sys.argv[2]) if len(sys.argv) > 2 else 18.0
W, H = 160, 90
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", clip, "-vf", f"scale={W}:{H},format=gray",
                      "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
n = len(fr)
d = np.abs(fr[1:] - fr[:-1]).mean(axis=(1, 2))           # d[i] = |f[i+1] - f[i]|

shots = json.loads((ROOT / "shots.json").read_text(encoding="utf-8"))["shots"]
fb = lambda b: round((0.38 + 2.4 * (b - 1)) * 30)
cuts = set()
for s in shots:
    b0 = s["bars"][0]
    f0 = (0 if b0 <= 1 else fb(b0)) + s.get("shift0", 0)
    cuts.add(f0)
def near_cut(f):
    return any(abs(f - c) <= 1 for c in cuts)

# an off-cut jump stands out from its own neighbourhood (sustained fast motion is not a glitch)
def local_med(i, r=6):
    lo, hi = max(0, i - r), min(len(d), i + r + 1)
    nb = np.concatenate([d[lo:i], d[i + 1:hi]])
    return float(np.median(nb)) if len(nb) else 0.0
jumps = [(i + 1, d[i]) for i in range(len(d)) if d[i] > TH and d[i] > 2.5 * local_med(i) and not near_cut(i + 1)]
# single-frame spikes: frame i differs from both neighbours much more than they differ from each other
spikes = []
for i in range(1, n - 1):
    a, b = d[i - 1], d[i]
    both = np.abs(fr[i + 1] - fr[i - 1]).mean()
    if min(a, b) > 8 and min(a, b) > 3 * both and not near_cut(i) and not near_cut(i + 1):
        spikes.append((i, round(float(min(a, b)), 1), round(float(both), 1)))

# short bursts (2-3 frames) unlike the frames on either side: a pop, a flash, geometry through the lens
bursts = []
for L in (2, 3):
    for i in range(1, n - L):
        if near_cut(i) or near_cut(i + L):
            continue
        both = np.abs(fr[i + L] - fr[i - 1]).mean()
        inside = [min(np.abs(fr[j] - fr[i - 1]).mean(), np.abs(fr[j] - fr[i + L]).mean()) for j in range(i, i + L)]
        if max(inside) > 12 and max(inside) > 2.5 * both:
            bursts.append((i, L, round(float(max(inside)), 1), round(float(both), 1)))

def bb(f):
    x = (f / 30 - 0.38) / 2.4
    return f"{int(x) + 1}.{(x - int(x)) * 4 + 1:.2f}"
def shot_of(f):
    cur = None
    for s in shots:
        b0 = s["bars"][0]
        f0 = (0 if b0 <= 1 else fb(b0)) + s.get("shift0", 0)
        if f >= f0:
            cur = s["id"]
    return cur

print(f"{n} frames; {len(cuts)} cuts; jumps > {TH} off-cut: {len(jumps)}; single-frame spikes: {len(spikes)}")
for f, v in jumps[:60]:
    print(f"  jump  f{f} ({shot_of(f)}, bar {bb(f)}): {v:.1f}")
for f, a, both in spikes[:60]:
    print(f"  spike f{f} ({shot_of(f)}, bar {bb(f)}): {a} vs neighbours {both}")
print(f"short bursts (2-3 frames): {len(bursts)}")
for f, L, a, both in bursts[:60]:
    print(f"  burst f{f}-{f + L - 1} ({shot_of(f)}, bar {bb(f)}): {a} vs outside {both}")

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(22, 4))
    ax.plot(np.arange(1, n), d, lw=0.5, color="k")
    for c in sorted(cuts):
        ax.axvline(c, color="tab:blue", lw=0.4, alpha=0.5)
    for f, v in jumps:
        ax.plot(f, v, "rv", ms=4)
    for f, a, both in spikes:
        ax.plot(f, a, "m^", ms=4)
    ax.set_xlim(0, n); ax.set_ylim(0, max(40, float(np.percentile(d, 99.9))))
    ax.set_title("frame-to-frame mean abs diff (blue: cuts, red: off-cut jumps, magenta: single-frame spikes)")
    fig.tight_layout(); fig.savefig(ROOT / "out" / "stills" / "glitch.png", dpi=90)
except Exception as e:
    print("plot skipped:", e)
