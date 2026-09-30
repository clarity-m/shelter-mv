"""Revision 8 (Claire's notes on cut 7, 2026-09-29): S18-S28 re-cut as four landings of rising fidelity.

- Each breakthrough is one tech: Clawd makes it in light, in a world made for it; then a hard cut
  lands the light on its paper twin on a downbeat (S21's device). What lands grows each time:
  the protein's glow into the vial (57), the plant's outline on the greenhouse's plants (61),
  the reactor's core (ring and coils) on the reactor (65), every line of the rocket at liftoff (73).
- The city has no drawing: it comes online after the three techs, from the reactor's light (66-68).
- The rocket is revealed only at liftoff: the crowd draws it, intercut with the observatory; on
  bar 72's last beat only its lines remain, and on the drop they land on it.
- Cut: S22 (river), S24 (town of light), S25 (the crowd's proteins), S26 (as its own shot; its
  observatory plays inside S27), S28 (the countdown; the ignition moves into S29's first frames).
- New: S34 (a plant designed in light), S35 (the paper greenhouse), S36 (the sun made into a ring).
Backups: backups/cut7/.
"""
import json

P = "C:/Users/USER/Projects/shelter-mv/shots.json"
d = json.load(open(P, encoding="utf-8"))
old = {s["id"]: s for s in d["shots"]}
CUT = {"S22", "S24", "S25", "S26", "S28"}

S20 = dict(old["S20"], bars=[54, 56], set="protein-lab", desc=(
    "Opens on S19's own view (a short dissolve). Clawd's orange cursors drop amino acids over the new hill, each "
    "typing its name in orange code; they link into a chain, and a few Clawds pop out of Clawd's light to help fold "
    "it into a glowing knot. The camera pulls back out through the S08 screen: the night lab, researcher A leaning "
    "in to the knot on the screen. The humans take it from here."))
S25b = dict(old["S25b"], bars=[57, 57], section="verse-2b", desc=(
    "Outside, hard cut on the single kick of bar 57: a tray of paper vials under a lab hood. The knot's light "
    "arrives over one vial and pours into it (a glow, not an outline: the medicine is the humans' work) and the "
    "vial blazes, then the vials beside it light one after another, throwing their shadows up the hood's back panel."))
S34 = {"id": "S34", "bars": [58, 60], "section": "verse-2b", "set": "fields", "rung": 4, "look": "painted-valley",
       "still": None, "desc": (
    "Inside, a world Clawd paints for growing things: fields in golden light, the last strokes landing as we "
    "arrive. The cursors type a short line of orange code; a seed of light goes into the soil and a plant grows "
    "from it in lines of light, stem, leaves and a grain head. The crowd, a dozen now, plants it in rows along the "
    "fields. Ends with one plant in the foreground exactly where S35's paper plant stands.")}
S35 = {"id": "S35", "bars": [61, 61], "section": "verse-2b", "set": "greenhouse", "rung": "out", "still": None,
       "desc": (
    "Outside, one bar: a paper greenhouse at night, arched ribs and vellum panels over rows of paper plants. On the "
    "downbeat the plant's outline lands on the nearest paper plant (only the plant: the greenhouse is the humans') "
    "and burns off, and the grow lights come on row by row, warm through the panels.")}
S36 = {"id": "S36", "bars": [62, 64], "section": "verse-2b", "set": "sun-ring", "rung": 4.5, "look": "painted-valley",
       "still": None, "desc": (
    "Inside, a world by the sea at sunset. Clawd's cursors type orange code and hook the low sun with beams, pull it "
    "down out of the sky and press it into a ring of plasma hovering over the water; the sky drains to night, and "
    "twelve coils of light close round the ring (the reactor's core, nothing more). The bass returns under it; the "
    "last frame puts the ring and coils exactly on S21's paper reactor. Hard cut on the bar-65 kick.")}
S21 = dict(old["S21"], bars=[65, 65], section="build-2", desc=(
    "Outside, hard cut on the kick of bar 65, where build 2 begins: the core's outline (the ring and its coils, "
    "only) lands on the paper reactor and burns into the ignition; the rest of the machine is paper, built by "
    "people. The plasma pulses with the snare roll; one bar."))
S23 = dict(old["S23"], bars=[66, 68], section="build-2", desc=(
    "Outside, three bars: a dark paper city by a river at night, the reactor glowing far off on the bank. Its light "
    "runs along the river into the city, and the city comes online building by building on the snare roll. Nothing "
    "here was drawn by Clawd: the city is what the three breakthroughs add up to. Stars and satellites glint."))
S23.pop("xin", None)
S25c = dict(old["S25c"], bars=[69, 69], desc=(
    "Inside, one bar: a world at night made for looking up. On the kick the crowd, many now, turns to the sky and "
    "marks two points of light with beams from their glyphs, Alpha Centauri A and B. Ends with the two points "
    "where the observatory's pinholes are (S27's first beat)."))
S27 = dict(old["S27"], bars=[70, 72], section="build-2", set="blueprint", desc=(
    "Intercut, two beats at a time: the paper observatory turning its slit toward the two pinholes (outside; it "
    "opens on the match from S25c) and the crowd drawing the rocket in lines of light on the same night world "
    "(inside): every line of it, body, boosters, engines, fins, fairing and the sail folded inside. The drums drop "
    "out and the drawing completes; on the bar's last beat the world goes dark and only the lines remain, where "
    "the paper rocket will stand. No paper rocket before the drop."))
S29 = dict(old["S29"], desc=(
    "Liftoff on the bar 73 downbeat: the dark paper rocket appears under the drawing's lines, every line lands on "
    "it (the whole blueprint, this time) and the engines ignite in the same instant, the lines burning off into "
    "the exhaust. It climbs on a column of glowing tissue. Its payload unfurls a square vellum sail that catches "
    "an orange beam from the ground and sails off, leaving the Sun behind among pinhole stars."))

NEW = {"S20": S20, "S25b": S25b, "S21": S21, "S23": S23, "S25c": S25c, "S27": S27, "S29": S29}
ORDER_MID = ["S20", "S25b", "S34", "S35", "S36", "S21", "S23", "S25c", "S27", "S29"]
MADE = {"S34": S34, "S35": S35, "S36": S36}

shots = []
for s in d["shots"]:
    sid = s["id"]
    if sid in CUT:
        continue
    if sid == "S20":
        for m in ORDER_MID:
            shots.append(NEW.get(m) or MADE[m])
        continue
    if sid in ORDER_MID:
        continue
    shots.append(s)

d["shots"] = shots
d["note"] = d["note"].rstrip() + (
    " Revision 8 (09-29): four landings of rising fidelity (vial 57, greenhouse 61, reactor 65, rocket 73); the city "
    "follows the three techs (66-68); S22, S24, S25, S26, S28 cut; S34, S35, S36 new; S27 intercuts the observatory.")
lines = ["{", ' "note": ' + json.dumps(d["note"], ensure_ascii=False) + ",", ' "shots": [']
for i, s in enumerate(shots):
    lines.append("  " + json.dumps(s, ensure_ascii=False) + ("," if i < len(shots) - 1 else ""))
lines += [" ]", "}", ""]
open(P, "w", encoding="utf-8", newline="\n").write("\n".join(lines))

# contiguity check: every bar 1-91 covered exactly once
cov = []
for s in shots:
    cov += list(range(s["bars"][0], s["bars"][1] + 1))
assert cov == list(range(1, 92)), "bars not contiguous"
print(len(shots), "shots:", " ".join(s["id"] for s in shots))
