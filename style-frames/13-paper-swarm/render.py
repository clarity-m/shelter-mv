"""Render frame.html headless and save the canvas as a PNG (plus a 320x180 thumb).

usage: python3 render.py OUT.png ["k=v&k=v..."] [--angle=vulkan|d3d11|gl]

Runs Chrome with --dump-dom and ?dump=1: the page writes its canvas as a PNG
data URL into the DOM, decoded here. Same pixels as --screenshot, but it
survives the occasional WebGL context loss when other jobs share the GPU.
"""
import base64, re, subprocess, sys, time
from PIL import Image

DIR = "C:/Users/USER/Projects/shelter-mv/style-frames/13-paper-swarm"
CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe"
args = [a for a in sys.argv[1:] if not a.startswith("--")]
angle = next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--angle=")), "vulkan")
out = args[0] if args else "frame.png"
qs = args[1] if len(args) > 1 else ""
url = f"file:///{DIR}/frame.html?{qs}&dump=1"
flags = ["--headless=new", f"--use-angle={angle}", "--ignore-gpu-blocklist", "--hide-scrollbars",
         "--force-device-scale-factor=1", "--window-size=1920,1080", "--virtual-time-budget=120000"]
for attempt in range(1, 5):
    t0 = time.time()
    r = subprocess.run([CHROME, *flags, "--dump-dom", url], capture_output=True, timeout=900)
    dom = r.stdout.decode("utf-8", "replace")
    m = re.search(r'<pre id="log"[^>]*>(.*?)</pre>', dom, re.S)
    logtxt = m.group(1) if m else "(no log)"
    m2 = re.search(r"data:image/png;base64,([A-Za-z0-9+/=]+)", dom)
    if m2:
        data = base64.b64decode(m2.group(1))
        open(f"{DIR}/{out}", "wb").write(data)
        im = Image.open(f"{DIR}/{out}").convert("RGB")
        im.resize((320, 180), Image.LANCZOS).save(f"{DIR}/{out[:-4]}_thumb.png")
        print(logtxt.strip())
        print(f"{out}: {len(data)} bytes, attempt {attempt}, wall {time.time() - t0:.1f} s")
        sys.exit(0)
    print(f"attempt {attempt} failed after {time.time() - t0:.1f} s: {logtxt.strip()[-1500:]}")
    time.sleep(2)
print("FAILED")
sys.exit(1)
