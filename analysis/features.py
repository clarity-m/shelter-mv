"""Song features for the edit and for audio-reactive animation.

Outputs (analysis/):
  grid.json        fixed 100 BPM grid fitted to the tracked downbeats
  envelopes.npz    per-video-frame (30 fps) curves: mix/stem loudness, bands,
                   centroid, onset strength, chroma
  bars.json        per-bar summary (loudness per stem, onset density, chroma root)
  timeline.png     spectrogram + stem lanes + bar grid + section candidates
  ssm.png          bar-level self-similarity with novelty curve
"""
import json
from pathlib import Path

import numpy as np
import soundfile as sf
import librosa
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from scipy.ndimage import uniform_filter1d

ROOT = Path(__file__).resolve().parent.parent
A = ROOT / "analysis"
FPS = 30
SR = 22050
HOP = SR // FPS  # 735 samples -> exactly one hop per video frame
STEM_NAMES = ["vocals", "drums", "bass", "other"]
NOTE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def load(p):
    y, sr = sf.read(p, dtype="float32", always_2d=True)
    y = y.mean(1)
    return librosa.resample(y, orig_sr=sr, target_sr=SR)


def rms_db(y):
    r = librosa.feature.rms(y=y, frame_length=2048, hop_length=HOP, center=True)[0]
    return librosa.amplitude_to_db(r, ref=1.0, top_db=None)


mix = load(A / "shelter.wav")
dur = len(mix) / SR
n = int(np.ceil(dur * FPS))

# ---- fixed grid -----------------------------------------------------------
bj = json.loads((A / "beats.json").read_text())
db = np.array(bj["downbeats"])
k = np.arange(len(db))
period, offset = np.polyfit(k, db, 1)
period = 2.4 if abs(period - 2.4) < 0.002 else period  # quantized DAW tempo
offset = float(np.median(db - k * period))
grid = {"bpm": 240.0 / period, "bar_s": period, "beat_s": period / 4,
        "bar1_t": round(offset, 4), "n_bars": int(np.ceil((dur - offset) / period)),
        "note": "bar b (1-based) starts at bar1_t + (b-1)*bar_s; beat j of bar b at + (j-1)*beat_s"}
(A / "grid.json").write_text(json.dumps(grid, indent=1))
bar_t = offset + period * np.arange(grid["n_bars"] + 1)

# ---- envelopes ------------------------------------------------------------
env = {}
S = np.abs(librosa.stft(mix, n_fft=2048, hop_length=HOP))
freqs = librosa.fft_frequencies(sr=SR, n_fft=2048)
P = S ** 2
env["mix_db"] = rms_db(mix)
for name, lo, hi in [("sub", 20, 120), ("lowmid", 120, 2000), ("high", 2000, 11025)]:
    m = (freqs >= lo) & (freqs < hi)
    env[f"band_{name}_db"] = 10 * np.log10(P[m].sum(0) + 1e-10)
env["centroid_hz"] = librosa.feature.spectral_centroid(S=S, sr=SR)[0]
env["onset"] = librosa.onset.onset_strength(y=mix, sr=SR, hop_length=HOP)
chroma = librosa.feature.chroma_cqt(y=mix, sr=SR, hop_length=HOP)
env["chroma"] = chroma

stems = {}
for s in STEM_NAMES:
    p = A / "stems" / f"{s}.wav"
    if p.exists():
        stems[s] = load(p)
        env[f"{s}_db"] = rms_db(stems[s])
if "drums" in stems:
    env["drums_onset"] = librosa.onset.onset_strength(y=stems["drums"], sr=SR, hop_length=HOP)
    # kick / snare-ish split on the drum stem
    Sd = np.abs(librosa.stft(stems["drums"], n_fft=2048, hop_length=HOP)) ** 2
    env["kick_db"] = 10 * np.log10(Sd[(freqs >= 30) & (freqs < 110)].sum(0) + 1e-10)
    env["snare_db"] = 10 * np.log10(Sd[(freqs >= 1500) & (freqs < 6000)].sum(0) + 1e-10)

for key in list(env):
    v = env[key]
    env[key] = v[..., :n] if v.shape[-1] >= n else np.pad(v, [(0, 0)] * (v.ndim - 1) + [(0, n - v.shape[-1])], mode="edge")
env["t"] = np.arange(n) / FPS
np.savez_compressed(A / "envelopes.npz", **env)

