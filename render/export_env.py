"""Export the audio analysis for the browser player.

Writes render/data/:
  env.bin    float32 LE, one block of N values per channel, all normalised to 0..1
  env.json   {N, fps, channels: {name: offset}} (offset in floats)
  events.json  frame lists: beats, bars, kicks, snares, chops, sung, stops (+ lengths)

Normalisation: loudness channels map dB p5..p99.5 to 0..1; onset strengths map
0..p99.5; centroid maps log(Hz) p5..p99.5; chroma is already 0..1.
Run with the project venv:  .venv/Scripts/python.exe render/export_env.py
"""
import json
from pathlib import Path

import numpy as np
import soundfile as sf
import librosa
from scipy.signal import butter, sosfiltfilt

ROOT = Path(__file__).resolve().parent.parent
A = ROOT / "analysis"
OUT = ROOT / "render" / "data"
OUT.mkdir(parents=True, exist_ok=True)
FPS, SR = 30, 22050
HOP = SR // FPS

z = np.load(A / "envelopes.npz")
grid = json.loads((A / "grid.json").read_text())
sections = json.loads((A / "sections.json").read_text())
N = len(z["t"])


def norm_db(x):
    lo, hi = np.percentile(x, 5), np.percentile(x, 99.5)
    return np.clip((x - lo) / (hi - lo + 1e-9), 0, 1)


def norm_pos(x):
    return np.clip(x / (np.percentile(x, 99.5) + 1e-9), 0, 1)


ch = {}
for k in ["mix_db", "vocals_db", "drums_db", "bass_db", "other_db", "kick_db", "snare_db",
          "band_sub_db", "band_lowmid_db", "band_high_db"]:
    ch[k.replace("_db", "").replace("band_", "")] = norm_db(z[k])
ch["onset"] = norm_pos(z["onset"])
ch["drums_onset"] = norm_pos(z["drums_onset"])
lc = np.log(np.maximum(z["centroid_hz"], 1.0))
ch["centroid"] = np.clip((lc - np.percentile(lc, 5)) / (np.percentile(lc, 99.5) - np.percentile(lc, 5)), 0, 1)
for i, name in enumerate(["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"]):
    ch["chroma_" + name] = z["chroma"][i]

names = list(ch)
blob = np.concatenate([ch[n].astype("<f4") for n in names])
(OUT / "env.bin").write_bytes(blob.tobytes())
(OUT / "env.json").write_text(json.dumps({"N": N, "fps": FPS, "channels": {n: i * N for i, n in enumerate(names)}}, indent=1))


# ---- events -------------------------------------------------------------------
def load_stem(name):
    y, sr = sf.read(A / "stems" / f"{name}.wav", dtype="float32", always_2d=True)
    return librosa.resample(y.mean(1), orig_sr=sr, target_sr=SR)


def onsets(y, delta, wait):
    env = librosa.onset.onset_strength(y=y, sr=SR, hop_length=HOP)
    fr = librosa.onset.onset_detect(onset_envelope=env, sr=SR, hop_length=HOP, units="frames",
                                    backtrack=False, delta=delta, wait=wait)
    return [int(f) for f in fr if f < N]


drums = load_stem("drums")
vocals = load_stem("vocals")
low = sosfiltfilt(butter(4, 110, "lowpass", fs=SR, output="sos"), drums)
high = sosfiltfilt(butter(4, [1500, 6000], "bandpass", fs=SR, output="sos"), drums)
kicks = onsets(low, 0.25, 6)
snares = onsets(high, 0.3, 4)
voc = onsets(vocals, 0.12, 3)

CHOP = {"intro-a", "intro-b", "hook-1", "drop-1", "build-2", "drop-2"}
def sec_of(f):
    for s in sections:
        if s["f0"] <= f < s["f1"]:
            return s["id"]
    return sections[-1]["id"]
chops = [f for f in voc if sec_of(f) in CHOP]
sung = [f for f in voc if sec_of(f) not in CHOP]

bar_s, beat_s, t0 = grid["bar_s"], grid["beat_s"], grid["bar1_t"]
beats = [int(round((t0 + k * beat_s) * FPS)) for k in range(0, 400) if (t0 + k * beat_s) * FPS < N]
bars = [int(round((t0 + k * bar_s) * FPS)) for k in range(0, 100) if (t0 + k * bar_s) * FPS < N]
STOP_BARS = [9, 13, 14, 33, 37, 38, 40, 45, 46, 85]
stops = [int(round((t0 + (b - 1) * bar_s + 1.95) * FPS)) for b in STOP_BARS]

events = {"beats": beats, "bars": bars, "kicks": kicks, "snares": snares, "chops": chops, "sung": sung,
          "stops": stops, "stop_len": 10,
          "note": "frame indices at 30 fps. kicks/snares from the Demucs drum stem (low-pass / band-pass onsets); "
                  "chops/sung are vocal-stem onsets split by section type; stops are the bass stutter-stops."}
(OUT / "events.json").write_text(json.dumps(events))
print(f"N={N}, channels={len(names)}, kicks={len(kicks)}, snares={len(snares)}, chops={len(chops)}, "
      f"sung={len(sung)}, beats={len(beats)}, bars={len(bars)}")
