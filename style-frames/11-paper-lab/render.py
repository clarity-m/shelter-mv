"""Render frame.html headless and save the canvas as a PNG.

usage: python3 render.py OUT.png ["shot=lab&k=v..."] [thumb]

Runs Chrome with --dump-dom and ?dump=1: the page writes its final canvas as a
PNG data URL into the DOM, which is decoded here (same pixels as a screenshot,
but it survives the WebGL context losses that screenshot mode can hit when other
jobs share the GPU). --use-angle=vulkan keeps shader compiles fast. The plain
--screenshot command from the brief also works on frame.html.
"""
import base64, re, subprocess, sys, time

DIR = "C:/Users/USER/Projects/shelter-mv/style-frames/11-paper-lab"
CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe"
out = sys.argv[1] if len(sys.argv) > 1 else "frame.png"
qs = sys.argv[2] if len(sys.argv) > 2 else "shot=lab"
url = f"file:///{DIR}/frame.html?{qs}&dump=1"
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
        if len(sys.argv) > 3 and sys.argv[3] == "thumb":
            from PIL import Image
            im = Image.open(f"{DIR}/{out}").convert("RGB")
            im.resize((320, 180), Image.LANCZOS).save(f"{DIR}/{out[:-4]}_320.png")
        sys.exit(0)
    print(f"attempt {attempt} failed after {time.time() - t0:.1f} s: {log.strip()[-1500:]}")
    time.sleep(2)
print("FAILED")
sys.exit(1)