# ---- per-bar summary --------------------------------------------------------
t = env["t"]
bars = []
mfcc = librosa.feature.mfcc(y=mix, sr=SR, hop_length=HOP, n_mfcc=20)[:, :n]
bar_feats = []
for b in range(grid["n_bars"]):
    m = (t >= bar_t[b]) & (t < bar_t[b + 1])
    if not m.any():
        continue
    row = {"bar": b + 1, "t": round(float(bar_t[b]), 3)}
    for key in ["mix_db"] + [f"{s}_db" for s in stems]:
        row[key.replace("_db", "")] = round(float(np.mean(env[key][m])), 1)
    c = chroma[:, m].mean(1)
    row["chroma_top"] = [NOTE[i] for i in np.argsort(c)[::-1][:3]]
    row["onset_mean"] = round(float(env["onset"][m].mean()), 2)
    bars.append(row)
    bar_feats.append(np.concatenate([chroma[:, m].mean(1) / (chroma[:, m].mean(1).max() + 1e-9),
                                     (mfcc[1:13, m].mean(1)) / 50.0]))
(A / "bars.json").write_text(json.dumps(bars, indent=1))

# ---- self-similarity + novelty -----------------------------------------------
F = np.array(bar_feats)
Fn = F / (np.linalg.norm(F, axis=1, keepdims=True) + 1e-9)
SSM = Fn @ Fn.T
L = 4
kern = np.kron(np.array([[1, -1], [-1, 1]]), np.ones((L, L)))
g = np.exp(-0.5 * (np.linspace(-1.5, 1.5, 2 * L) ** 2))
kern = kern * np.outer(g, g)
nov = np.zeros(len(F))
for i in range(L, len(F) - L):
    nov[i] = np.sum(SSM[i - L:i + L, i - L:i + L] * kern)
nov = np.maximum(nov, 0)

fig, ax = plt.subplots(1, 2, figsize=(18, 8), gridspec_kw={"width_ratios": [1, 0.6]})
ax[0].imshow(SSM, origin="lower", cmap="magma", extent=[0.5, len(F) + 0.5, 0.5, len(F) + 0.5])
ax[0].set_xticks(range(1, len(F) + 1, 4)); ax[0].set_yticks(range(1, len(F) + 1, 4))
ax[0].grid(color="w", alpha=0.15, lw=0.5)
ax[0].set_title("bar self-similarity (chroma + MFCC)")
ax[1].plot(np.arange(1, len(F) + 1), nov); ax[1].set_xticks(range(1, len(F) + 1, 4)); ax[1].grid(alpha=0.3)
ax[1].set_title("novelty (checkerboard, 4 bars) — peaks = section boundaries (bar numbers)")
fig.tight_layout(); fig.savefig(A / "ssm.png", dpi=90); plt.close(fig)

# ---- timeline -----------------------------------------------------------------
lanes = ["mix_db"] + [f"{s}_db" for s in stems] + (["kick_db", "snare_db"] if "drums" in stems else [])
fig, axs = plt.subplots(2 + len(lanes), 1, figsize=(26, 3 + 1.3 * (2 + len(lanes))), sharex=True,
                        gridspec_kw={"height_ratios": [3, 1.3] + [1] * len(lanes)})
M = librosa.power_to_db(librosa.feature.melspectrogram(y=mix, sr=SR, hop_length=HOP, n_mels=96), ref=np.max)
axs[0].imshow(M[:, :n], origin="lower", aspect="auto", cmap="magma", extent=[0, n / FPS, 0, 96])
axs[0].set_ylabel("mel")
axs[1].imshow(chroma[:, :n], origin="lower", aspect="auto", cmap="Greys", extent=[0, n / FPS, -0.5, 11.5])
axs[1].set_yticks(range(12)); axs[1].set_yticklabels(NOTE, fontsize=6)
for a, key in zip(axs[2:], lanes):
    v = uniform_filter1d(env[key], 5)
    a.plot(t, v, lw=0.6)
    a.set_ylabel(key.replace("_db", ""), rotation=0, ha="right")
    lo = np.percentile(v, 5); a.set_ylim(lo, v.max() + 2)
for a in axs:
    for b, bt in enumerate(bar_t[:-1]):
        a.axvline(bt, color="c" if b % 4 == 0 else "0.6", lw=0.8 if b % 4 == 0 else 0.3, alpha=0.7)
for b, bt in enumerate(bar_t[:-1]):
    if b % 2 == 0:
        axs[0].text(bt + 0.1, 90, str(b + 1), color="w", fontsize=7)
axs[-1].set_xticks(np.arange(0, dur, 10))
axs[-1].set_xlabel("seconds (cyan line every 4 bars; numbers = bar)")
fig.tight_layout(); fig.savefig(A / "timeline.png", dpi=70); plt.close(fig)
print("dur", round(dur, 2), "frames", n, "grid", grid)
print("novelty peaks (bar):", [int(i + 1) for i in np.argsort(nov)[::-1][:14]])
