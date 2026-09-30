"""Revision 14 (Claire's notes on cut 13, 2026-09-29; she called it revision 15): consistency.

1. The three technologies as a group. Each inside world is an abstract picture of its technology's
   physics, a field, coloured by its own ramp, with no default-valley props:
   - S20: the protein's free-energy funnel, coloured by height like a topographic profile, with
     contour lines and no trees;
   - S34: the silicon crystal's periodic potential, a lattice of wells, coloured by height, with
     the chip drawn on it in light. It replaces the literal die layout.
   - S36: the magnetic field (the aurora's field lines, then the helices and coils), unchanged in
     spirit.
   The outside landings (S25b, S35, S21) share one shape: the landing, the consequence spreading,
   then a held beat. S35's pull-out is faster, so the campus holds for a beat.
2. Drop 1 simplified (S13-S17): the humans' cursor builds the valley alone, click by click, with typed
   lines carrying the music sync in place of camera moves (S13). Clawd explores it in three episodes (S14,
   the older scene). The cursor drags three different worlds in beside it, then a command duplicates them
   into a massive grid (S15). Clawd moves less and shows curiosity through small eye movements (S11).
Bars are unchanged. Backups: backups/cut13/.
"""
import json

P = "C:/Users/USER/Projects/shelter-mv/shots.json"
d = json.load(open(P, encoding="utf-8"))
by = {s["id"]: s for s in d["shots"]}

by["S13"]["desc"] = (
    "Bar 33 downbeat: the glyph extrudes into a solid. Then the humans' indigo paper cursor builds the first 3D "
    "world alone, click by click on the kicks, each click with a typed line: the ground, the ridges, the river, "
    "the trees, the mountains, the sky. The camera stays nearly still. Clawd waits on the pad and watches, his "
    "eyes following the cursor.")
by["S14"]["desc"] = (
    "He explores the valley in three episodes. Ground he crosses turns painted (learned), ahead stays grey; each "
    "stutter-stop freezes the frame and rewinds the episode, and each run gets further. Calm camera; his "
    "curiosity shows in small looks.")
by["S15"]["desc"] = (
    "Pull back: his valley is one tile. The humans' cursor drags in three different worlds beside it (a funnel "
    "crater, an icy shore, a salt flat), then types one command and clicks: the four duplicate outward into a "
    "massive grid, each tile with its own orange Clawd, colouring as it is solved.")
by["S17"]["desc"] = (
    "One bar: the camera dives from the massive grid into Clawd's own valley tile and down to the valley at dusk, "
    "where he stands alone.")
by["S20"]["desc"] = (
    "Hard cut: Clawd's cursors paint a new world in from nothing: the protein's free-energy landscape as terrain, "
    "a folding funnel coloured by height like a topographic profile, with contour lines, sinking to one deep basin. "
    "They drop amino acids on the rim, each typing its name and the real folding code along the chain; a few "
    "Clawds help, and the chain folds as it slides down the funnel into a glowing knot at the bottom. The camera "
    "pulls back out through the S08 screen: the night lab, researcher A leaning in to the knot on the screen.")
by["S34"]["desc"] = (
    "Inside, a world Clawd paints for the work: the silicon crystal's periodic potential, a lattice of wells to the "
    "horizon, coloured by height, the last strokes landing as we arrive. The cursors type code; a seed of light "
    "goes in and a chip is drawn flat across the lattice in lines of light, blocks and traces spreading from the "
    "seed, the code running along the traces. The crowd lays out more chips across the lattice. Ends on one chip "
    "exactly where S35's paper chip is.")
by["S35"]["desc"] = (
    "Outside, one bar: close on a paper chip on its card. On the downbeat the chip's outline lands on it and burns "
    "off; then one fast pull-out, card, rack, the hall of S16, out through the roof, to a campus of halls laid out "
    "like the chip, which holds for a beat as it lights.")
d["note"] = d["note"].rstrip() + (
    " Revision 14 (09-29): the three technologies as a group (abstract field worlds, own palettes; S35's campus "
    "holds a beat); drop 1 simplified (the cursor builds by clicks, three episodes, drag-and-drop then duplicate).")
lines = ["{", ' "note": ' + json.dumps(d["note"], ensure_ascii=False) + ",", ' "shots": [']
for i, s in enumerate(d["shots"]):
    lines.append("  " + json.dumps(s, ensure_ascii=False) + ("," if i < len(d["shots"]) - 1 else ""))
lines += [" ]", "}", ""]
open(P, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
print(len(d["shots"]), "shots")
