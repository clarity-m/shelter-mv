"""Revision 13 (Claire's notes, 2026-09-29): drop 1 and the pivot (S13-S19) made clear.

- S13-S15 take S11's shape with the humans' cursor escalating. In S10 it added one block, in S11 it eased
  a ramp, and now it builds whole worlds for Clawd: the valley, then a crater and an icy shore, each
  learned faster. The wall of worlds (S15) is the flick montage at scale, with many cursors building tiles.
  Then S18 hands that world-building tool to Clawd.
- S18 starts a bar earlier (48-52), and the catch comes earlier, so Clawd has more time to explore with the
  cursor: tentative first edits, then the ten cursors. S17's dive is one bar (47).
- S19 cuts to S20 (no dissolve). S20 opens with Clawd creating the funnel world from nothing, like
  S34 and S36.
Backups: backups/cut11/.
"""
import json

P = "C:/Users/USER/Projects/shelter-mv/shots.json"
d = json.load(open(P, encoding="utf-8"))
by = {s["id"]: s for s in d["shots"]}

by["S13"]["desc"] = (
    "Bar 33 downbeat: the glyph extrudes into a solid and the camera swings around him. The humans' indigo "
    "paper cursor draws the first 3D world for him: the low-poly valley rises where it sweeps, a wave of facets "
    "per kick. Clawd hops off the pad and explores it; the ground he crosses turns painted (learned).")
by["S14"]["desc"] = (
    "On each stutter-stop the humans' cursor draws a new, harder world for him (a funnel crater, then an icy "
    "shore): grey until he runs it, then painted as he learns it, each one faster than the last.")
by["S15"]["desc"] = (
    "Pull back: his world is one tile in a wall of hundreds of parallel environments of many kinds, and paper "
    "cursors are at work across the wall building new ones; each tile has its own orange Clawd, and each colours "
    "as it is solved: the flick montage at scale.")
by["S17"].update(bars=[47, 47], desc=(
    "One bar: the camera dives from the wall of worlds into Clawd's own tile and down to the valley at dusk, "
    "where he stands alone."))
by["S18"].update(bars=[48, 52], desc=(
    "The pivot, one slow shot, from the last bar of the drop through the breakdown. The humans' indigo paper "
    "cursor, the one that built his worlds, comes down and hovers above Clawd, is let go, falls, and he catches "
    "it; it lights orange. He explores with it: small, curious first edits, each a typed line. Then it splits "
    "into ten cursors that paint the valley stroke by stroke, bringing in what he learned in the other worlds "
    "(a crater lake, a salt plain, icy caps), and burn away into light that returns to him."))
by["S19"]["desc"] = (
    "One bar in the painted valley: with his own light Clawd raises the hill from the valley floor under him, "
    "and a tree grows on its shoulder: the hill of the final scene, first made here. Hard cut to S20.")
by["S20"].pop("xin", None)
by["S20"]["desc"] = (
    "Hard cut: Clawd's cursors paint a new world in from nothing, a folding funnel, the protein's energy "
    "landscape as terrain, spiral terraces sinking to one deep basin. They drop amino acids on the rim, each "
    "typing its name and the real folding code along the chain; a few Clawds help, and the chain folds as it "
    "slides down the funnel into a glowing knot at the bottom. The camera pulls back out through the S08 screen: "
    "the night lab, researcher A leaning in to the knot on the screen.")
d["note"] = d["note"].rstrip() + (
    " Revision 13 (09-29): drop 1 on S11's shape (the humans' cursor builds worlds); S17 47, S18 48-52; "
    "S19 to S20 a hard cut; S20 opens by creating its world.")
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
for sid in ("S16", "S17", "S18", "S19", "S20"):
    b0, b1 = by[sid]["bars"]
    print(sid, by[sid]["bars"], fb(b0), fb(b1 + 1) - 1, fb(b1 + 1) - fb(b0), by[sid].get("xin", ""))
