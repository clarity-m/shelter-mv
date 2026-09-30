#!/bin/sh
# usage: sh render.sh out.png   (renders frame.html with headless Chrome, prints console errors)
OUT="${1:-frame.png}"
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1920,1080 --virtual-time-budget=30000 --enable-logging=stderr --v=0 --screenshot="C:/Users/USER/Projects/shelter-mv/style-frames/01b-pretrain-tokens/$OUT" "file:///C:/Users/USER/Projects/shelter-mv/style-frames/01b-pretrain-tokens/frame.html" 2>&1 | grep -i -E "CONSOLE|uncaught" | head -20
ls -la "$OUT"
