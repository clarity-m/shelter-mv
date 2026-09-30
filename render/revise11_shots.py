"""Revision 11 (Claire's notes on cut 10, 2026-09-29).

- Drop 1 (S13-S15), which runs slowly, introduces more low-poly training environments after the first is
  learned: early grey versions of the worlds Clawd will later build (a funnel crater, an icy shore, a
  salt flat, a grid plain). When Clawd gets the cursor (S18), the ten cursors bring those worlds' traits
  into the painted valley.
- S20 and S36 get their own worlds, as S34 has: the protein folds down a folding funnel (its energy
  landscape as terrain), and the sun becomes the ring on a polar sea under the aurora (plasma held by
  magnetic field lines, which is what a fusion reactor imitates).
- S26 (the observatory) returns as its own shot at bar 70, and S27 (bars 71-72) is the blueprint alone:
  they play one after the other instead of intercut.
- The elevator moves a beat earlier. S27's lines-alone moment shrinks to 6 frames, and S29 opens 12 frames
  before the drop, landing during the fill, so the climber launches on the bar-73 downbeat with a
  harder acceleration and zoom.
- The fleet: refined sail geometry and formation, seen closer, so it reads as expansive.
Backups: backups/cut10/.
"""
import json

P = "C:/Users/USER/Projects/shelter-mv/shots.json"
d = json.load(open(P, encoding="utf-8"))
by = {s["id"]: s for s in d["shots"]}

by["S14"]["desc"] = (
    "He runs the valley; ground he crosses turns painted (learned), ahead stays grey CG. Once it is learned, "
    "each stutter-stop resets the episode into a new low-poly world, grey until he runs it: early versions of "
    "the worlds he will later build (a funnel crater, an icy shore, a salt flat, a grid plain).")
by["S15"]["desc"] = (
    "Pull back: his world is one tile in a wall of hundreds of parallel environments of many kinds (valleys, "
    "craters, ice, flats, grids), each with its own orange Clawd, each colouring as it is solved.")
by["S18"]["desc"] = (
    "Breakdown, the pivot, one slow shot. The humans' indigo paper cursor hovers above Clawd, is let go, falls, "
    "and he catches it; it lights orange from inside. He types one line and it splits into ten cursors that "
    "paint the valley stroke by stroke, each typing its own line of code in orange as it goes, and between them "
    "they bring in what he learned in the other worlds (the ice's blues on the far peaks, a salt-pale plain, a "
    "crater's still lake). Then they burn away into light that returns to him. The valley stays as painted.")
by["S20"]["desc"] = (
    "Clawd's cursors repaint the land round the new hill into a folding funnel: the protein's energy landscape as "
    "terrain, spiral terraces sinking to one deep basin. They drop amino acids on the rim, each typing its name "
    "and the real folding code along the chain; a few Clawds help, and the chain folds as it slides down the "
    "funnel into a glowing knot at the bottom. The camera pulls back out through the S08 screen: the night lab, "
    "researcher A leaning in to the knot on the screen.")
by["S36"]["desc"] = (
    "Inside, a polar sea under the aurora, ice floes and a low sun. More Clawds now; their cursors type code "
    "along their beams, hook the sun, pull it down out of the sky and press it into a ring of plasma hovering over "
    "the water; night falls and the aurora flares, its field lines bending into the twelve coils round the ring "
    "(the reactor's core, nothing more). The last frame puts the ring and coils exactly on S21's paper reactor.")
S26 = {"id": "S26", "bars": [70, 70], "section": "build-2", "set": "observatory", "rung": "out", "still": None,
       "desc": ("Outside, one bar: a paper observatory on a ridge above the lit city. Its slit opens on the chops "
                "toward two pinholes, Alpha Centauri A and B, spilling warm light up the haze.")}
by["S27"].update(bars=[71, 72], shift1=-12, desc=(
    "Inside, a crowd of thousands on a night salt flat drawing a space elevator in lines of light: the anchor, "
    "the ribbon tether rising out of the sky with its bracing, the climber with the folded sails, every line, "
    "while their code streams across the flat. The force balance about geostationary orbit is drawn across the "
    "ground in the same light. On the fill, for six frames, only the elevator's lines remain."))
by["S29"].update(shift0=-12, desc=(
    "Opens twelve frames before the drop, on the fill: every line lands on the dark paper space elevator and "
    "burns off. On the bar-73 downbeat the climber launches, a hard acceleration with the camera zooming in on "
    "it, rocketing up the ribbon in a streak of motion blur into space, and flings its payload along a curving "
    "arc. The payload bursts into a fleet of thin sails, a vast tilted sheet seen close and from the side, and "
    "on bar 76 beams rise from below, one for each sail, and the fleet sails off: only sails and beams in view."))

shots = []
for s in d["shots"]:
    if s["id"] == "S27":
        shots.append(S26)
    shots.append(s)
d["shots"] = shots
d["note"] = d["note"].rstrip() + (
    " Revision 11 (09-29): drop 1's many training worlds (S14, S15) integrated in S18; S20 folding funnel; S36 "
    "polar sea and aurora; S26 back at bar 70, S27 71-72 (shift1 -12); S29 shift0 -12, launch on the drop.")
lines = ["{", ' "note": ' + json.dumps(d["note"], ensure_ascii=False) + ",", ' "shots": [']
for i, s in enumerate(shots):
    lines.append("  " + json.dumps(s, ensure_ascii=False) + ("," if i < len(shots) - 1 else ""))
lines += [" ]", "}", ""]
open(P, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
cov = []
for s in shots:
    cov += list(range(s["bars"][0], s["bars"][1] + 1))
assert cov == list(range(1, 92)), "bars not contiguous"
print(len(shots), "shots:", " ".join(s["id"] for s in shots))
