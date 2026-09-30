"""Render frame.html headless and save the canvas as a PNG.

usage: python3 render-v2.py OUT.png [query]      e.g. python3 render.py pass3.png "ss=2"

Runs Chrome with --dump-dom and ?dump=1: the page writes its final canvas as a
PNG data URL into the DOM, which is decoded here. Same pixels as a
--screenshot of the page, but it survives the intermittent WebGL context
losses that screenshot mode hit when several jobs share the GPU. Retries on
failure. --use-angle=vulkan puts WebGL on the MX150 through Vulkan (shader
compile ~1 s, versus ~140 s through ANGLE's default D3D11/fxc path).
"""
import base64, re, subprocess, sys, time

DIR = "C:/Users/USER/Projects/shelter-mv/style-frames/02b-environment-poly"
CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe"
out = sys.argv[1] if len(sys.argv) > 1 else "frame.png"
qs = sys.argv[2] if len(sys.argv) > 2 else ""
url = f"file:///{DIR}/frame-v2.html?{qs}{'&' if qs else ''}dump=1"
flags = ["--headless=new", "--use-angle=vulkan", "--hide-scrollbars", "--window-size=1920,1080", "--virtual-time-budget=180000"]
for attempt in range(1, 7):
    t0 = time.time()
    r = subprocess.run([CHROME, *flags, "--dump-dom", url], capture_output=True, timeout=900)
    dom = r.stdout.decode("utf-8", "replace")
    m = re.search(r'<pre id="log"[^>]*>(.*?)</pre>', dom, re.S)
    log = m.group(1) if m else "(no log)"
    m2 = re.search(r"data:image/png;base64,([A-Za-z0-9+/=]+)", dom)
    if m2:
        data = base64.b64decode(m2.group(1))
        open(f"{DIR}/{out}", "wb").write(data)
        print(log)
        print(f"{out}: {len(data)} bytes, attempt {attempt}, {time.time() - t0:.0f} s")
        sys.exit(0)
    print(f"attempt {attempt} failed: {log.strip()[-300:]}")
    time.sleep(3)
print("FAILED")
sys.exit(1)
