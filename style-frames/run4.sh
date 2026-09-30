#!/bin/sh
# Round 4: outside-world style test. 3 backlit-paper agents + 1 pixel baseline.
# Pool of 4, max effort. On a usage-limit hit: wait 20 min and resume (up to 12 times).
cd /c/Users/USER/Projects/shelter-mv/style-frames || exit 1
P=/c/Users/USER/.claude/projects/C--Users-USER-Projects-shelter-mv-style-frames-
CONT="Your previous run was cut off by a usage limit. Check your folder, continue where you left off, and finish all deliverables."
: > status4.txt
printf '%s\n' "$CONT" > notes/_cont.md

limit_hit() { tail -c 300 "$1/agent-log.txt" | grep -q "hit your session limit"; }
sid_of() { ls -t "$P$1"/*.jsonl | head -1 | xargs -n1 basename | sed 's/\.jsonl$//'; }

run_resume() {  # $1 folder
  d=$1; tries=0
  while [ $tries -lt 12 ]; do
    ( cd "$d" && claude -p --resume "$(sid_of "$d")" --effort max --permission-mode auto < ../notes/_cont.md >> agent-log.txt 2>&1 )
    code=$?
    if limit_hit "$d"; then tries=$((tries+1)); echo "$d limit, retry $tries $(date +%H:%M)" >> status4.txt; sleep 1200
    else echo "$d exit=$code $(date +%H:%M)" >> status4.txt; return; fi
  done
}

run_new() {  # $1 folder, $2 common style file ('' for none)
  d=$1; mkdir -p "$d"
  sed "s/FOLDER/$d/g" ROUND4.md $2 "prompts/$d.md" | ( cd "$d" && claude -p --effort max --permission-mode auto > agent-log.txt 2>&1 )
  code=$?
  if limit_hit "$d"; then
    echo "$d limit on first run $(date +%H:%M)" >> status4.txt
    sleep 1200; run_resume "$d"
  else echo "$d exit=$code $(date +%H:%M)" >> status4.txt; fi
}

run_new 11-paper-lab prompts/_paper-common.md & sleep 20
run_new 12-paper-fusion prompts/_paper-common.md & sleep 20
run_new 13-paper-swarm prompts/_paper-common.md & sleep 20
run_new 14-pixel-swarm "" &
wait
echo "all done $(date +%H:%M)" >> status4.txt; cat status4.txt
