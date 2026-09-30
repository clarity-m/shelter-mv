# Revision 11: brief (Claire's notes on cut 10). Everyone reads all of it.

The earlier briefs (R10, R9, R8, R3) and `render/GUIDE.md` still apply. `shots.json` has 31 shots
(`render/revise11_shots.py`): S26 is back at bar 70, S27 is 71-72 with `shift1: -12`, and S29 has
`shift0: -12`. Claire's stills are in `out/stills/ref_R11/`. Cut 10 is in `backups/cut10/`.

HARD RULE: never write or quote the song's lyrics anywhere (replies, code, comments, file names,
notes). An API content filter kills any output that contains them.

## Claire's notes on cut 10

1. **The fleet** (`claire_voyage_fleet.png`, `claire_S29_fleet.png`): "refine geometry of the sail fleet
   (maybe a closer shot, too, so it looks more expansive?)". Right now it reads as a rigid grid of
   tiles, like a solar-panel array.
2. **The elevator:** "the motion of the space elevator is a great drop! Move it back a beat (shorten
   the frame with the white outline on black?), and the acceleration + zoom in can be more dramatic."
3. **S27:** "the force diagram spanning the ground is very pretty; instead of jumping between
   observatory and blueprint, the scenes can just go one after the other. Otherwise, the S27-end
   sequence is near finalized."
4. **Drop 1:** "S13-15 runs slowly; it can also be used to introduce different low-poly environments
   after the first is learned. Then, when Clawd gets their cursor, they can integrate the different
   environments they've been in."
5. "Since S34 has their own environment, S20 and S36 should as well." The lead's proposal, below:
   - S20: a folding funnel;
   - S36: a polar sea under the aurora.

## The thread this makes

Drop 1's training worlds are early grey versions of the worlds Clawd will later build:
- a funnel crater, which becomes S20's folding funnel;
- a grid plain, which becomes S34's wafer land;
- an icy shore, which becomes S36's polar sea;
- a salt flat, which becomes S27's.

At the pivot (S18) Clawd's ten cursors bring their traits into the painted valley. Each breakthrough
after that grows one of them into a full world. Clawd makes new things from what it learned.

## New timings

| Shot | Bars | Frames | Notes |
|---|---|---|---|
| S26 | 70 | 4979-5050 | the observatory, back as its own shot (O's `S26.js`) |
| S27 | 71-72 | 5051-5182 | the blueprint alone; its last 6 frames (5177-5182) are the lines alone |
| S29 | 73-76 | 5183-5482 | lands at 5183, in the fill; the climber launches on the drop at 5195 (local 12) |

## Per agent

### P: S14, S15, S18
1. **S14 (bars 37-40):**
   - Bar 37 learns the valley as now.
   - The stutter-stops (37.4, 38.4, 40.4) then each reset the episode into a new low-poly world,
     grey CG until Clawd runs it and it paints as learned:
     - a funnel crater (spiral terraces down to a basin);
     - an icy shore (floes, snowy bluff);
     - a salt flat (polygon cracks) or a grid plain.
   - Same engine, same rules (Clawd never enlarged); pick two or three that read in a bar each.
   - This also answers "runs slowly": the section now moves through worlds.
2. **S15 (bars 41-44):** the wall of worlds shows many kinds of tile (valleys, craters, ice, flats,
   grids), each with its Clawd, each colouring as solved.
3. **S18:**
   - Keep everything she loved: the catch, the ten cursors, the code, the burn into light.
   - While they paint, the cursors bring in the other worlds' traits: the ice's blues on the far
     peaks, a salt-pale plain, a crater's still lake.
   - The valley becomes a composite of what Clawd learned. It stays the painted valley she picked,
     only richer.
   - The last frame (S19's opening) must stay as it is, or re-render S19 and tell the lead; S20
     dissolves from S19.
4. S13, S16 and S17 are unchanged.

### D: S20, S36, the voyage cameras
1. **S20:**
   - Open on S19's view (the xin 8 dissolve is unchanged). Clawd's cursors repaint the land around
     the new hill into a **folding funnel**: the protein's energy landscape as real terrain, painted
     spiral terraces sinking to one deep basin.
   - The amino acids drop on the rim. The names and the real folding code run along the chain, as
     now.
   - The chain folds as it slides down the funnel, and the knot glows at the bottom.
   - The pull-back through the lab screen and the lab stay.
2. **S36:**
   - A **polar sea under the aurora**: ice floes, a snowy bluff in place of the green one, a low
     polar sun, and aurora curtains in the painted look (teal, green, violet).
   - Clawd takes the sun as now. As night falls the aurora flares, and its field lines bend into
     the twelve coils round the ring: plasma held by magnetic fields, the thing a tokamak imitates.
   - The coils end in the same warm light and land exactly on S21 (unchanged last frame).
3. **The voyage:** once O publishes the refined fleet in `fleet3d.js`, bring the cameras closer so
   the fleet reads as vast: near sails large and partly out of frame, the formation receding. Re-run
   the voyage preview; the lead re-renders S30.

### I: S27
- It's now bars 71-72 only (132 frames), the blueprint alone: the crowd, the drawing, the code
  streams and the force diagram Claire loves. The observatory beats move out to S26.
- The lines alone are the last 6 frames, 5177-5182.
- The S29 match stays; S29's first frame is now 5183.

### O: S26, S29, `fleet3d.js`
1. **S26:** it plays again as its own shot at bar 70 (4979-5050). Check its standalone render, and
   keep the lit city in its valley.
2. **The fleet (`fleet3d.js`), first:** refine the geometry and publish it early for D.
   - Each sail is a thin square light sail with its X of booms, a slight billow, a translucent
     membrane, and a glow gradient when lit.
   - The formation is a gently curved sheet with staggered rows, slight variations in spacing and
     turn, and depth.
   - It should read as a flock of sails, not tiles.
3. **S29:**
   - Open at 5183 (local 0) in the fill with the landing: the lines land and burn off before the
     drop.
   - On the downbeat (local 12, frame 5195) the climber launches: a hard, dramatic acceleration
     with the camera zooming in on it, then the motion-blurred climb.
   - Re-key the later beats to the bars as before: the fling on 74.4, the burst on 75, the beams on
     76.
   - The fleet frames are closer, among the sails, so the formation is expansive. Only sails and
     beams are in view.

## Budget and deliverables

About 1-1.5 hours; four agents share the GPU. As before: final clips, `_av` versions, sheets, NOTES,
a 5-8 sentence final reply, and never routing around a denied command.
