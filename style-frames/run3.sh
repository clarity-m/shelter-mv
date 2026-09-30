#!/bin/sh
# Round 3: 4 resumed agents (with director notes) + 1 new agent. Pool of 5, max effort.
# On a usage-limit hit: wait 20 min and retry (up to 12 times); resumes keep context.
cd /c/Users/USER/Projects/shelter-mv/style-frames || exit 1
P=/c/Users/USER/.claude/projects/C--Users-USER-Projects-shelter-mv-style-frames-
CONT="Your previous run was cut off by a usage limit. Check your folder, continue where you left off, and finish all deliverables."
: > status3.txt
printf '%s
' "$CONT" > notes/_cont.md

limit_hit() { tail -c 300 "$1/agent-log.txt" | grep -q "hit your session limit"; }
sid_of() { ls -t "$P$1"/*.jsonl | head -1 | xargs -n1 basename | sed 's/\.jsonl$//'; }

run_resume() {  # $1 folder, $2 notes file
  d=$1; mf=$2; tries=0
  while [ $tries -lt 12 ]; do
    ( cd "$d" && claude -p --resume "$(sid_of "$d")" --effort max --permission-mode auto < "../$mf" >> agent-log.txt 2>&1 )
    code=$?
    if limit_hit "$d"; then tries=$((tries+1)); mf=notes/_cont.md; echo "$d limit, retry $tries $(date +%H:%M)" >> status3.txt; sleep 1200
    else echo "$d exit=$code $(date +%H:%M)" >> status3.txt; return; fi
  done
}

run_new() {  # $1 folder
  d=$1; mkdir -p "$d"
  sed "s/FOLDER/$d/g" BRIEF.md ROUND2.md "prompts/$d.md" | ( cd "$d" && claude -p --effort max --permission-mode auto > agent-log.txt 2>&1 )
  code=$?
  if limit_hit "$d"; then
    echo "$d limit on first run $(date +%H:%M)" >> status3.txt
    printf '%s\n' "$CONT" > "notes/_cont.md"; sleep 1200; run_resume "$d" notes/_cont.md
  else echo "$d exit=$code $(date +%H:%M)" >> status3.txt; fi
}

run_resume 09-style-pixel notes/09-v2.md & sleep 20
run_resume 04b-swarm-contrast notes/04b-v2.md & sleep 20
run_resume 02b-environment-poly notes/02b-v2.md & sleep 20
run_resume 05-clawd-sprites notes/05-v2.md & sleep 20
run_new 10-world-ladder &
wait
echo "all done $(date +%H:%M)"; cat status3.txt
