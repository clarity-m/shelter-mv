#!/bin/sh
# Usage: sh render.sh <page.html> <out.png> [width height]
# Renders a page in headless Chrome and prints the wall time.
DIR="C:/Users/USER/Projects/shelter-mv/style-frames/05-clawd-sprites"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
PAGE="$1"; OUT="$2"; WW="${3:-1920}"; HH="${4:-1080}"
T0=$(date +%s.%N)
"$CHROME" --headless=new --hide-scrollbars --window-size=$WW,$HH --virtual-time-budget=30000 \
  --screenshot="$DIR/$OUT" "file:///$DIR/$PAGE" >/dev/null 2>&1
T1=$(date +%s.%N)
python3 -c "print('rendered $OUT in %.1f s' % ($T1 - $T0))"
