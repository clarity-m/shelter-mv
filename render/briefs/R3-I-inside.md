# Revision 3, brief I: the inside twins (S22, S25, S25c)

Read `render/briefs/R3-common.md` first. You own `sets/inside-montage/*`,
`shots/S22.js`, `shots/S25.js` and `shots/S25c.js` (new).

Your shots are the light drawings whose paper twins follow them.
- The match targets are in `sets/paper-kit/MATCH.md`, which agent O publishes early
  in the session. Build the mechanics first, then align your last frames to it.
- If MATCH.md is late, use the current outside shots as provisional targets:
  - S23's river band is at y 728-960;
  - `sets/paper-kit/biolab.js` LAB has the glowing vial at x ≈ 1022, y 452-752;
  - `sets/paper-kit/observatory.js` OBS.stars.
- The previous versions of your shots are in `backups/cut3/code/shots/`, and
  `sets/inside-montage/NOTES.md` documents the fork's options (`crowd`,
  `strokeLift`, `river`, `lines`, `dim`).

## S22: bars 59-60, frames 4187-4330 (unchanged timing)

Keep Clawd's trot, glances and hops and the river following him; Claire likes them.

Add lines of light:
- they run along the river's banks as the water follows him, and branch off it in
  a few clean lines, like a grid being laid;
- they are the same light as S20's drawing (the `lines` option: warm, blooming);
- they grow with the water, a beat or so behind it.

The last frame puts the river band and the lines exactly where MATCH.md puts S23's
grid line and district branches: S23 opens with a 12-frame match dissolve from it.
The world may dim a little toward night over the last beats, so the dissolve into
S23's night reads.

## S25: bar 65 only, frames 4619-4690 (72 frames; it was 2 bars)

The music is the build's first bar: the chop lead returns over hats and a snare
roll.
- **The crowd.** The crowd multiplies on the snares: cut 3's S25 mechanic,
  compressed, from Clawd and a few to dozens, and nobody bigger than Clawd.
- **The protein (Claire's idea).** Together they fold an abstract painted protein
  above the hill.
  - It is a long ribbon of luminous paint with coils like helices and broad flat
    arrows like sheets. Keep it abstract: not a textbook diagram, no labels.
  - It starts extended and folds, in two or three eased steps on the chops or
    snares, into a compact glowing knot.
  - The Clawds' beams run from their glyphs to the ribbon, as in S20.
- **The ladder.** The painted strokes begin to shrink into motes (rung 4 to 5
  starts here).
- **The last beat.** The world dims toward night around the knot, as S20's end
  dimmed. The knot's glow sits where S25b's vial glows (MATCH.md), with a roughly
  similar silhouette if you can (a compact upright glow), for a hard cut on the
  match.

## S25c: bar 67 only, frames 4763-4834 (72 frames, new shot)

- **Staging.** The crowd, now many, stands on the hill and turns to the sky.
  - Beams rise from their glyphs and mark two points of light close together low
    in the sky: Alpha Centauri A, the brighter, and B.
  - Optionally, one thin arc of light is drawn from the hill toward them.
- **The sky.** It dims as the points brighten, so the last frame reads as two
  bright points on a dark sky, exactly where S26's two pinholes are (MATCH.md).
  S26 hard-cuts in on the match.
- **The music.** Build 2 has chops and a snare roll; land the two points on
  chops.

## Engine

- `hillx.js` and `glslx.js` are yours, but S20, S27 (now agent O's, read-only),
  S30 and S32 import them.
  - Keep the defaults and existing options unchanged, and add new ones
    additively.
  - Spot-check S30 and S20 stills if you touch shared paths.
- A painted ribbon may need a new primitive, for example a stroke-textured
  ribbon or thick paint `lines`. Your call.

## Checks

- `python3 render/cuts.py S21 S22 S23 S24 S25 S25b S25c S26`, once O's clips
  exist. S22 → S23 is a dissolve; the others are hard cuts on matches.
- Contact sheets; final clips plus `_av`; update `sets/inside-montage/NOTES.md`.

Order: S22, S25, then S25c. Budget: about 180-240 minutes.
