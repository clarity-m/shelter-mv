"""Decode Shelter.mp3 and split it into stems with Demucs (htdemucs_ft, CPU).

Writes analysis/shelter.wav (44.1 kHz stereo) and analysis/stems/<name>.wav.
IO goes through soundfile so torchaudio's backend churn doesn't matter.
"""
import subprocess, sys, time
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
from demucs.pretrained import get_model
from demucs.apply import apply_model

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "analysis"
WAV = OUT / "shelter.wav"
STEMS = OUT / "stems"
STEMS.mkdir(parents=True, exist_ok=True)

if not WAV.exists():
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-i", str(ROOT / "Shelter.mp3"), "-ar", "44100", "-ac", "2",
                    str(WAV)], check=True)

model_name = sys.argv[1] if len(sys.argv) > 1 else "htdemucs_ft"
torch.set_num_threads(8)
model = get_model(model_name)
model.eval()

audio, sr = sf.read(WAV, dtype="float32", always_2d=True)
assert sr == model.samplerate, (sr, model.samplerate)
wav = torch.from_numpy(audio.T.copy())
ref = wav.mean(0)
mean, std = ref.mean(), ref.std()
x = ((wav - mean) / std)[None]

t0 = time.time()
with torch.no_grad():
    out = apply_model(model, x, shifts=1, split=True, overlap=0.25, progress=True)[0]
out = out * std + mean
print(f"separated in {time.time() - t0:.0f} s")

for name, src in zip(model.sources, out):
    sf.write(STEMS / f"{name}.wav", src.numpy().T, sr, subtype="PCM_16")
    print("wrote", name)
