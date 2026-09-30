#!/bin/sh
# usage: sh render.sh out.png   (renders frame.html with headless Chrome at 1920x1080)
OUT="${1:-frame.png}"
D="C:/Users/USER/Projects/shelter-mv/style-frames/09-style-pixel"
START=$(date +%s%N)
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1920,1080 --virtual-time-budget=30000 --enable-logging=stderr --v=0 --screenshot="$D/$OUT" "file:///$D/frame.html" 2>&1 | grep -i -E "CONSOLE|uncaught|error" | grep -v -i "gpu\|dbus\|sandbox" | head -20
END=$(date +%s%N)
echo "wall time: $(( (END-START)/1000000 )) ms"
ls -la "$OUT"
