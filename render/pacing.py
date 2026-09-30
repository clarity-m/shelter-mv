"""Pacing chart: picture motion against musical energy, bar by bar, with shot boundaries.

usage: python3 render/pacing.py [out/film.mp4]  ->  out/stills/pacing.png
Per bar:
- motion: the mean absolute luma change between consecutive frames, cuts excluded;
- music: the mix envelope from analysis/envelopes.npz;
- cuts: shot boundaries from shots.json.
Where the music surges and the picture sits still, or the reverse, pacing is worth a look.
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path("C:/Users/USER/Projects/shelter-mv")
film = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "out" / "film.mp4"
W, H = 160, 90
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(film), "-vf", f"scale={W}:{H}", "-f", "rawvideo",
                      "-pix_fmt", "gray", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
n = len(fr)
diff = np.zeros(n)
diff[1:] = np.abs(fr[1:] - fr[:-1]).mean(axis=(1, 2))

shots = json.loads((ROOT / "shots.json").read_text(encoding="utf-8"))["shots"]
def fbar(b): return round((0.38 + 2.4 * (b - 1)) * 30)
starts = []
for s in shots:
    b0 = s["bars"][0]
    starts.append((0 if b0 <= 1 else fbar(b0)) + s.get("shift0", 0))
cutset = set(starts[1:])
motion = diff.copy()
for c in cutset:
    if c < n: motion[c] = np.nan

env = np.load(ROOT / "analysis" / "envelopes.npz")
mix = env["mix_db"][:n]
mix = (mix - mix.min()) / (np.ptp(mix) + 1e-9)

bars = np.arange(1, 92)
mb, ab = [], []
for b in bars:
    f0, f1 = (0 if b == 1 else fbar(b)), min(fbar(b + 1), n)
    mb.append(np.nanmean(motion[f0:f1]))
    ab.append(mix[f0:f1].mean())
mb, ab = np.array(mb), np.array(ab)

fig, ax = plt.subplots(figsize=(22, 6), dpi=100)
ax.bar(bars, mb / np.nanmax(mb), color="#D97757", alpha=0.75, label="picture motion (per bar, cuts excluded)")
ax.plot(bars, ab / ab.max(), color="#3b4a8a", lw=2, label="music energy (mix)")
secs = json.loads((ROOT / "analysis" / "sections.json").read_text(encoding="utf-8"))
sl = secs if isinstance(secs, list) else secs.get("sections", [])
for i, s in enumerate(sl):
    b0, b1 = s.get("bars", [None, None])[:2] if "bars" in s else (s.get("bar0"), s.get("bar1"))
    if b0 is None: continue
    ax.axvspan(b0 - 0.5, b1 + 0.5, color="#000000" if i % 2 else "#888888", alpha=0.04)
    ax.text((b0 + b1) / 2, 1.13, s.get("id", s.get("name", "")), ha="center", fontsize=8, color="#444")
for s, f in zip(shots, starts):
    b = (f / 30 - 0.38) / 2.4 + 1
    ax.axvline(b - 0.5, color="#222", lw=0.6, alpha=0.5)
    ax.text(b - 0.4, 1.03, s["id"], fontsize=7, rotation=90, va="bottom")
ax.set_xlim(0.5, 91.5); ax.set_ylim(0, 1.3)
ax.set_xlabel("bar"); ax.legend(loc="upper left", fontsize=8)
ax.set_title("Cut 4 pacing: picture motion vs music energy")
out = ROOT / "out" / "stills" / "pacing.png"
fig.tight_layout(); fig.savefig(out)
np.savez(ROOT / "out" / "pacing.npz", motion_bar=mb, music_bar=ab)
print(out)
for b, m, a in zip(bars, mb / np.nanmax(mb), ab / ab.max()):
    print(f"{b:3d} motion {m:4.2f} music {a:4.2f}")
