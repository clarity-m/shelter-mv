"""Revision 3 (Claire's notes on cut 3, 2026-09-28): the explore -> create -> affect transition.

- S18: the pivot. The humans' paper cursor is handed to Clawd, who then commands several cursors at
  once to draw the low-poly world into paint, then moves on to his own light.
- S20 -> S21: a door out. S20 ends by pulling back out through the S08 screen into the lab
  (researcher A leans in); S21 hard-cuts on the bar-57 kick (no shift, no dissolve).
- The montage rule: every outside shot is the paper twin of a light drawing just before it, cut on a
  match, accelerating: 2-bar shots in verse 2, 1-bar pairs in build 2, per beat by bar 69.
  S22 lays lines of light along the river -> S23's grid follows them; build 2 becomes
  S25 protein (65) -> S25b vial (66) -> S25c two stars (67) -> S26 observatory (68);
  S27 alternates the rocket drawn in light with the paper rocket per beat (69-70) -> S28.
Backup of cut 3: backups/cut3/code/shots.json.
"""
import json

P = "C:/Users/USER/Projects/shelter-mv/shots.json"
d = json.load(open(P, encoding="utf-8"))
by = {s["id"]: s for s in d["shots"]}

by["S08"]["desc"] = ("The night lab. Clawd glows inside a cut-paper computer screen whose light is the room's light; "
                     "researcher A at the mouse moves the paper cursor beside him while B stands with a mug. In the last "
                     "beats the camera pushes through the glass into his glow.")
by["S18"]["desc"] = ("Breakdown, the pivot, one slow shot. The humans' indigo paper cursor drops in to help, as in S10/S11, "
                     "and is handed to Clawd: it lights orange from inside. He types one line and it splits into several "
                     "cursors that he commands at once; they draw paint strokes across the valley and the facets become "
                     "painted forms (the low-poly to paint transition, drawn stroke by stroke, never a radial wash). Then the "
                     "cursors burn away into light that returns to him, and his own light settles the world into paint at "
                     "dusk, matching S19.")
by["S20"].pop("shift1", None)
by["S20"].update(humans=2, desc=(
    "Inside: Clawds draft a fusion reactor in lines of light above the painted hill. Then the camera pulls back out "
    "through the S08 screen's glass (the reverse of S08's push): the night lab, the drawing glowing on the screen, "
    "researcher A leaning in. Hard cut on the bar-57 kick."))
by["S21"].pop("shift0", None)
by["S21"].pop("xin", None)
by["S21"]["desc"] = ("Hard cut on the single kick of bar 57: the fusion reactor ignites, a ring of fire inside a caged paper "
                     "lantern lighting its punched base and the hall; then it pulses on the beats and breathes with the voice.")
by["S22"]["desc"] = ("Inside: Clawd trots and hops, rerouting a river through his valley; the painted water follows him, and "
                     "lines of light run along its banks and branch off, like a grid being laid. Ends on the river and its "
                     "lines, framed to match S23's paper river and grid.")
by["S23"]["desc"] = ("Outside, the paper twin: a paper skyline at night by a river. A line of warm light runs along the river "
                     "where S22's lines were, reaches the district and branches into it, and the windows warm up. Stars and "
                     "satellites glint. Opens as a match dissolve from S22.")
by["S25"].update(bars=[65, 65], set="protein", rung=4.5, desc=(
    "Build 2, one bar. The crowd of Clawds multiplies on the snare roll, and together they fold an abstract painted "
    "protein: a long ribbon of paint above the hill (coils and sheets) folds into a compact glowing knot while the "
    "strokes start to shrink into motes. Ends with the knot's glow where S25b's vial glows."))
by["S26"].update(bars=[68, 68], desc=(
    "Outside, one bar: a paper observatory on a ridge. Its slit opens in steps on the chops toward the same two "
    "pinholes S25c marked, spilling warm light up the haze."))
by["S27"].update(rung=5, desc=(
    "The rule at its fastest, per beat: the crowd drafts the rocket and its folded sail in lines of light (inside) "
    "against the paper rocket on its gantry in the same framing (outside), the drawing more complete on each inside "
    "beat. Ends on the paper gantry at S28's opening view."))
by["S28"]["desc"] = ("Continues S27's last beat: a launch gantry in layered card; the engines light the tissue beneath it "
                     "orange. On beat 4 of bar 72 the lead and voice cut out under a drum fill: one beat of black before liftoff.")

S25b = {"id": "S25b", "bars": [66, 66], "section": "build-2", "set": "biolab", "rung": "out",
        "desc": ("Outside, one bar: a tray of paper vials under a lab hood. One vellum vial glows where the protein's knot "
                 "was, throwing the other vials' shadows up the hood's back panel (the glowing test tube returns)."),
        "still": None}
S25c = {"id": "S25c", "bars": [67, 67], "section": "build-2", "set": "stars", "rung": 4.5,
        "desc": ("Inside, one bar: the crowd turns to the dusk sky and marks two points of light with beams from their "
                 "glyphs, Alpha Centauri A and B. Ends with the two points where S26's pinholes are."),
        "still": None}
shots = []
for s in d["shots"]:
    shots.append(s)
    if s["id"] == "S25":
        shots += [S25b, S25c]

d["shots"] = shots
d["note"] = d["note"].rstrip() + (" Revision 3 (09-28): S18 hand-off and multi-cursor drawing; S20 ends through the lab "
                                  "screen; the montage pairs every outside shot with a light drawing (S25b, S25c new; "
                                  "S25 and S26 one bar each).")
lines = ["{", ' "note": ' + json.dumps(d["note"], ensure_ascii=False) + ",", ' "shots": [']
for i, s in enumerate(shots):
    lines.append("  " + json.dumps(s, ensure_ascii=False) + ("," if i < len(shots) - 1 else ""))
lines += [" ]", "}", ""]
open(P, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
print(len(shots), "shots")
