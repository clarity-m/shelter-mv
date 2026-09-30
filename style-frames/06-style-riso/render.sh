#!/bin/sh
# usage: sh render.sh out.png [querystring] [width] [height]
#   sh render.sh frame.png
#   sh render.sh detail.png "?detail" 1080 1080
OUT="${1:-frame.png}"
QS="${2:-}"
W="${3:-1920}"
H="${4:-1080}"
D="C:/Users/USER/Projects/shelter-mv/style-frames/06-style-riso"
S=$(date +%s%N)
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=$W,$H --virtual-time-budget=30000 --enable-logging=stderr --v=0 \
  --screenshot="$D/$OUT" "file:///$D/frame.html$QS" 2>&1 | grep -i -E "CONSOLE|uncaught|error" | grep -v -i "gpu\|dxgi\|angle" | head -20
E=$(date +%s%N)
echo "wall ms: $(( (E - S) / 1000000 ))"
ls -la "$D/$OUT"
