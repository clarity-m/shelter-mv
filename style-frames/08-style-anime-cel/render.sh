#!/bin/sh
# usage: sh render.sh out.png [query-string] [WxH]
# Renders frame.html headlessly. Prints the page's console lines (timings, errors).
OUT="${1:-frame.png}"; QS="$2"; SIZE="${3:-1920,1080}"
DIR="C:/Users/USER/Projects/shelter-mv/style-frames/08-style-anime-cel"
URL="file:///$DIR/frame.html"
if [ -n "$QS" ]; then URL="$URL?$QS"; fi
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=$SIZE --virtual-time-budget=60000 \
  --enable-logging=stderr --v=0 --screenshot="$DIR/$OUT" "$URL" 2>&1 \
  | grep -i -E "CONSOLE|uncaught|error" | grep -v -i -E "registration|DEPRECATED|gcm|dbus|GpuProcess" | sed -e 's/.*CONSOLE([0-9]*)\] *//' | head -20
ls -la "$OUT" | awk '{print $5, $9}'
