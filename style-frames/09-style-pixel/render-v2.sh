#!/bin/sh
# usage: sh render-v2.sh out.png [query]   (renders frame-v2.html, e.g. query "cs=1")
OUT="${1:-frame-v2.png}"
QS="${2:-}"
D="C:/Users/USER/Projects/shelter-mv/style-frames/09-style-pixel"
URL="file:///$D/frame-v2.html"
[ -n "$QS" ] && URL="$URL?$QS"
START=$(date +%s%N)
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1920,1080 --virtual-time-budget=30000 --enable-logging=stderr --v=0 --screenshot="$D/$OUT" "$URL" 2>&1 | grep -i -E "CONSOLE|uncaught|error" | grep -v -i "gpu\|dbus\|sandbox" | head -20
END=$(date +%s%N)
echo "wall time: $(( (END-START)/1000000 )) ms"
ls -la "$OUT"
