"""Revision 5 (Claire's notes on cut 5, 2026-09-28): the main story begins earlier; montage rebalanced.

- The main story begins earlier: S07 (the transformer reprise) is cut; the lab (S08) moves into the
  hook (bars 15-16) and pushes into the screen on the bar-16 drop-out; the first environment (S10)
  begins on the first verse (bars 17-25, three new bars of arrival and exploring up front).
- The human element from the first frame: in S01 the humans' paper cursor unfolds the starburst.
- S18: Clawd's ten cursors type their code in orange as they paint (intentionality); no flattening
  at the end. S19 raises the hill in the painted valley itself (valley engine), continuing S18.
- Montage: S21 (reactor) and S28 (countdown) one bar each; the city (S23, three bars) and the
  medical pair (S25 protein, two bars) take the time.
Backups: backups/cut5/.
"""
import json

P = "C:/Users/USER/Projects/shelter-mv/shots.json"
d = json.load(open(P, encoding="utf-8"))
shots = [s for s in d["shots"] if s["id"] != "S07"]
by = {s["id"]: s for s in shots}

BARS = {"S08": [15, 16], "S10": [17, 25], "S21": [57, 57], "S22": [58, 59], "S23": [60, 62],
        "S25": [65, 66], "S25b": [67, 67], "S25c": [68, 68], "S26": [69, 69], "S27": [70, 71], "S28": [72, 72]}
for k, v in BARS.items():
    by[k]["bars"] = v
by["S08"]["section"] = "hook-1"
by["S01"]["desc"] = ("Bookend: black card; on the first chop note a square hole lights orange from behind. The humans' "
                     "indigo paper cursor comes in and unfolds it: its edges fold back like kirigami under the cursor into "
                     "an eleven-ray starburst that turns and glints.")
by["S08"]["desc"] = ("The night lab, in the hook (bars 15-16): Clawd glows inside a cut-paper computer screen whose light is "
                     "the room's light; researcher A moves the paper cursor beside him, B stands with a mug. On the bar-16 "
                     "drop-out the camera pushes through the glass into his glow.")
by["S10"]["desc"] = ("First environment, pixel, from the first verse (bars 17-25). Clawd arrives out of the screen's light "
                     "and explores the gridworld; then he fails at a gap twice (episode resets). A cut-paper cursor from the "
                     "outside world drops in, adds one line of code, and one block appears: enough to jump on. He jumps "
                     "across and reaches the flag; +1 as the kick drops out at bar 25.")
by["S18"]["desc"] = ("Breakdown, the pivot, one slow shot. The humans' indigo paper cursor hovers above Clawd, is let go, "
                     "falls, and he catches it; it lights orange from inside. He types one line and it splits into ten "
                     "cursors that paint the valley stroke by stroke, each typing its own line of code in orange as it "
                     "goes; then they burn away into light that returns to him. The valley stays as painted.")
by["S19"].update(set="valley-hill", rung=3.5, desc=(
    "Continuing S18 in the painted valley: with his own light Clawd raises the hill from the valley floor under "
    "him, and a tree grows on its shoulder: the hill of the final scene, first made here."))
by["S19"].pop("xin", None)
by["S19"].pop("look", None)
by["S21"]["desc"] = ("Hard cut on the single kick of bar 57: the fusion reactor ignites, a ring of fire inside a caged paper "
                     "lantern lighting its punched base and the hall; one bar.")
by["S23"]["desc"] = ("Outside, the paper twin, three bars: a paper skyline at night by a river. A line of warm light runs "
                     "along the river where S22's lines were, reaches the district and branches into it, and the city "
                     "comes online building by building. Stars and satellites glint. Opens as a match dissolve from S22.")
by["S25"]["desc"] = ("Build 2, two bars. The crowd of Clawds multiplies on the snare roll, and together they fold an abstract "
                     "painted protein: a long ribbon of paint above the hill folds into a compact glowing knot while the "
                     "strokes start to shrink into motes. Ends with the knot's glow where S25b's vial glows.")
by["S28"]["desc"] = ("Continues S27's last beat, one bar: the launch gantry in layered card; the engines light the tissue "
                     "beneath it orange and the arms swing back. On beat 4 of bar 72 the lead and voice cut out under a "
                     "drum fill: one beat of black before liftoff.")
d["shots"] = shots
d["note"] = d["note"].rstrip() + (" Revision 5 (09-28): S07 cut; S08 in the hook (15-16), S10 17-25; S01's cursor; "
                                  "S19 in the valley; S21 and S28 one bar; S23 three bars, S25 two.")
lines = ["{", ' "note": ' + json.dumps(d["note"], ensure_ascii=False) + ",", ' "shots": [']
for i, s in enumerate(shots):
    lines.append("  " + json.dumps(s, ensure_ascii=False) + ("," if i < len(shots) - 1 else ""))
lines += [" ]", "}", ""]
open(P, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
print(len(shots), "shots")
