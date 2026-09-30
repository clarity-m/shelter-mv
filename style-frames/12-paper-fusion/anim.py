"""Render the 3 s ignition test (90 frames, 30 fps) in one persistent page, then encode ignite.mp4.

usage: python3 anim.py [from to]
"""
import base64, os, re, subprocess, sys, time

DIR = "C:/Users/USER/Projects/shelter-mv/style-frames/12-paper-fusion"
CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe"
n0 = int(sys.argv[1]) if len(sys.argv) > 1 else 0
n1 = int(sys.argv[2]) if len(sys.argv) > 2 else 89
url = f"file:///{DIR}/frame.html?anim=1&from={n0}&to={n1}"
flags = ["--headless=new", "--use-angle=vulkan", "--hide-scrollbars", "--force-device-scale-factor=1",
         "--window-size=1920,1080", "--virtual-time-budget=600000"]
os.makedirs(f"{DIR}/frames", exist_ok=True)
t0 = time.time()
r = subprocess.run([CHROME, *flags, "--dump-dom", url], capture_output=True, timeout=1800)
dom = r.stdout.decode("utf-8", "replace")
m = re.search(r'<pre id="log"[^>]*>(.*?)</pre>', dom, re.S)
print(m.group(1).strip() if m else "(no log)")
shots = re.findall(r"data:image/jpeg;base64,([A-Za-z0-9+/=]+)", dom)
print(f"{len(shots)} frames, wall {time.time() - t0:.1f} s")
for i, b in enumerate(shots):
    open(f"{DIR}/frames/f{n0 + i:03d}.jpg", "wb").write(base64.b64decode(b))
if len(shots) == n1 - n0 + 1 and n0 == 0:
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "30", "-i", f"{DIR}/frames/f%03d.jpg",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", "-preset", "slow", f"{DIR}/ignite.mp4"], check=True)
    print("ignite.mp4 written")
