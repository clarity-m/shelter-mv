"""Revision 20 (Claire's viewers-notes-2 on cut 18, 2026-09-30; possibly the last revision).

Timing changes:
- S02 runs a beat longer (shift1 +18) so its flash lands on the bar-5 kick; S03 starts a beat later
  (shift0 +18).
- S06 is one bar (13), like S16; S07 returns at bar 14, the stack growing with the new hardware
  (cause and effect), before the lab at 15.
- S11 starts a beat earlier, on the vocal pickup (shift0 -18); S10 ends a beat earlier (shift1 -18).
Backups: git (efa56a9 is cut 18).
"""
import json

P = "C:/Users/USER/Projects/shelter-mv/shots.json"
d = json.load(open(P, encoding="utf-8"))
by = {s["id"]: s for s in d["shots"]}

by["S01"]["desc"] = (
    "Bookend: black card; on the first chop note a square hole lights orange from behind. The humans' indigo "
    "paper cursor comes in and draws the starburst's outline, ray by ray, as a thin line of light; then the rays "
    "fill with light and open.")
by["S02"]["shift1"] = 18
by["S02"]["desc"] = (
    "The burst folds down into the pixel Clawd shape; the humans' cursor types train(corpus) in its code panel "
    "and clicks, and the flash lands on the bar-5 kick, flooding the frame into the fly-through.")
by["S03"]["shift0"] = 18
by["S06"]["bars"] = [13, 13]
by["S06"]["desc"] = ("Outside, night: a GPU rack in layered card. A new card slides in on beat 1 and its LEDs light on "
                     "beat 3 (like S16); the bass stop on beat 4 hushes it.")
S07 = {"id": "S07", "bars": [14, 14], "section": "hook-1", "set": "transformer", "rung": 0, "still": None,
       "desc": ("Back inside, one bar: the new hardware becomes new layers. Out of the rack's rows the stack grows a "
                "layer per beat, the arcs firing faster across the taller stack; the bass stop on beat 4 freezes it "
                "before the lab.")}
by["S10"]["shift1"] = -18
by["S11"]["shift0"] = -18
by["S11"]["desc"] = (
    "Vector physics, from the vocal pickup on the last beat of bar 25. The paper cursor eases the ramp and Clawd "
    "makes it; then he tries the steep ramp alone. Through his resets the cursor stays, watching; when he tops "
    "the ramp it arcs back, pleased, lingers a moment, then leaves.")

shots = []
for s in d["shots"]:
    shots.append(s)
    if s["id"] == "S06":
        shots.append(S07)
d["shots"] = shots
d["note"] = d["note"].rstrip() + (
    " Revision 20 (09-30): S02 shift1 +18 / S03 shift0 +18 (flash on the bar-5 kick); S06 13, S07 back at 14 (the "
    "stack grows with the new hardware); S10 shift1 -18 / S11 shift0 -18 (S11 from the vocal pickup).")
lines = ["{", ' "note": ' + json.dumps(d["note"], ensure_ascii=False) + ",", ' "shots": [']
for i, s in enumerate(shots):
    lines.append("  " + json.dumps(s, ensure_ascii=False) + ("," if i < len(shots) - 1 else ""))
lines += [" ]", "}", ""]
open(P, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
cov = []
for s in shots:
    cov += list(range(s["bars"][0], s["bars"][1] + 1))
assert cov == list(range(1, 92)), "bars not contiguous"
fb = lambda b: round((0.38 + 2.4 * (b - 1)) * 30)
for sid in ("S01", "S02", "S03", "S06", "S07", "S08", "S10", "S11"):
    s = by.get(sid) or S07
    b0, b1 = s["bars"]
    f0 = (0 if b0 <= 1 else fb(b0)) + s.get("shift0", 0)
    f1 = fb(b1 + 1) + s.get("shift1", 0)
    print(sid, s["bars"], f0, f1 - 1, f1 - f0)
print(len(shots), "shots")
