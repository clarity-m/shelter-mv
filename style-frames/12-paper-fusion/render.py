"""Render frame.html headless and save the canvas as a PNG.

usage: python3 render.py OUT.png ["k=v&k=v"]

Chrome runs with --dump-dom and ?dump=1: the page writes its final canvas as a
PNG data URL into the DOM, decoded here. --use-angle=vulkan keeps shader
compiles fast (the default D3D11 path can take minutes on big shaders).
"""
import base64, re, subprocess, sys, time

DIR = "C:/Users/USER/Projects/shelter-mv/style-frames/12-paper-fusion"
CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe"
out = sys.argv[1] if len(sys.argv) > 1 else "frame.png"
qs = sys.argv[2] if len(sys.argv) > 2 else ""
page = sys.argv[3] if len(sys.argv) > 3 else "frame.html"
url = f"file:///{DIR}/{page}?{qs}&dump=1"
flags = ["--headless=new", "--use-angle=vulkan", "--hide-scrollbars", "--force-device-scale-factor=1",
         "--window-size=1920,1080", "--virtual-time-budget=240000"]
for attempt in range(1, 5):
    t0 = time.time()
    r = subprocess.run([CHROME, *flags, "--dump-dom", url], capture_output=True, timeout=900)
    dom = r.stdout.decode("utf-8", "replace")
    m = re.search(r'<pre id="log"[^>]*>(.*?)</pre>', dom, re.S)
    log = m.group(1) if m else "(no log)"
    m2 = re.search(r"data:image/png;base64,([A-Za-z0-9+/=]+)", dom)
    if m2:
        data = base64.b64decode(m2.group(1))
        open(f"{DIR}/{out}", "wb").write(data)
        print(log.strip())
        print(f"{out}: {len(data)} bytes, attempt {attempt}, wall {time.time() - t0:.1f} s")
        sys.exit(0)
    print(f"attempt {attempt} failed after {time.time() - t0:.1f} s: {log.strip()[-1500:]}")
    time.sleep(2)
print("FAILED")
sys.exit(1)
