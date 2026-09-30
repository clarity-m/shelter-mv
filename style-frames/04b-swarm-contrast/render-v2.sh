#!/bin/sh
# Render frame-v2.html with headless Chrome.
#   sh render.sh out.png [querystring]     -> screenshot
#   sh render.sh --dump [querystring]      -> print debug log from the page
DIR="C:/Users/USER/Projects/shelter-mv/style-frames/04b-swarm-contrast"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
if [ "$1" = "--dump" ]; then
  "$CHROME" --headless=new --hide-scrollbars --window-size=1920,1080 --virtual-time-budget=30000 \
    --ignore-gpu-blocklist --dump-dom "file:///$DIR/frame-v2.html$2" 2>/dev/null \
    | sed -n '/<pre id="dbg"/,/<\/pre>/p'
else
  OUT="${1:-frame-v2.png}"
  "$CHROME" --headless=new --hide-scrollbars --window-size=1920,1080 --virtual-time-budget=30000 \
    --ignore-gpu-blocklist --screenshot="$DIR/$OUT" "file:///$DIR/frame-v2.html$2" 2>&1 | grep -i "written\|error.*gl\|fail"
fi
