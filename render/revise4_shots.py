"""Revision 4 (Claire's notes on cut 4, 2026-09-28): timing and pacing, the hand-off, the rung-4 look.

- S08 gives a bar to the physics scene: S08 bars 17-19, S10 bars 20-25, S11 bars 26-30.
- S11 gains a beat of independence: after the eased ramp, Clawd tries the steep one alone and makes it.
- S18: the humans' cursor hovers, is let go, falls, and Clawd catches it (the tool given freely).
- Rung 4 takes S18's painted-valley look in place of the hazy luminous paint (S19-S25c), which also
  leads more smoothly into the final environment.
Backups: backups/cut4/.
"""
import json

P = "C:/Users/USER/Projects/shelter-mv/shots.json"
d = json.load(open(P, encoding="utf-8"))
by = {s["id"]: s for s in d["shots"]}

by["S08"].update(bars=[17, 19], desc=(
    "The night lab, three bars. Clawd glows inside a cut-paper computer screen whose light is the room's light; "
    "researcher A at the mouse moves the paper cursor beside him while B stands with a mug. In the last beats the "
    "camera pushes through the glass into his glow."))
by["S10"].update(bars=[20, 25], desc=(
    "First environment, pixel (bars 20-25). Clawd fails at a gap twice (episode resets). A cut-paper cursor from "
    "the outside world drops in, adds one line of code, and one block appears: enough to jump on. He jumps across "
    "and reaches the flag; +1 as the kick drops out at bar 25."))
by["S11"].update(bars=[26, 30], desc=(
    "Vector physics (bars 26-30). Clawd slides back down a steep ramp; the paper cursor eases it and he makes it. "
    "Then he tries the steep ramp again on his own and makes it on the bar-29 snare, and the environments flick "
    "past on the snares, each more saturated."))
by["S18"]["desc"] = ("Breakdown, the pivot, one slow shot. The humans' indigo paper cursor comes down and hovers above "
                     "Clawd, then is let go: it falls, and he catches it, and it lights orange from inside (the tool "
                     "given freely). He types one line and it splits into ten cursors that paint the valley stroke by "
                     "stroke; then they burn away into light that returns to him.")
for sid in ("S19", "S20", "S22", "S24", "S25", "S25c"):
    by[sid]["look"] = "painted-valley"
d["note"] = d["note"].rstrip() + (" Revision 4 (09-28): S08 17-19, S10 20-25, S11 26-30; S18's cursor is let go and "
                                  "caught; rung 4 takes S18's painted-valley look ('look' field).")
lines = ["{", ' "note": ' + json.dumps(d["note"], ensure_ascii=False) + ",", ' "shots": [']
for i, s in enumerate(d["shots"]):
    lines.append("  " + json.dumps(s, ensure_ascii=False) + ("," if i < len(d["shots"]) - 1 else ""))
lines += [" ]", "}", ""]
open(P, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
print(len(d["shots"]), "shots")
