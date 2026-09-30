"""Revision 10 (Claire's notes on cut 9, 2026-09-29): artistic refinement. The bars are unchanged.

- S34: the chip is drawn flat on the ground, in a world coloured like a die shot and a wafer.
  S35 opens on the paper chip and zooms and pans outward to the whole hall.
- S27: a stress and strain analysis of the tether replaces the tilt up it.
- S29: dramatic motion blur as the climber rockets up; it ejects its payload, and the fleet
  unfolds with only sails and beams in view.
- S30: the Earth and planet beats are cut; three calm voyage views, two beats each.
- Code: scrolling horizontal lines that live in the world, not a wall laid over it. The real
  protein code joins the cursors in S20.
Backups: backups/cut9/.
"""
import json

P = "C:/Users/USER/Projects/shelter-mv/shots.json"
d = json.load(open(P, encoding="utf-8"))
by = {s["id"]: s for s in d["shots"]}

by["S20"]["desc"] = (
    "Opens on S19's own view (a short dissolve). Clawd's orange cursors drop amino acids over the new hill, each "
    "typing its name in orange, and the real code that folds them runs along the chain as it links; a few Clawds "
    "pop out of Clawd's light to help fold it into a glowing knot. The camera pulls back out through the S08 "
    "screen: the night lab, researcher A leaning in to the knot on the screen.")
by["S34"].update(set="die-fields", desc=(
    "Inside, a world Clawd paints for the work: a land coloured like a die shot, iridescent blocks of teal, rose, "
    "gold and violet, the last strokes landing as we arrive. The cursors type code; a seed of light goes into the "
    "ground and a chip is drawn flat across it in lines of light, blocks and traces spreading out from the seed, "
    "the code running along the traces. The crowd lays out more chips across the land, a wafer to the horizon. "
    "Ends on one chip on the ground exactly where S35's paper chip is."))
by["S35"]["desc"] = (
    "Outside, one bar: close on a paper chip on its card. On the downbeat the chip's outline lands on it (only the "
    "chip) and burns off; then the camera zooms and pans outward, card, rack, aisle, to the whole hall of racks "
    "under arched ribs and vellum panels, coming online bay by bay as the vault warms.")
by["S27"]["desc"] = (
    "Intercut, two beats at a time: the paper observatory turning its slit toward two pinholes, Alpha Centauri A "
    "and B (outside), and a crowd of thousands on a night salt flat drawing a space elevator in lines of light "
    "(inside). While they draw, the tether is analysed in light: a strain map running up the ribbon, force arrows, "
    "the load curve. Their code streams in horizontal lines across the flat. On the bar's last beat the world goes "
    "dark and only the lines remain, where the paper elevator will stand.")
by["S29"]["desc"] = (
    "On the bar 73 drop every line of the drawing lands on the paper space elevator and burns off, and the climber "
    "lights and rockets up the ribbon in a streak of motion blur, out of the sky and into space, and flings its "
    "payload free. The payload bursts into a fleet of folded sails that unfurl as an array against the black, and "
    "on bar 76 a forest of beams rises from below, one for each sail, and the fleet sails off: only sails and "
    "beams in view.")
by["S30"]["desc"] = (
    "Two beats at a time: a crowd of Clawds building the hill at the centre of the new world and raising towers "
    "behind it (inside), their code streaming through the world in horizontal lines, against the fleet's voyage "
    "(outside) in three calm views: the Sun and its orbits small behind the hero sail, the Sun one star among "
    "many, the two stars ahead. Bar 80's turnaround lands on the finished hill.")
d["note"] = d["note"].rstrip() + (" Revision 10 (09-29): artistic refinement (chips on the ground, the hall's pull-out, "
                                  "the elevator's motion blur, sails and beams alone, code in the world).")
lines = ["{", ' "note": ' + json.dumps(d["note"], ensure_ascii=False) + ",", ' "shots": [']
for i, s in enumerate(d["shots"]):
    lines.append("  " + json.dumps(s, ensure_ascii=False) + ("," if i < len(d["shots"]) - 1 else ""))
lines += [" ]", "}", ""]
open(P, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
print(len(d["shots"]), "shots")
