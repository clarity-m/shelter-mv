"""Check that a rendered film's audio is aligned with analysis/shelter.wav (the beat-grid source).

usage: .venv/Scripts/python.exe render/check_av.py out/film.mp4
Cross-correlates onset envelopes of the first 60 s; prints the offset in ms (want |offset| < 5 ms)
plus the video frame rate and frame count.
"""
import json, subprocess, sys
from pathlib import Path

import numpy as np
import soundfile as sf
import librosa

ROOT = Path(__file__).resolve().parent.parent
src = Path(sys.argv[1])
tmp = ROOT / "out" / "_check.wav"
subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(src), "-map", "0:a", "-ac", "1",
                "-ar", "22050", str(tmp)], check=True)
a, _ = sf.read(tmp, dtype="float32")
b, sr = sf.read(ROOT / "analysis" / "shelter.wav", dtype="float32", always_2d=True)
b = librosa.resample(b.mean(1), orig_sr=sr, target_sr=22050)
n = 22050 * 60
hop = 64
ea = librosa.onset.onset_strength(y=a[:n], sr=22050, hop_length=hop)
eb = librosa.onset.onset_strength(y=b[:n], sr=22050, hop_length=hop)
m = min(len(ea), len(eb))
ea, eb = ea[:m] - ea[:m].mean(), eb[:m] - eb[:m].mean()
lags = np.arange(-200, 201)
cc = [np.dot(ea[max(0, l):m + min(0, l)], eb[max(0, -l):m - max(0, l)]) for l in lags]
lag = lags[int(np.argmax(cc))]
probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries",
                                   "stream=r_frame_rate,nb_read_packets,start_time", "-of", "json", str(src)],
                                  capture_output=True, text=True).stdout)["streams"][0]
print(f"audio offset vs shelter.wav: {lag * hop / 22.05:+.1f} ms (positive = film audio late)")
print(f"video: {probe['r_frame_rate']} fps, {probe['nb_read_packets']} frames, start {probe.get('start_time')}")
tmp.unlink()
