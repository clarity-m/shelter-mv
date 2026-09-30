"""Revision 1 (Claire's review of the first cut, 2026-09-28): restructure shots.json.

- cut S09 (hands) and S17's harness of worlds: the hand motif is dropped
- S10 pixel gridworld now bars 21-26, S11 physics now bars 27-30 (more time, more lingering)
- S17 becomes a dive back into Clawd's own world (bars 47-48), leading into S18
- S20 becomes the reactor blueprint (Clawds draft the torus in light), replacing the biolab
"""
import json

P = "C:/Users/USER/Projects/shelter-mv/shots.json"
d = json.load(open(P, encoding="utf-8"))
shots = [s for s in d["shots"] if s["id"] != "S09"]
by = {s["id"]: s for s in shots}

by["S08"]["desc"] = ("The night lab. Two faceless silhouettes build the harness on the bench; Clawd's light throws the "
                     "ribs across the wall. In the last beats the camera pushes into his glow until warm light fills the frame.")
by["S10"].update(bars=[21, 26], section="verse-1",
                 desc="First environment, pixel. Clawd fails at a gap twice (episode resets). A cut-paper cursor from the "
                      "outside world drops in, adds one line of code, and one block appears: enough to jump on. He jumps "
                      "across and reaches the flag. Linger.")
by["S11"].update(bars=[27, 30],
                 desc="Vector physics. Clawd slides back down a ramp; the paper cursor drags the ramp's handle and eases "
                      "it; he makes it on the bar-29 snare. Then environments flick past on the snare, lingering, each more saturated.")
by["S17"].update(set="valley-dive", rung=3,
                 desc="Back into one world: the camera dives from the wall of worlds into Clawd's own tile and down to the "
                      "valley at dusk, where he stands alone. Hands off to the breakdown.")
by["S18"]["desc"] = ("Breakdown, one slow shot. Clawd visibly changes his own world: he stamps, a pulse rings out from his "
                     "feet and paint washes outward from it; facets relax into smooth painted forms. Ends in paint, matching S19.")
by["S20"].update(set="reactor-blueprint", rung=4.5,
                 desc="Inside: Clawds draft a fusion reactor in lines of light, a torus and its coils drawn edge by edge "
                      "above the painted hill. Ends framed exactly where S21's paper reactor stands, for a match dissolve.")
by["S22"]["desc"] = ("Inside: Clawd trots and hops, rerouting a river through his valley; the painted water follows him. "
                     "Ends on the river framed to match S23's paper river.")
by["S23"]["desc"] = ("A paper skyline at night by a river; one district's windows warm up block by block. Stars and a "
                     "satellite glint in the sky. Opens as a match dissolve from S22's painted river.")
by["S31"]["desc"] = ("The final environment: the hill, the tree, a faceless figure by the tree with Clawd beside her; Clawd's "
                     "eyes move, she leans back slightly; kites and a few distant people on the far slopes. Behind: slender "
                     "lit towers under a ring. Slow crane up; kicks pulse the city lights.")
by["S32"]["desc"] = ("One unbroken pull-back on the held note: out of the shelter's light, through the bubble wall, out of a "
                     "slowly turning paper wheel habitat that hosts it, past countless glittering nodes like it, until the "
                     "whole swarm hangs in the dark around Alpha Centauri B: a lantern made of millions of collectors.")
by["S01"]["desc"] = ("Bookend: black card; on the first chop note a square hole lights orange from behind and its edges fold "
                     "back like kirigami into an eleven-ray starburst that turns and glints.")
by["S02"]["desc"] = "The spinning, glinting burst folds down into the pixel Clawd shape (a Clawd-shaped cut); light pours through; we fly through it."

d["shots"] = shots
d["note"] = d["note"].rstrip() + " Revision 1 (09-28): S09 cut (hand motif dropped); S10/S11 re-timed; S17 and S20 re-purposed."
lines = ["{", ' "note": ' + json.dumps(d["note"], ensure_ascii=False) + ",", ' "shots": [']
for i, s in enumerate(shots):
    lines.append("  " + json.dumps(s, ensure_ascii=False) + ("," if i < len(shots) - 1 else ""))
lines += [" ]", "}", ""]
open(P, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
print(len(shots), "shots")
