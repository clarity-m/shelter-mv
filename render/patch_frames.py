"""Replace bad frames in a rendered shot clip with fresh single-frame renders.

usage: python3 render/patch_frames.py S20 3937 [3938 ...]
Renders each global frame as a still (node render/render.mjs ID --still F), decodes the shot's clip
to PNGs, swaps the stills in, and re-encodes the clip with the same settings as render.mjs
(libx264 medium, crf 12, high profile, g 60, yuv420p, 30 fps). The old clip is kept as out/shots/ID_prepatch.mp4. Run
assemble.mjs afterwards (and assemble.mjs --shot ID for its _av version).
"""
import json, os, shutil, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path("C:/Users/USER/Projects/shelter-mv")
sid, frames = sys.argv[1], [int(a) for a in sys.argv[2:]]
shots = json.loads((ROOT / "shots.json").read_text(encoding="utf-8"))["shots"]
s = next(x for x in shots if x["id"] == sid)
fb = lambda b: round((0.38 + 2.4 * (b - 1)) * 30)
f0 = (0 if s["bars"][0] <= 1 else fb(s["bars"][0])) + s.get("shift0", 0)
clip = ROOT / "out" / "shots" / f"{sid}.mp4"
env = dict(os.environ, PATH="C:/Program Files/nodejs;" + os.environ.get("PATH", ""))
for f in frames:
    r = subprocess.run(["C:/Program Files/nodejs/node.exe", "render/render.mjs", sid, "--still", str(f)], cwd=ROOT, env=env,
                       capture_output=True, text=True)
    print(r.stdout.strip().splitlines()[-1] if r.stdout.strip() else r.stderr[-400:])
tmp = Path(tempfile.mkdtemp(prefix=f"patch_{sid}_"))
subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(clip), str(tmp / "%05d.png")], check=True)
for f in frames:
    src = ROOT / "out" / "stills" / f"{sid}_f{f}.png"
    dst = tmp / f"{f - f0 + 1:05d}.png"
    assert src.exists() and dst.exists(), (src, dst)
    shutil.copyfile(src, dst)
    print(f"patched local {f - f0} (global {f})")
shutil.copyfile(clip, clip.with_name(f"{sid}_prepatch.mp4"))
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-framerate", "30", "-i", str(tmp / "%05d.png"), "-c:v", "libx264",
                "-preset", "medium", "-crf", "12", "-profile:v", "high", "-g", "60",
                "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p", "-color_primaries", "bt709",
                "-color_trc", "bt709", "-colorspace", "bt709", "-movflags", "+faststart", "-r", "30", str(clip)], check=True)
shutil.rmtree(tmp, ignore_errors=True)
print("wrote", clip)
