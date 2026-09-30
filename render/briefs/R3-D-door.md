# Revision 3, brief D: the door out (S20)

Read `render/briefs/R3-common.md` first. You own `shots/S20.js`, `sets/paper-lab/*`
(additive only: S08 must render unchanged) and any new `sets/door/`. You may import
`sets/inside-montage/*` (hillx.js, reactor.js) read-only.

## Why

We enter the environments through the lab's computer screen:
- S08, bars 17-20, pushes through the glass;
- S10 opens matched at bar 21.

Nothing ever came back out. In cut 3 the first crossing from inside to outside was
a match dissolve (the reactor drawing into the paper reactor): it said "these look
alike", not "this went from there to here", and no human saw the moment their world
started to change.

Now the camera comes back out through the same glass. Researcher A, who moved the
cursor for Clawd in S08, leans in to see what Clawd drew. The one who helped is now
the one being helped: that is the song's idea in two shots.

## S20: bars 55-56, frames 3899-4042 (144 frames)

The shift1 of -18 is removed, so the shot is 18 frames longer. S21 (the lead's) now
starts on the bar-57 kick (4043) with a hard cut, and its frame 0 is the ignition
flash: see `out/shots/S21.mp4` and `out/shots/S21_sheet.png`. There is no dissolve
between them any more.

The music: sung, no drums, and the bass creeps back in from bar 55.

1. **Drafting (local 0 to ~84).**
   - As in cut 3, four Clawds draft the reactor in lines of light above the
     painted hill: ring (Clawd's happy hop as it closes), coils, column, cap,
     base, ports.
   - Compress the schedule so the drawing is complete by about local 80.
   - The camera may keep its push and crane toward the square-on view: it makes a
     good screen image. It no longer has to land on S21's camera, so choose what
     reads best on a small screen.
2. **The pull-back (~84 to ~112, about 1.5 beats).**
   - The exact reverse of S08's push (`shots/S08.js`: PUSH, TZ, `panFor`;
     `sets/paper-lab/scenes.js`: MON).
   - It starts with the screen's content filling the frame, continuous with the
     inside frames before. Then the bezel slides in from the frame edges and the
     night lab resolves around it.
   - Ease like S08 in reverse: it should feel like the same camera leaving the
     way it came in.
3. **The lab (~112 to 143, at least 1.2 s on screen).**
   - The same night lab as S08: set, moonlight, dust, researchers A and B.
   - The screen shows the painted hill with the reactor drawing. It is brighter
     and warmer than S08's pixel screen, and its light reaches further into the
     room: more warm light in the paper world means more of Claude.
   - A leans in toward the screen: small, slow, careful, with wonder rather than
     alarm. B may turn toward it.
   - Faceless silhouettes; no hand reaching toward the screen; no text.
   - End calm and fairly dark, so the hard cut to S21's flash on the kick is the
     punch.

## Engine

- `sets/paper-lab/paper.js` draws the screen as `kind: 2`, a pixel screen with
  Clawd on a grey horizon.
  - Add, additively, a way to show an external canvas in the screen hole: the
    inside render.
  - MON.hole is 304x194 world px, aspect about 1.57. Render the inside view at
    that aspect or crop it.
  - Add a lean for A to the pose rig in `scenes.js`.
- S08 must be unchanged. Compare stills at frames 1163, 1300, 1440 and 1450
  before and after your engine changes (identical, or within 1 level).
- The inside render needs its own WebGL context (S22 and S25 already run two per
  page). During the pull-back and the lab it can render smaller, since the screen
  is small.
- Page time: the drafting runs at about 0.6 s/frame. Keep the lab beats under
  about 0.8 s.

## Checks

- `python3 render/cuts.py S19 S20 S21`: both are hard cuts. S20's last frame
  should be darker than S21's first.
- Contact sheet with 16 frames.
- Final `out/shots/S20.mp4` plus `_av`; update `sets/paper-lab/NOTES.md`.

Budget: about 150-200 minutes.
