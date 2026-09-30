"""Revision 18 (Claire, 2026-09-29): S20 starts on 53.1, where the vocal phrase begins.

- S18: bars 47-50 (the catch on 47.4; experiments in 48; paint(cursors=10) on 49.1, painting through 49; the
  light, the sapling and the hill in 50).
- S19: bars 51-52 (the tree in 51; clawd.copy(4) early in the quiet bar 52, then one emote and stillness).
- S20: bars 53-56 (it gains a bar at the start and opens with the verse's phrase).
Backups: backups/cut16/.
"""
import json

P = "C:/Users/USER/Projects/shelter-mv/shots.json"
d = json.load(open(P, encoding="utf-8"))
by = {s["id"]: s for s in d["shots"]}
by["S18"]["bars"] = [47, 50]
by["S18"]["desc"] = by["S18"]["desc"].replace("paint the valley through bars 49-50", "paint the valley through bar 49").replace(
    "in bar 51 they burn away", "in bar 50 they burn away")
by["S19"]["bars"] = [51, 52]
by["S19"]["desc"] = (
    "Two bars: Clawd's first original creation. From the sapling of his first edits the tree of the final scene "
    "grows on the rising hill, drawn in light then filling with its glittering canopy: nothing like it existed in "
    "any training world. Then, early in the quiet bar 52, the humans' cursor types clawd.copy(4); four copies of "
    "Clawd appear beside him, each holding its own orange cursor, and the five share one emote and then stand still "
    "by the tree until the hard cut to S20.")
by["S20"]["bars"] = [53, 56]
by["S20"]["section"] = "verse-2a"
d["note"] = d["note"].rstrip() + " Revision 18 (09-29): S18 47-50, S19 51-52, S20 53-56 (S20 opens on the verse phrase)."
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
for sid in ("S17", "S18", "S19", "S20", "S25b"):
    b0, b1 = by[sid]["bars"]
    print(sid, by[sid]["bars"], fb(b0), fb(b1 + 1) - 1, fb(b1 + 1) - fb(b0))
