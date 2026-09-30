"""Revision 16 (Claire's note on cut 15, 2026-09-29): the pivot re-timed a bar earlier.

The drag-in, drop and flutter happen faster within bar 48, and Clawd catches the cursor on the upbeat,
48.4, just before the breakdown's vocals enter on 49. Everything after moves up a bar, so after
clawd.copy(4) the five Clawds get a beat or two of room before the cut to S20.
- S18: bars 48-51 (drag-in, drop and catch 48; first edits 49; ten cursors 50; the light, the sapling
  and the hill swelling 51).
- S19: bars 52-53 (the tree 52; the copy on 53.1-53.2; the five by the tree hold until the cut).
Backups: backups/cut15/.
"""
import json

P = "C:/Users/USER/Projects/shelter-mv/shots.json"
d = json.load(open(P, encoding="utf-8"))
by = {s["id"]: s for s in d["shots"]}
by["S18"]["bars"] = [48, 51]
by["S18"]["desc"] = (
    "The pivot, from the last bar of the drop into the breakdown. The humans' indigo paper cursor drags in a new "
    "cursor, blank paper, lets it go and withdraws, keeping its own; it flutters down and Clawd catches it on the "
    "upbeat of bar 48, and it lights orange as the breakdown's voice enters. He explores with it: small first "
    "edits, each a typed line (a puddle, a pebble, a sapling, undone and redone). Then it splits into ten cursors "
    "that paint the valley, bringing in what he learned in the other worlds, and they burn away into light that "
    "returns to him as the sapling starts to grow and the hill swells.")
by["S19"]["bars"] = [52, 53]
by["S19"]["desc"] = (
    "Two bars: Clawd's first original creation. From the sapling of his first edits the tree of the final scene "
    "grows on the rising hill, drawn in light then filling with its glittering canopy: nothing like it existed in "
    "any training world. Then the humans' cursor returns and types clawd.copy(4); four copies of Clawd appear "
    "beside him, each holding its own orange cursor, and the five stand by the tree for a beat or two before the "
    "hard cut to S20.")
d["note"] = d["note"].rstrip() + (" Revision 16 (09-29): S18 48-51 (the catch on 48.4), S19 52-53 (room after "
                                  "the copy).")
lines = ["{", ' "note": ' + json.dumps(d["note"], ensure_ascii=False) + ",", ' "shots": [']
for i, s in enumerate(d["shots"]):
    lines.append("  " + json.dumps(s, ensure_ascii=False) + ("," if i < len(d["shots"]) - 1 else ""))
lines += [" ]", "}", ""]
open(P, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
cov = []
for s in d["shots"]:
    cov += list(range(s["bars"][0], s["bars"][1] + 1))
assert cov == list(range(1, 92)), "bars not contiguous"
fb = lambda b: round((0.38 + 2.4 * (b - 1)) * 30)
for sid in ("S17", "S18", "S19", "S20"):
    b0, b1 = by[sid]["bars"]
    print(sid, by[sid]["bars"], fb(b0), fb(b1 + 1) - 1, fb(b1 + 1) - fb(b0))
