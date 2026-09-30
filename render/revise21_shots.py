"""Revision 21 (Claire's viewers-notes-3 on cut 19, 2026-09-30): fixes only.

- Back to cut 18's early order: S06 (the GPU rack) is bars 13-14 again, and S07 (the bar-14 stack reprise)
  is removed (Claire: the reordering looked janky; cut 18's sequence is better). S06 keeps the new
  direction: both racks, rack 1 sliding in and lighting on beat 1, rack 2 on beat 3.
Backups: git (0b236b6 is cut 19).
"""
import json

P = "C:/Users/USER/Projects/shelter-mv/shots.json"
d = json.load(open(P, encoding="utf-8"))
shots = [s for s in d["shots"] if s["id"] != "S07"]
by = {s["id"]: s for s in shots}
by["S06"]["bars"] = [13, 14]
by["S06"]["desc"] = ("Outside, night: a GPU rack in layered card. Rack card 1 slides in and lights on beat 1, card 2 on "
                     "beat 3; both then pulse on beats 1 and 3, and the bass stops (13.4, 14.4) hush them. No people; "
                     "the help arrives as hardware.")
d["shots"] = shots
d["note"] = d["note"].rstrip() + " Revision 21 (09-30): S07 removed again; S06 13-14 (both racks, on beats 1 and 3)."
lines = ["{", ' "note": ' + json.dumps(d["note"], ensure_ascii=False) + ",", ' "shots": [']
for i, s in enumerate(shots):
    lines.append("  " + json.dumps(s, ensure_ascii=False) + ("," if i < len(shots) - 1 else ""))
lines += [" ]", "}", ""]
open(P, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
cov = []
for s in shots:
    cov += list(range(s["bars"][0], s["bars"][1] + 1))
assert cov == list(range(1, 92)), "bars not contiguous"
print(len(shots), "shots;", "S06", by["S06"]["bars"])
