"""Revision 9 (Claire's notes on cut 8, 2026-09-29): technological acceleration.

- Her benchmark is the greenhouse transition (S34 -> S35): its structure stays, but the
  advancement becomes compute. Clawd designs a compute card; people's hall of racks comes online
  under the same arches. It calls back to S06/S16, where people gave Clawd compute, and it's the
  loop that drives everything after.
- Acceleration: each consequence is an order of magnitude bigger, and lights faster, than the last.
  It runs vials, a hall, a reactor, a city, a ring of satellites round the Earth (S23, closing on
  the bar-69 kick), a fleet of sails pushed by an array of beams (S29), and the solar system
  left behind (S30). The crowd and Clawd's code grow the same way (real code from this film in
  S27 and S30).
- S25c (the stars marked) is cut, at Claire's suggestion; S23 takes bar 69.
Backups: backups/cut8/.
"""
import json

P = "C:/Users/USER/Projects/shelter-mv/shots.json"
d = json.load(open(P, encoding="utf-8"))
by = {s["id"]: s for s in d["shots"]}

by["S34"].update(set="compute-fields", desc=(
    "Inside, a world Clawd paints for the work, the last strokes landing as we arrive. The cursors type orange "
    "code; a seed of light goes into the soil and a compute card grows from it in lines of light: the board, the "
    "chip, its traces, the heat fins, the gold edge. The crowd, a dozen now, plants rows of them across the "
    "world, a server farm, the light racing up each row. Ends with one card in the foreground exactly where "
    "S35's paper card stands."))
by["S35"].update(set="compute-hall", desc=(
    "Outside, one bar: a paper hall of racks at night under arched ribs and vellum panels (the S06 rack and the "
    "S16 hall, people's building). On the downbeat the card's outline lands on the paper card in the nearest "
    "rack (only the card) and burns off; then the racks come online bay by bay down the aisle, and the vault "
    "warms."))
by["S36"]["desc"] = by["S36"]["desc"].replace("Clawd's cursors type", "More Clawds now; their cursors type")
by["S23"].update(bars=[66, 69], desc=(
    "Outside, four bars: a dark paper city by a river at night, the reactor glowing far off on the bank. Its light "
    "runs along the river into the city, and the city comes online building by building on the snare roll. Then "
    "the sky: satellites light one by one above it, faster and faster, and on the bar-69 kick they close into a "
    "ring across the sky, the first ring of a swarm. Nothing here was drawn by Clawd: it is what the breakthroughs "
    "add up to."))
by["S27"]["desc"] = (
    "Intercut, two beats at a time: the paper observatory turning its slit toward two pinholes, Alpha Centauri A "
    "and B (outside), and a crowd of thousands on a night salt flat drawing the rocket in lines of light "
    "(inside): every line of it, while their cursors type the real code that draws it. The drums drop out and "
    "the drawing completes; on the bar's last beat the world goes dark and only the lines remain, where the paper "
    "rocket will stand. No paper rocket before the drop.")
by["S29"]["desc"] = (
    "Liftoff on the bar 73 downbeat: every line of the drawing lands on the dark paper rocket and the engines "
    "ignite, the lines burning off into the exhaust. It climbs on a column of glowing tissue, through the ring of "
    "satellites. The fairing opens on a fleet of folded sails that spread and unfurl as an array, and on bar 76 "
    "a forest of beams rises from the lit Earth, one for each sail, and the fleet sails off.")
by["S30"]["desc"] = (
    "Per beat: the fleet leaving the solar system (outside), a new view each beat as the planets' orbits pass and "
    "the Sun shrinks to one star among many, and the two stars ahead grow, against a crowd of Clawds building "
    "the hill at the centre of the new world and raising towers behind it (inside), their code pouring out "
    "faster than it can be read. Bar 80's turnaround lands on the finished hill.")

d["shots"] = [s for s in d["shots"] if s["id"] != "S25c"]
d["note"] = d["note"].rstrip() + (
    " Revision 9 (09-29): acceleration. The third tech is compute (S34 card, S35 hall); S25c cut; S23 66-69 "
    "(the satellite ring); S29 a fleet of sails and a beam array; S30 leaves the solar system.")
lines = ["{", ' "note": ' + json.dumps(d["note"], ensure_ascii=False) + ",", ' "shots": [']
for i, s in enumerate(d["shots"]):
    lines.append("  " + json.dumps(s, ensure_ascii=False) + ("," if i < len(d["shots"]) - 1 else ""))
lines += [" ]", "}", ""]
open(P, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
cov = []
for s in d["shots"]:
    cov += list(range(s["bars"][0], s["bars"][1] + 1))
assert cov == list(range(1, 92)), "bars not contiguous"
print(len(d["shots"]), "shots:", " ".join(s["id"] for s in d["shots"]))
