"""Revision 15 (Claire's notes on cut 14, 2026-09-29): the pivot (S18-S19) redesigned, the campus held longer.

- S35 holds the full campus another beat: it ends a beat into bar 62 (shift1 +18), and S36 starts on 62.2
  (shift0 +18, its first bar compressed to three beats; bars 63-64 unchanged).
- S18: the humans' cursor drags in a new cursor for Clawd and lets go; it flutters down and Clawd catches it
  (the tool given freely, in S15's drag-and-drop grammar). The humans keep their own cursor.
- S19: Clawd's first original creation: from the sapling of its first edits, the tree of the final scene
  (nothing like it in any training world). Then the humans' cursor copies Clawd, `clawd.copy(4)`, and the
  copies arrive holding their own cursors: the crowd that works in S20 is made by the humans, trusted after
  what Clawd made.
Backups: backups/cut14/.
"""
import json

P = "C:/Users/USER/Projects/shelter-mv/shots.json"
d = json.load(open(P, encoding="utf-8"))
by = {s["id"]: s for s in d["shots"]}

by["S18"]["desc"] = (
    "The pivot, one slow shot, from the last bar of the drop through the breakdown. The humans' indigo paper "
    "cursor drags in a new cursor, blank paper, and brings it above Clawd; on the breakdown it lets go and "
    "withdraws, keeping its own. The new cursor flutters down like a sheet of paper, rocking, Clawd's eyes "
    "tracking it, and he catches it: it lights orange. He explores with it: small first edits, each a typed "
    "line (a puddle, a pebble, a sapling, undone and redone). Then it splits into ten cursors that paint the "
    "valley, bringing in what he learned in the other worlds, and burn away into light that returns to him.")
by["S19"]["desc"] = (
    "One bar: Clawd's first original creation. From the sapling of his first edits the tree of the final scene "
    "grows on the rising hill, drawn in light then filling with its glittering canopy: nothing like it existed "
    "in any training world. Then the humans' cursor returns and types clawd.copy(4); four copies of Clawd "
    "appear beside him, each holding its own orange cursor. Hard cut to S20.")
by["S20"]["desc"] = (
    "Hard cut: the five Clawds (Clawd and his four copies) paint a new world in from nothing, each with his own "
    "orange cursor: the protein's free-energy landscape as terrain, a folding funnel coloured by height with "
    "contour lines, sinking to one deep basin. They drop amino acids on the rim, each typing its name and the "
    "real folding code along the chain, and together they fold the chain as it slides down the funnel into a "
    "glowing knot at the bottom. The camera pulls back out through the S08 screen: the night lab, researcher A "
    "leaning in to the knot on the screen.")
by["S35"]["shift1"] = 18
by["S35"]["desc"] = by["S35"]["desc"].replace("which holds for a beat as it lights.",
                                              "which holds for two beats as it lights (the shot runs a beat into bar 62).")
by["S36"]["shift0"] = 18
by["S36"]["desc"] = by["S36"]["desc"].replace("Inside, a polar sea", "From 62.2 (its first bar is three beats), inside, a polar sea")
d["note"] = d["note"].rstrip() + (
    " Revision 15 (09-29): S18 the humans drag in a cursor for Clawd, it flutters down; S19 Clawd's first original "
    "creation (the final scene's tree) then clawd.copy(4); S20's helpers are those copies; S35 shift1 +18, S36 "
    "shift0 +18 (the campus holds two beats).")
lines = ["{", ' "note": ' + json.dumps(d["note"], ensure_ascii=False) + ",", ' "shots": [']
for i, s in enumerate(d["shots"]):
    lines.append("  " + json.dumps(s, ensure_ascii=False) + ("," if i < len(d["shots"]) - 1 else ""))
lines += [" ]", "}", ""]
open(P, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
fb = lambda b: round((0.38 + 2.4 * (b - 1)) * 30)
for sid in ("S35", "S36", "S21"):
    s = by[sid]; b0, b1 = s["bars"]
    f0 = fb(b0) + s.get("shift0", 0); f1 = fb(b1 + 1) + s.get("shift1", 0)
    print(sid, s["bars"], f0, f1 - 1, f1 - f0)
