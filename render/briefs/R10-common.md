# Revision 10: brief (Claire's notes on cut 9, the artistic refinement pass). Everyone reads all of it.

`R9-common.md`, `R8-common.md` and `R3-common.md` still apply (rules, landings, ownership,
permissions, working method), and so does `render/GUIDE.md`. The bars are unchanged; `shots.json`
has the new descriptions (`render/revise10_shots.py`). Claire's reference stills are in
`out/stills/ref_R10/`.

HARD RULE: never write or quote the song's lyrics anywhere (replies, code, comments, file names,
notes). An API content filter kills any output that contains them.

## Claire's notes on cut 9

"I think the scale is really felt now! The 10th revision can be artistic refinement." Then:

1. **S34** (`claire_S34_card_vertical.png`): "rather than vertically, the chips can be drawn on the
   ground! then zooming and panning outward for the data center shot."
   - Colour inspiration for the world: `claire_S34_color_die.png`, a die shot (blocks of orange
     arrays, teal caches, rose logic, gold lines, a violet border), and `claire_S34_color_wafer.png`
     (a wafer of iridescent dies in teal, rose, gold and violet).
2. **S29** (`claire_S29_elevator.png`): the space elevator is "a great opportunity to add some
   dramatic motion blur ... as it rockets into space and ejects its payload (artistic license)".
3. **S27:** "instead of the zoom at the Clawd blueprint construction, [it] can be replaced with some
   physics stress/strain analysis." This is the tilt up the tether.
4. **S29's fleet** (`claire_S29_fleet_crowded.png`): "though the imagery of the fleet unfolding is
   effective, the scene is crowded; construct the scene so it's the solar sails and beams alone,
   better off without the planet or satellites in view."
5. **S30** (`claire_S30_earth_cut.png`, `claire_S30_jupiter_cut.png`): cut these planet-facing
   beats.
6. **Code everywhere:** "the code does fill the screen, but it can be broken up into lines,
   scrolling horizontally instead of vertically; right now it feels layered on instead of part of
   the world. Consider other ways to integrate code into the environment."
7. **S20:** "the protein folding scene is so cool; could some of the code for that be added to
   Clawd's cursors there?"
8. "Think about other changes you can make in this pass too."

## The code principle (everyone)

Code is part of the world, never a panel pasted over the frame.
- It runs in lines along surfaces and paths that exist in the scene, in perspective and occluded
  like everything else, scrolling horizontally along them: the ground, a trace, a chain, a
  tether, the sea, the ring.
- It rhymes with S03, where Clawd first stood on a single line of tokens streaming to the
  horizon. Now its own code streams through the worlds it builds.
- It's real code from this film, orange monospace as before, legible in a still, and
  lower-contrast than the thing being made, so it supports the image instead of competing with
  it.

## Per agent

### P: S34 (bars 58-60)
Keep the benchmark structure and timing, exactly as in R9: the world's last strokes landing, the
code, the seed at 72, the design on the 59 downbeat, Clawd's hop, and on 60 the crowd's rows.
1. **The world:** the land takes the die-shot palette: iridescent blocks of teal, rose, gold,
   orange and violet in the painted look. It's a land that is itself a chip layout, still S18's
   brushwork over low-poly. Keep the sky gentle, so the ground carries the colour.
2. **The chip is drawn flat on the ground,** not standing. From the seed its blocks and traces
   spread out across the land in lines of light. The code runs along the traces (the principle
   above), and the dozen Clawds lay out more chips in rows, a wafer to the horizon, the light
   racing along each row.
3. **The last frame:** the camera looks down steeply enough that one chip on the ground lands
   exactly on S35's paper chip. O publishes it in MATCH.md first; agree the angle with O.

### O: MATCH, S35, S29
1. **MATCH.md first (about 30 minutes):** S35's opening. It's close on a paper chip on its card,
   seen from above or steeply, whichever the paper kit does best. Publish the chip's outline at
   4331, plus stills, for P.
2. **S35 (bar 61):**
   - Keep the gentle landing: the chip's outline, only the chip, lands and burns off.
   - Then the camera zooms and pans outward: the chip, its card, the rack, the aisle, the whole
     hall under the arches. The racks come online bay by bay as they enter the frame, and the
     vault warms.
   - It's Claire's "zooming and panning outward for the data center shot": one continuous
     pull-out in a single bar.
3. **S29 (bars 73-76):**
   - Keep the landing at 73.
   - The climber rockets up the ribbon with dramatic motion blur: streaks along the tether,
     stretched light, stars smearing as the camera races with it out of the sky into space.
   - At the top it flings its payload free (artistic license). The payload bursts into the fleet
     of folded sails, which unfurl as an array against black space.
   - On 76 a forest of beams rises from below, out of frame, one for each sail, and the fleet
     sails off.
   - **Only sails and beams in the fleet's frames:** no Earth, no satellite ring, no station.
   - One orange for the fleet, shared with D's voyage (agree it in MATCH.md).

### D: S20, S36, the voyage
1. **S20:**
   - Claire loves the fold. Add the real code of `sets/inside-montage/protein.js` (the
     conformations, `blendConf`, `chainPoints`, the fold's steps) to the cursors, beside the
     amino acid names.
   - Better still, let it run along the chain's path as the chain links, so the chain is written.
   - It must stay legible and gentle.
2. **S36:**
   - Put its code in the world, for example along the beams to the sun or across the water.
   - Ease the cut in from S35's warm hall: S36's first half-beat can open a little dimmer and
     warmer and come up to the sunset (S35 → S36 is 102.9 now).
   - The last frame stays exact.
3. **The voyage (`sets/voyage/`):**
   - Cut the Earth and planet-facing views (Earth, Jupiter, and Saturn too, for the same reason).
   - S30 now alternates two beats at a time (see I), so the voyage is three calm views of 36
     frames each: `voyageFrame(view 0-2, t 0-35)`:
     - (0) looking back past the hero sail at the Sun and its orbits, small;
     - (1) the Sun one star among many, the dark between. The stars can stretch into streaks as
       the fleet accelerates (a gentle, hard-SF nod to how fast it's going);
     - (2) the two stars ahead, A and B, with the fleet heading in.
   - Sails and beams, the Sun and stars; no planets.

### I: S27, S30
1. **S27:**
   - Replace the tilt up the tether (71.3-71.4) with a physics stress and strain analysis of it,
     drawn in the same light while the crowd works:
     - a strain map running up the ribbon (cool at the anchor, hot where the tension peaks);
     - force arrows (the pull down below the peak, the fling up above it);
     - a small load curve or mode shape drawn beside it.
   - Keep the camera level or nearly.
   - The code wall becomes horizontal lines streaming across the salt flat in perspective (the
     S03 rhyme), under and between the crowd, running toward the anchor; the lines are
     `elevatorlines.js`.
   - Keep the observatory beats, the lines-alone beat and the S29 match.
2. **S30:**
   - New rhythm: in bars 77-79 each bar is two beats inside (the build), then two beats outside
     (D's voyage view 0, 1, 2 in turn: local frames 36-71, 108-143, 180-215). Bar 80 is inside,
     landing on S31 exactly as now.
   - The code torrent becomes horizontal lines living in the world: along the ground around the
     hill, or scrolling along the habitat's ring arc in the sky, flowing into the towers. The
     lines are the shelter's real code.

## Budget and deliverables

About 1-1.5 hours; four agents share the GPU. As before: final clips, `_av` versions, sheets,
NOTES, a 5-8 sentence final reply, and never routing around a denied command.
