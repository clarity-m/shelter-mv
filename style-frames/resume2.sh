#!/bin/sh
# Resume the round-2 agents that the session limit interrupted.
# At most 5 run at once (pool). If an agent hits the usage limit again, it waits 20 min and retries (up to 12 times).
cd /c/Users/USER/Projects/shelter-mv/style-frames || exit 1
P=/c/Users/USER/.claude/projects/C--Users-USER-Projects-shelter-mv-style-frames-
MSG="Your previous run was cut off by a usage limit. Check what is in your folder, then continue where you left off and finish all deliverables per your brief (including NOTES.md and your final 3-5 sentence reply)."

run_one() {
  d=$1
  sid=$(ls -t "$P$d"/*.jsonl | head -1 | xargs -n1 basename | sed 's/\.jsonl$//')
  tries=0
  while [ $tries -lt 12 ]; do
    ( cd "$d" && claude -p --resume "$sid" --effort max --permission-mode auto "$MSG" >> agent-log.txt 2>&1 )
    code=$?
    if tail -c 300 "$d/agent-log.txt" | grep -q "hit your session limit"; then
      tries=$((tries+1)); echo "$d limit hit, retry $tries in 20m $(date +%H:%M)" >> resume2-status.txt; sleep 1200
    else
      echo "$d exit=$code $(date +%H:%M)" >> resume2-status.txt; return
    fi
  done
  echo "$d gave up $(date +%H:%M)" >> resume2-status.txt
}

: > resume2-status.txt
# Priority order: the 2D style comparison first, then revisions, then sprites.
for d in 06-style-riso 07-style-ligne-claire 08-style-anime-cel 09-style-pixel 02b-environment-poly 04b-swarm-contrast 05-clawd-sprites 01b-pretrain-tokens; do
  while [ "$(jobs -pr | wc -l)" -ge 5 ]; do sleep 30; done   # pool: max 5 concurrent
  run_one "$d" &
  sleep 20
done
wait
echo "all done $(date +%H:%M)"
cat resume2-status.txt
