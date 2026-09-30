"""Revision 22 (Claire's viewers-notes-4 on cut 20, 2026-09-30): she picked the alternate hook-1 order.

- Hook 1 is S04 (9-10), S06 (11, the GPU rack), S07 (12, the new hardware becomes new layers; xin 6),
  S05 (13-14, the loss curve; xin 6), S08 (15-16). This is the A/B's alternate (render/ab_hook1.py).
- S06: the cards go in on beats 2 and 3 (Claire: the bar sounds chord-kick-kick-kick).
- No freezes or slow motion at the bass stops anywhere in the hook (Claire: they interrupt the flow).
Backups: git (7120f8a is cut 20).
"""
import json

P = "C:/Users/USER/Projects/shelter-mv/shots.json"
d = json.load(open(P, encoding="utf-8"))
by = {s["id"]: s for s in d["shots"]}
assert "S07" not in by, "S07 is already in shots.json"
by["S06"]["bars"] = [11, 11]
by["S06"]["desc"] = ("Outside, night: a GPU rack in layered card, one bar. The chord on beat 1 shows the rack; card 1 "
                     "slides in and lights on the beat-2 kick, card 2 on the beat-3 kick, and both pulse on beat 4. "
                     "No people; the help arrives as hardware.")
S07 = {"id": "S07", "bars": [12, 12], "section": "hook-1", "set": "transformer", "rung": 0, "still": None,
       "desc": ("Back inside, one bar: the new hardware becomes new layers. Out of the rack's rows the stack grows a "
                "layer per beat, the arcs firing faster across the taller stack."), "xin": 6}
by["S05"]["bars"] = [13, 14]
by["S05"]["xin"] = 6
by["S05"]["desc"] = ("Numbers going up, out of S07's stack: its arcs gather into one that becomes the loss curve, which "
                     "falls in one sweep while tokens-seen and FLOP counters spin, all around the tiny orange figure. "
                     "It runs straight through the bass stops (13.4, 14.4).")
by["S04"]["desc"] = ("Fast motion. Transformer visualization: the token line lifts into stacked layers, and attention "
                     "arcs fire between tokens on each chop note, straight through the 9.4 bass stop.")
shots = []
for s in d["shots"]:
    if s["id"] == "S05":
        continue                                  # moved after S07
    shots.append(s)
    if s["id"] == "S06":
        shots += [S07, by["S05"]]
assert [s["id"] for s in shots[3:8]] == ["S04", "S06", "S07", "S05", "S08"], [s["id"] for s in shots[:9]]
d["shots"] = shots
d["note"] = d["note"].rstrip() + (" Revision 22 (09-30): Claire's alternate hook-1 order, S04 9-10, S06 11, S07 12,"
                                  " S05 13-14, S08 15-16; no freezes at the bass stops.")
lines = ["{", ' "note": ' + json.dumps(d["note"], ensure_ascii=False) + ",", ' "shots": [']
for i, s in enumerate(shots):
    lines.append("  " + json.dumps(s, ensure_ascii=False) + ("," if i < len(shots) - 1 else ""))
lines += [" ]", "}", ""]
open(P, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
cov = []
for s in shots:
    cov += list(range(s["bars"][0], s["bars"][1] + 1))
assert cov == list(range(1, 92)), "bars not contiguous"
print(len(shots), "shots;", " ".join(f"{s['id']}{s['bars']}" for s in shots[3:8]))
