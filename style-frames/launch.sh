#!/bin/sh
# Launch 4 headless max-effort Claude agents, one per style frame; waits for all.
cd /c/Users/USER/Projects/shelter-mv/style-frames || exit 1
: > status.txt
for n in 01-pretrain 02-environment 03-hand 04-swarm; do
  mkdir -p "$n"
  (
    cd "$n" && \
    sed "s/FOLDER/$n/g" ../BRIEF.md ../prompts/$n.md | \
      claude -p --effort max --permission-mode auto > agent-log.txt 2>&1
    echo "$n exit=$? $(date +%H:%M:%S)" >> ../status.txt
  ) &
  echo "launched $n $(date +%H:%M:%S)"
  sleep 30
done
wait
echo "all done $(date +%H:%M:%S)"
cat status.txt
