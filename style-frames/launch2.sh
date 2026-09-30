#!/bin/sh
# Round 2: 8 headless max-effort agents; waits for all.
cd /c/Users/USER/Projects/shelter-mv/style-frames || exit 1
: > status2.txt
for n in 01b-pretrain-tokens 02b-environment-poly 04b-swarm-contrast 05-clawd-sprites 06-style-riso 07-style-ligne-claire 08-style-anime-cel 09-style-pixel; do
  mkdir -p "$n"
  extra=""
  case "$n" in 06-*|07-*|08-*|09-*) extra="prompts/_style-common.md";; esac
  (
    cd "$n" && \
    ( cd .. && sed "s/FOLDER/$n/g" BRIEF.md ROUND2.md prompts/$n.md $extra ) | \
      claude -p --effort max --permission-mode auto > agent-log.txt 2>&1
    echo "$n exit=$? $(date +%H:%M:%S)" >> ../status2.txt
  ) &
  echo "launched $n $(date +%H:%M:%S)"
  sleep 30
done
wait
echo "all done $(date +%H:%M:%S)"
cat status2.txt
