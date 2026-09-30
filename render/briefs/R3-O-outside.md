# Revision 3, brief O: the paper twins (MATCH.md, S23, S25b, S26, S27)

Read `render/briefs/R3-common.md` first. You own:
- `sets/paper-kit/*` (sail.js and launch.js stay behaviour-compatible for S28-S30);
- `shots/S23.js`, `shots/S25b.js` (new), `shots/S26.js`, `shots/S27.js` (re-purposed);
- `sets/paper-kit/MATCH.md`.

You may import `sets/inside-montage/*` (hillx.js, crowd.js) and `sets/hill/*`
read-only for S27's inside beats. S28's code stays as it is: its first frame is the
target for S27's last beat.

The previous versions are in `backups/cut3/code/shots/`, and
`sets/paper-kit/NOTES.md` documents the kit.

## First, within about 30-45 minutes: `sets/paper-kit/MATCH.md`

Agent I is building the inside twins and aligns their last frames to your targets.
Decide your opening compositions first, then publish, in 1920x1080 screen pixels at
each shot's first frame:

1. **S23 (frame 4331):**
   - the path of the grid line of light along the paper river, as a polyline;
   - the branch lines into the district.

   S23's frame 4331 still includes the 12-frame dissolve from S22, so take your
   reference from a test shot or a frame after the dissolve.
2. **S25b (frame 4691):** the glowing vial's centre and extent.
3. **S26 (frame 4835):** the two pinholes, A (brighter) and B.

Add reference stills (`out/stills/match_S23.png` and so on) and list the paths. If
you later move a target, update MATCH.md, date the change, and say so in your reply.

## S23: bars 61-62, frames 4331-4474 (xin 12 from S22)

Keep the city, the drift, the glints and the satellites. What changes is why the
district comes online, which must be visible:
- a line of warm light runs along the paper river's bank, where S22's lines were,
  and reaches the district;
- it branches up into it;
- then the windows light, shuffled by building as now.

Paper logic: the lines are cut slits or lamp rows with light behind them, and they
read as the same lines S22 drew.

## S25b: bar 66, frames 4691-4762 (72 frames, new)

- Use `sets/paper-kit/biolab.js`, built for cut 1's S20: a tray of vials under a
  hood, where one vellum vial glows and throws the other vials' shadows up the
  hood's back panel.
- Claire asked for this glowing test tube to return.
- Open with the vial already faintly lit, where S25's knot was (a hard cut on the
  match), brightening through the bar.
- It is one bar long, so frame it to read in well under a second.

## S26: bar 68, frames 4835-4906 (72 frames; it was 2 bars)

- The observatory's slit opens on the chops within the bar, and its spill aims at
  the two pinholes.
- The pinholes are visible from frame 0 at the MATCH positions: S25c ends on two
  points of light there.

## S27: bars 69-70, frames 4907-5050, per beat

The rule at its fastest. There are 8 beats (use `T.events('beats')`):
- inside on beats 1, 3, 5 and 7;
- outside on beats 2, 4, 6 and 8.

Same framing both ways:
- **Inside:** the rocket, with its sail as payload (folded in the nose, or drawn
  unfurled above it), is drawn in lines of light by the crowd round its base.
  - Use hillx `lines` plus `crowd`, as cut 3's S20 and S27 do.
  - Keep the world dimmed to night, like S20's end, so the flip doesn't strobe.
  - Each inside beat adds more of the drawing.
- **Outside:** the paper rocket on its gantry (`launch.js`) at S28's opening state
  and view.
  - The outside beats may add a little life, such as service lights or tissue
    warming faintly, but save the ignition for S28.
- The last beat equals S28's frame 5051. `python3 render/cuts.py S27 S28` should
  read as continuity.
- Cut 3's S27 (the shelter plan, 8 angles) has reusable crowd and beam code.

## Checks

- `python3 render/cuts.py S22 S23 S25 S25b S25c S26 S27 S28`, using I's clips as
  they land.
- Contact sheets; final clips plus `_av`; update `sets/paper-kit/NOTES.md`.

Order: MATCH.md, S27, S23, S25b, then S26. Budget: about 180-240 minutes.
