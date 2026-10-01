"""The X (Twitter) cut: drop 1 to the end, under the 2:20 cap for non-Premium accounts.

usage: python3 render/x_clip.py [out/film.mp4]  ->  out/shelter_x_clip.mp4

In on the bar-33 downbeat (frame 2315, 1:17.17), where the humans' click sends drop 1's shock wave; out at frame 6509
(3:36.97) on the fading square, 2:19.8 long. The song's last note is still decaying at the out-point, so the audio fades
over the last half second (and the picture over the last 0.4 s); a 10 ms fade-in avoids a click on the first sample.
The audio comes from analysis/shelter.wav, not the film's AAC, so it is encoded once.
"""
import subprocess, sys
from pathlib import Path

ROOT = Path("C:/Users/USER/Projects/shelter-mv")
film = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "out" / "film.mp4")
F0, F1 = 2315, 6509                       # in (bar 33 downbeat), out (exclusive)
t0, dur = F0 / 30, (F1 - F0) / 30
assert dur < 140.0, dur
out = ROOT / "out" / "shelter_x_clip.mp4"
subprocess.run([
    "ffmpeg", "-loglevel", "error", "-y",
    "-ss", f"{t0:.4f}", "-i", film,
    "-ss", f"{t0:.4f}", "-i", str(ROOT / "analysis" / "shelter.wav"),
    "-t", f"{dur:.4f}", "-map", "0:v", "-map", "1:a",
    "-vf", f"fade=t=out:st={dur - 0.4:.4f}:d=0.4",
    "-af", f"afade=t=in:d=0.01,afade=t=out:st={dur - 0.5:.4f}:d=0.5",
    "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-maxrate", "25M", "-bufsize", "50M",
    "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", "30",
    "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
    "-movflags", "+faststart", str(out)], check=True)
probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration,size", "-of", "csv=p=0", str(out)],
                       capture_output=True, text=True).stdout.strip()
print("wrote", out, "(duration s, bytes):", probe)
