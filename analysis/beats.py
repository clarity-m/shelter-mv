"""Beat and downbeat tracking with Beat This! (CPJKU, 2024) on the full mix.

Writes analysis/beats.json: beat times, downbeat times, tempo estimate, and a
bar list (bar number -> start time, beats in bar).
"""
import json
from pathlib import Path

import numpy as np
from beat_this.inference import File2Beats

ROOT = Path(__file__).resolve().parent.parent
WAV = ROOT / "analysis" / "shelter.wav"

f2b = File2Beats(checkpoint_path="final0", device="cpu", dbn=False)
beats, downbeats = f2b(str(WAV))
beats = np.asarray(beats, float)
downbeats = np.asarray(downbeats, float)

ibi = np.diff(beats)
tempo = 60.0 / np.median(ibi)

bars = []
for i, t in enumerate(downbeats):
    end = downbeats[i + 1] if i + 1 < len(downbeats) else beats[-1] + np.median(ibi)
    n = int(np.sum((beats >= t - 0.02) & (beats < end - 0.02)))
    bars.append({"bar": i + 1, "t": round(float(t), 3), "beats": n})

out = {
    "tempo_bpm": round(float(tempo), 2),
    "ibi_median_s": round(float(np.median(ibi)), 4),
    "ibi_std_s": round(float(np.std(ibi)), 4),
    "n_beats": len(beats),
    "n_bars": len(downbeats),
    "first_beat": round(float(beats[0]), 3),
    "first_downbeat": round(float(downbeats[0]), 3),
    "beats": [round(float(b), 3) for b in beats],
    "downbeats": [round(float(d), 3) for d in downbeats],
    "bars": bars,
}
(ROOT / "analysis" / "beats.json").write_text(json.dumps(out, indent=1))
odd = [b for b in bars if b["beats"] != 4]
print(f"tempo {tempo:.2f} bpm, {len(beats)} beats, {len(downbeats)} bars, "
      f"first beat {beats[0]:.3f}, first downbeat {downbeats[0]:.3f}")
print("bars not 4 beats:", odd)
