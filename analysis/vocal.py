"""Tell sung vocal lines from the vocal-chop lead on the Demucs vocal stem.

Sung lines: long, gliding notes, vibrato, irregular onsets.
Chops: short, quantized notes on the 16th grid, pitch steps are clean.
Writes analysis/vocal_f0.png (pitch contour in 4 rows with bar lines) and
analysis/vocal_bars.json (per-bar note stats).
"""
import json
from pathlib import Path

import numpy as np
import soundfile as sf
import librosa
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

A = Path(__file__).resolve().parent
SR = 22050
HOP = 256
grid = json.loads((A / "grid.json").read_text())
bar_s, t0 = grid["bar_s"], grid["bar1_t"]

y, sr = sf.read(A / "stems" / "vocals.wav", dtype="float32", always_2d=True)
y = librosa.resample(y.mean(1), orig_sr=sr, target_sr=SR)
cache = A / "vocal_f0.npz"
if cache.exists():
    z = np.load(cache); f0, vp = z["f0"], z["vp"]
else:
    f0, vflag, vp = librosa.pyin(y, fmin=90, fmax=1100, sr=SR, hop_length=HOP, frame_length=2048)
    np.savez_compressed(cache, f0=f0, vp=vp)
t = librosa.times_like(f0, sr=SR, hop_length=HOP)
rms = librosa.feature.rms(y=y, hop_length=HOP)[0][: len(t)]
loud = librosa.amplitude_to_db(rms, ref=np.max) > -35
voiced = np.isfinite(f0) & (vp > 0.3) & loud
midi = np.where(voiced, librosa.hz_to_midi(np.where(np.isfinite(f0), f0, 1.0)), np.nan)

onsets = librosa.onset.onset_detect(y=y, sr=SR, hop_length=HOP, units="time", backtrack=False)
six = bar_s / 16

rows = []
n_bars = grid["n_bars"]
for b in range(n_bars):
    lo, hi = t0 + b * bar_s, t0 + (b + 1) * bar_s
    m = (t >= lo) & (t < hi)
    v = voiced[m]
    # segment voiced runs -> note lengths
    runs, cur = [], 0
    for x in v:
        if x:
            cur += 1
        elif cur:
            runs.append(cur); cur = 0
    if cur:
        runs.append(cur)
    runs_s = np.array(runs) * HOP / SR
    mm = midi[m]
    d = np.abs(np.diff(mm))
    glide = np.nanmean((d > 0.08) & (d < 0.8)) if np.isfinite(d).any() else 0.0
    ob = onsets[(onsets >= lo) & (onsets < hi)]
    ph = ((ob - t0) / six) % 1.0
    ongrid = np.mean(np.minimum(ph, 1 - ph) < 0.18) if len(ob) else np.nan
    rows.append({
        "bar": b + 1, "t": round(lo, 2),
        "voiced": round(float(v.mean()), 2),
        "n_onsets": int(len(ob)),
        "ongrid16": None if np.isnan(ongrid) else round(float(ongrid), 2),
        "median_note_s": round(float(np.median(runs_s)), 2) if len(runs_s) else 0.0,
        "max_note_s": round(float(runs_s.max()), 2) if len(runs_s) else 0.0,
        "glide": round(float(glide), 3),
        "median_midi": None if not np.isfinite(mm).any() else round(float(np.nanmedian(mm)), 1),
    })
(A / "vocal_bars.json").write_text(json.dumps(rows, indent=1))

fig, axs = plt.subplots(4, 1, figsize=(26, 16))
span = (t[-1] + 1) / 4
for i, ax in enumerate(axs):
    lo, hi = i * span, (i + 1) * span
    m = (t >= lo) & (t < hi)
    ax.scatter(t[m], midi[m], s=1.2, c=vp[m], cmap="viridis", vmin=0.3, vmax=1)
    for b in range(n_bars + 1):
        bt = t0 + b * bar_s
        if lo <= bt < hi:
            ax.axvline(bt, color="c" if b % 4 == 0 else "0.8", lw=1 if b % 4 == 0 else 0.4)
            ax.text(bt + 0.05, 83, str(b + 1), fontsize=8)
    ax.set_xlim(lo, hi); ax.set_ylim(50, 85); ax.set_ylabel("midi")
axs[-1].set_xlabel("seconds")
fig.tight_layout(); fig.savefig(A / "vocal_f0.png", dpi=65); plt.close(fig)
for r in rows:
    print(r["bar"], r["t"], r["voiced"], r["n_onsets"], r["ongrid16"], r["median_note_s"], r["max_note_s"], r["glide"], r["median_midi"])
