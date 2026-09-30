#!/bin/sh
# usage: sh render.sh out.png [querystring] [W,H]
#   sh render.sh pass1.png
#   sh render.sh detail.png "?view=detail&x=760&y=600&z=3" 1080,1080
OUT="${1:-frame.png}"
QS="${2:-}"
SIZE="${3:-1920,1080}"
DIR="C:/Users/USER/Projects/shelter-mv/style-frames/07-style-ligne-claire"
cd /c/Users/USER/Projects/shelter-mv/style-frames/07-style-ligne-claire || exit 1
T0=$(date +%s%N)
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=$SIZE --virtual-time-budget=30000 --enable-logging=stderr --v=0 \
  --screenshot="$DIR/$OUT" "file:///$DIR/frame.html$QS" 2>&1 | grep -i -E "CONSOLE|uncaught" | head -20
T1=$(date +%s%N)
echo "wall time (chrome launch + render): $(( (T1 - T0) / 1000000 )) ms"
ls -la "$OUT"
