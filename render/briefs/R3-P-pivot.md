# Revision 3, brief P: the pivot (S18)

Read `render/briefs/R3-common.md` first. You own `sets/valley/*`, `shots/S17.js`,
`shots/S18.js`, and `shots/S19.js` (optional touch and re-render only).

## S18: bars 49-52, frames 3467-3754 (288 frames), the breakdown

The music: drums and bass are out. There are four sung phrases, with onsets at
3486, 3561, 3618 and 3655 (local 19, 94, 151, 188) from `T.events('sung')`, as
the current code finds them. This is the film's midpoint and the turn from
learning to making.

**Keep:**
- the first frame (the S17 → S18 cut is 0.4);
- the camera idea (breakdownCam, from above his shoulder down to S19's level);
- the settle into S19's opening frame.

S19 dissolves out of S18's last frame (xin 8), so keep that frame unchanged, or
re-render S19 afterwards (`node render/render.mjs S19`; S19.js needs no change for
that).

**Replace:**
- Clawd summoning his own cursor out of his glow. That reads as copying the tool,
  with nothing passing between him and the humans.
- The stamps washing green paint radially outward from his feet. That repeats drop
  1's learned ground, and it is Claire's main note on this shot.

**Suggested choreography (refine it, but keep the beats and their order):**
1. **Phrase 1 (local ~19-94): the hand-off.**
   - The humans' indigo paper cursor drops in from the top of frame, the way it
     did in S10 and S11 (S10 and S11 use `sets/early-env/papercursor.js`;
     `sets/valley/papercursor.js` is your copy with colour options).
   - It heads for the ground in front of him as if to fix something for him, as
     it always has.
   - He looks up at it. It stops, then turns and offers itself: it dips toward
     him.
   - He takes it, with a small hop up to touch it. The card lights orange from
     inside: warm light through the indigo paper, which is the outside world's
     sign for Claude's light, ending in his orange card (HIS).
   - Land the moment it lights on a clear musical point. No hands anywhere.
2. **Near phrase 2 (local ~94): one line, many cursors.**
   - He uses it once, the way they did: one short line in his panel (plausible,
     lowercase, a few words, calling for several cursors).
   - On Enter it splits into several orange cursors (6-10) that fan out across
     the valley.
3. **Phrases 2-3 (local ~94-188): he commands them at once.**
   - His poses: looking around, arms up, a hop on the phrase onsets.
   - Each cursor drags a long stroke across the ground, and behind it the
     low-poly facets turn into painted forms along the stroke's band. This is
     brushwork: long, directional, overlapping strokes in the rung-4 palette.
   - The facets relax into smooth paint where the strokes pass (the `smooth`
     transition, done locally by the strokes).
   - There are more strokes on each phrase, reaching the horizon by about phrase
     4, and the rest of the world follows as the strokes cover it.
4. **Phrase 4 (local ~188): into light.**
   - The cursors burn away into motes of warm light that stream back into him,
     and he glows.
   - One soft pulse of his own light finishes the smoothing. This light is his
     tool from now on: S20's drawings are made of it.
   - Then the existing settle to S19's floor at dusk.

## Engine

The valley's paint mask is radial (`learn` spawn/touch). Add stroke-shaped paint
additively, for example:
- a few polylines with width and progress as uniforms;
- or a stroke mask texture computed deterministically per frame.

S13-S17 must render unchanged; spot-check stills.

The cursors are 2D paper sprites drawn at projected ground positions, as the
current S18 draws its cursor. Keep them readable at their distance (scale with
depth, minimum size), and keep the eye on Clawd between their moves.

## Optional, only when S18 is final

In S19 (sets/hill, finished; `shots/S19.js` is yours for this):
- Clawd's raising of the hill shows his light, as a warm flare from him as the
  floor swells.
- Re-render S19 and its `_av` if you touch it.

## Checks

- `python3 render/cuts.py S17 S18 S19`: S17 → S18 continuity must stay near 0.4,
  and S18 → S19 is a dissolve.
- `python3 render/sheet.py out/shots/S18.mp4 16 4`.
- Final `out/shots/S18.mp4` plus `_av`; update `sets/valley/NOTES.md`.

Budget: about 150-200 minutes.
