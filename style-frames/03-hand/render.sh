#!/bin/sh
# usage: sh render.sh out.png [query-string]
# Renders frame.html headlessly at 1920x1080. Query string selects modes, e.g. "mode=debug&az=80".
OUT="$1"; QS="$2"
DIR="C:/Users/USER/Projects/shelter-mv/style-frames/03-hand"
URL="file:///$DIR/frame.html"
if [ -n "$QS" ]; then URL="$URL?$QS"; fi
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars \
  --window-size=1920,1080 --virtual-time-budget=60000 --force-device-scale-factor=1 \
  --screenshot="$DIR/$OUT" "$URL" 2>&1 | grep -v -e registration_request -e DEPRECATED_ENDPOINT -e "^$" | tail -3
