"""Revision 17 (Claire, 2026-09-29): S16 gives a bar to the pivot, so the breakdown opens on Clawd painting.

- S16 (the GPU hall): bar 45 only; its LED row lights on the 45.4 stop.
- S17 (the dive): bar 46, landing on S18's first frame.
- S18: bars 47-51. The drag-in, drop and catch in 47 (the catch on the upbeat 47.4); the first edits in 48,
  one per drum hit (48.1, 48.2, 48.3, 48.4 and the chop at 48.4.5); paint(cursors=10) bursts out on 49.1 as
  the drums drop out and the vocals enter, and the ten cursors paint through 49-50; 51 is the light, the
  sapling and the hill, as before.
- S19: bars 52-53, unchanged.
Backups: backups/cut16/.
"""
import json

P = "C:/Users/USER/Projects/shelter-mv/shots.json"
d = json.load(open(P, encoding="utf-8"))
by = {s["id"]: s for s in d["shots"]}
by["S16"]["bars"] = [45, 45]
by["S16"]["desc"] = ("Outside: the rack is now a hall of racks in receding card layers. A row of pinhole LEDs lights on "
                     "the bar-45 stop.")
by["S17"]["bars"] = [46, 46]
by["S18"]["bars"] = [47, 51]
by["S18"]["desc"] = (
    "The pivot. The humans' indigo paper cursor drags in a new cursor, blank paper, lets it go and withdraws, "
    "keeping its own; it flutters down and Clawd catches it on the upbeat of bar 47, and it lights orange. In "
    "bar 48 he experiments with it, one small edit per drum hit, each a typed line (a puddle, a pebble, a "
    "sapling, undone and redone). On the bar-49 downbeat, as the drums drop out and the voice enters, "
    "paint(cursors=10) bursts into ten cursors that paint the valley through bars 49-50, bringing in what he "
    "learned in the other worlds; in bar 51 they burn away into light that returns to him as the sapling starts "
    "to grow and the hill swells.")
d["note"] = d["note"].rstrip() + " Revision 17 (09-29): S16 45, S17 46, S18 47-51 (painting lands on 49.1)."
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
for sid in ("S15", "S16", "S17", "S18", "S19"):
    b0, b1 = by[sid]["bars"]
    print(sid, by[sid]["bars"], fb(b0), fb(b1 + 1) - 1, fb(b1 + 1) - fb(b0))
