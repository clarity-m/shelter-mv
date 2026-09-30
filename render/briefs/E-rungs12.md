# Brief E: the first environments (rungs 1 and 2), shots S10, S11, S12

Read `render/GUIDE.md` first, then the TREATMENT.md sections for your shots and
`analysis/STRUCTURE.md`. The worked example is `shots/S21.js`.

## Your sets

These are the first training environments: pixel (rung 1), then vector (rung 2).
Build `sets/gridworld/` and `sets/physics/`, or one `sets/early-env/`.

Sources:
- `style-frames/09-style-pixel/`: pixel craft. The inside worlds are desaturated
  gray rather than its night blues. It is authored at 480x270 native with a
  palette index, scaled 4x nearest-neighbour, with dither only at ramp changes.
- `style-frames/10-world-ladder/` rung 1 and rung 2: the pixel and vector lenses of
  the inside world.
- `style-frames/05-clawd-sprites/`: sprite sheet, walk, hop, look-up and other
  cycles, emotes, and the ladder forms `clawd-sprites.js`. Clawd's pixel form
  (rung 1) and vector form (rung 2) come from here.
- `style-frames/07-style-ligne-claire/`: the flat-vector craft.

Colour is capability: these worlds are gray, Clawd is the only saturated thing,
and colour starts to leak in at the end of S11. A small monospace HUD (episode,
step) is fine inside.

## Shots

**S10:** bars 25-28, frames 1739-2026, 9.6 s. Pre-chorus 1a: the kick drops out and
a low-register voice sings. It is the first environment, a pixel gridworld. The
film hard-cuts in from S09, which ends with the whole frame filled with Clawd's
warm glow, so open on a brief warm afterglow fading into the gray world within
half a beat. Clawd reaches a gap he can't cross. He tries twice; each failure
resets the episode, and the HUD counter ticks. Then a bridge of tiles slides in
from off-screen. This is the researchers' help, shown only as a small edit to his
world; no humans appear. He crosses.

**S11:** bars 29-30, frames 2027-2170, 4.8 s. The snare returns. It is a vector
physics environment. Clawd slides back down a slope, the slope eases a few
degrees, and he makes it. Then environments flick past on the snare hits
(T.events('snares')), each a little more saturated than the last.

**S12:** bars 31-32, frames 2171-2314, 4.8 s. The drums cut out from the end of
bar 30 until a fill in the second half of bar 32. Clawd stands alone in a flat
white field and looks up. The plane tilts until it has a vanishing point,
anticipating 3D. The fill carries us into the drop. The next shot (S13, another
agent) opens on the bar-33 downbeat with Clawd's glyph extruding into a solid in
a low-poly valley, so end on a composition that hands off to it: Clawd centred,
the ground plane in perspective.

## Deliverables

- the shots, the sets, and `out/shots/<ID>.mp4` plus `_av.mp4` for each, with
  contact sheets;
- a NOTES.md in your set folder, updated as you go;
- a final reply of 5-8 sentences.

Budget: about 60-120 minutes. Other agents work in parallel; the ownership rules
are in the GUIDE.
