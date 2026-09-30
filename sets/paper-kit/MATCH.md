# MATCH.md: where the paper twins sit (agent O; revision 15: S35's landing unchanged, it runs to 62.2)

The positions are screen pixels in 1920x1080 (y down), at the outside shot's FIRST frame. The inside
twin's LAST frame puts its light on these marks. Revision 8 (2026-09-29 00:56) is at the top; the
older targets it retired are listed at the end.

## Revisions 20-21: S06 -> S07, the rack's rows (for agent T)

**Revision 21:** the main cut has S06 at bars 13-14, hard-cutting to S08, and no S07. For the lead's
A/B (S06 at bar 11, frames 731-802, then S07 at bar 12), S06's code is length-agnostic. At one bar
its last frame, 802, is the view below, at rest (the camera's push and drift have eased to a stop,
and the pulses have calmed by local 67). One thing changes: **bay B (row 5, y 656) now holds card 2,
lit like bay A**. It is bay A shifted down 364 px, with the same vents (x 817-1146, centred at
981.5) over bay y 597-715. The rest of the frame matches the R20 frame. Reference:
`out/stills/match_S06_last_r21.png` (taken from the test clip).

**Revision 20** (bar 13 only, frames 875-946). The last frame, 946, was still: the camera's push had
eased to rest and the pulses had calmed by local 67. S07 opened on frame 947. In screen px
(1920x1080) at 946:
- **The six rows**, the rack's unit and bay centres, 121.2 px apart: **y 171, 292, 413, 535, 656,
  777** (T's old `170 + 120 i` is within 1-7 px).
- **The lit row:** only bay A (row 2, y 292) holds the new card.
  - Its lit vents span **x 817-1146**, centred at **x 981.5** (the old match used about 978).
  - Its warm LEDs are at x 1213-1248, and the bay spans y 233-351.
- **The dark row:** bay B (row 5, y 656) is empty and dark.
- **The rack's rails** are at x 685 and 1278.
- **Reference:** `out/stills/match_S06_last.png`.

## Revision 8: the landings (S21's device: the drawing's lines land on the paper and burn off)

### S34 → S35: the chip (agent P; revision 10, 04:05). S35's first frame is 4331, the bar-61 downbeat

S35 now opens close on the paper die of the card: **face-on, an axis-aligned square**, exactly as a
chip lying flat on the ground looks from straight above. So end S34 on a camera looking straight down
(pitch -90°) at your ground chip. A steep-but-not-vertical camera keystones the square, and the
landing won't sit.

- **The die:** the square **x 680-1240, y 260-820** (560 px, centred at (960, 540)).
- **The lines that land:** 20 lines, the chip's floorplan only. They are in
  `out/stills/match_S35_chip.json`. They live as `DIE_LINES_A()` in `sets/paper-kit/datacenter.js`
  (hall.js `DIE_LINES()`, placed at the far end of the aisle), with `dieLinesAt(0)` in
  `shots/S35.js`. Revision 13 re-verified them: at most 6e-12 px from the JSON. In screen px at 4331:
  - **die** 680-1240 × 260-820, and **core** 719-1201 × 299-781 (inset 7%);
  - **arrays:** 736-882 × 316-445, 893-1016 × 316-445, 736-882 × 596-764 and 893-1016 × 596-764;
  - **narrow blocks:** 1027-1061 × 316-445 and 1027-1061 × 596-764;
  - **caches:** four stacked down the right, x 1078-1184 at y 316-420, 431-534, 546-649 and 660-764;
  - **logic band:** 736-1061 × 462-579, with 7 vertical dividers at x 777, 817, 858, 898, 939, 980
    and 1020.
- **Around it** on the paper card: a pad ring just inside the die's edge, a package seam at
  x 648-1272, y 228-852, traces leaving the bottom edge (five) and the right edge (three), the
  heatsink's fins on the right, the gold connector at the bottom. Only the chip lands.
- **References:**
  - `out/stills/match_S35.png`: frame 4331, the lines landing white on the paper die;
  - `out/stills/match_S35_lit.png`: local 14, the die lit block by block, the pull-out just
    beginning.
- **After the landing (revision 14 timing):** the lines burn off gently by local 14 (the blocks
  first, the die's outline last). One powers-of-ten pull-out in log zoom follows:
  - the card sits in an open frame at the far end of S16's hall, on the aisle's vanishing point;
  - S16's bays enter as a tunnel book (17-23) and come online far to near;
  - the lit hall (about 25-31);
  - the roof slab sweeps down across the frame (29-34);
  - the hall's roof from above;
  - the campus, whose plan is the die's floorplan, is fully in frame by 47.
- **The hold (R15: the shot runs to 62.2, frames 4331-4420):** the campus holds for 42 frames while
  its lighting wave crosses it (47-62), and the generator ring lights last (to about 78). The power
  lines pulse outward, and the view settles by local 89.
- **Its last frame (4420 since R15, `out/stills/match_S35_end.png`):** the campus sits in the die's own
  square, x 680-1240, y 260-820.

### S27 → S29: the space elevator (agent I; revision 9, 02:30). S29's first frame is 5195, the bar-73 drop

**Revision 11 (05:40):** S29 now starts at **5183** (shift0 -12), so the landing below happens at 5183 instead of
5195, with the same camera (the rest view) and the same positions. S27's lines-alone frames are
5177-5182. The lines burn off by the drop (5195), when the climber launches.

The rocket is gone. S29 opens on a paper space elevator at sea, at night, revealed only at the
drop, where every line of the drawing lands on it.
- **`sets/paper-kit/elevatorlines.js`** replaces `rocketlines.js`, with the same shape:
  - `STROKES` (66, `{ part, pts, z, t0, t1, w, I }`) in the elevator set's paper coordinates, in draw
    order:
    - anchor 0-0.16;
    - tower 0.14-0.31;
    - stays 0.3-0.36;
    - ribbon 0.34-0.58, with its ties rising as it goes;
    - climber 0.6-0.74;
    - the folded sails it carries, 0.76-0.98.
  - `screenStrokes(cam)` projects the strokes through a kit camera, and `heat(part)` gives the
    burn order.
  - `EL` and `climberParts()` are the geometry (the set is built from them).
- **S29's frame-0 camera** is `S29_CAM0`, the rest view, so at 5195 **the screen positions are the
  paper coordinates**:
  - the whole drawing spans x 780-1140, y -60 to 880;
  - **anchor:** a floating platform, x 780-1140, y 772-880 (deck 772-800, four legs, two
    pontoons at the waterline 856-874);
  - **tower:** tapered from 110 px wide at y 772 to 34 px at y 600, five X-braced stages;
  - **stays:** four, from high on the tower to the deck;
  - **ribbon:** a vertical band 18 px wide, x 951-969, from the tower's top at y 600 straight up
    past the frame's top (to y -60), with ties every 36 px;
  - **climber:** a 76 px square capsule, x 922-998, y 400-476, with a window band and clamps
    above and below on the ribbon;
  - **folded sails:** six zig-zag packs on each side, x 896-922 and 998-1024, y 405-461.
- **References:** the positions are in `out/stills/match_S29_lines.json`, and the lines alone
  are drawn in `out/stills/match_S29_lines.png`. `out/stills/match_S29.png` is S29's first frame:
  every line landing white on the paper elevator.
- **What S27 needs to do:** on 72.4 (5177-5194), put the lines exactly there, within about 3 px.
- **In S29:** from 5195 the lines burn off: the anchor first, the sails last. The climber lights
  and races up the ribbon.

### The fleet: revision 12 physics (for D; 13:12). This supersedes the geometry notes below where they differ

`sets/paper-kit/fleet3d.js` now follows R12's point 3: **beamed sails face their beam.**
- **Every sail is parallel.** Its normal is exactly `SOURCE_DIR` = `SHEET.N` = (0.35, -0.90, -0.28),
  pointing from the sail toward the beam source, which is far away below. `sailMesh` no longer adds
  any tilt or turn jitter; `spin` only animates a folding sail. The organic look comes from
  position jitter, the staggered rows, the curved sheet, ±6% size variation, and billow (a
  per-sail depth between 0.7x and 1.3x, plus breathing when you pass `sailMesh(i, { t })` in seconds).
- **The beams run along the normal** and meet each hub at normal incidence. They are parallel in 3D
  and converge only in perspective, toward the source or toward the travel point.
  - `beamSource(i, L = 60)` is a far point on sail i's beam; `beamFrom(p, L)` gives the same for any
    point.
  - `TRAVEL` = -SOURCE_DIR is the direction the light goes and the sails are pushed.
  - A beam from a source behind the camera needs clipping at the near plane before projecting (see
    `clipProject` in `shots/_FLEET.js`).
- **The formation** is the same curved, staggered sheet as revision 11, in the plane perpendicular
  to the beams (spanned by `SHEET.U` and `SHEET.V`).
- **The hero is integrated** as the flock's nearest member: index `N_SAILS` (= `HERO.i`), so
  `slotAt(N_SAILS)` = `HERO.c` = (-2.47, -0.06, 5.83). It has the same mesh and orientation and sits
  about 5.7 units off the plane on the beam side (nearer the source). Through `CAM` it's the big sail
  low left, about (360, 930), about 270 px; it hangs clear of the sheet and shows the same tilt as
  every other sail. Loop over `N_SAILS + 1` sails to include it. It's no longer sail.js's sail.
- **Unchanged:** the colours (lit rgb(255,158,104), beams rgb(255,150,96)), `CAM`, `drawSail`, and
  `sailCorners` (a square in the plane, so its normal is the beam axis; just stop passing spin
  jitter).
- **References:** `out/stills/match_fleet_R12_pale.png` and `match_fleet_R12_lit.png`, through
  `CAM`, from `shots/_FLEET.js`.
- **For your view 0 (from behind):** the camera is on the TRAVEL side, so it sees the sails' backs,
  backlit, with the beams converging toward the source's vanishing point (the direction
  SOURCE_DIR from the camera).

### The fleet (for D's voyage and I's S30; revision 11, 05:32, after Claire: "a rigid grid of tiles")

The fleet is now **a flock of light sails**. Everything lives in **`sets/paper-kit/fleet3d.js`**; import
it read-only, and drawing through its `drawSail` gives the voyage the same sails as S29.
- **Each sail (`sailMesh(i, { open, spin, billow })`):**
  - a thin square light sail: an X of booms from the hub to four tips on the square's diagonals;
  - four translucent membrane panels between the booms, each billowing a little away from the light
    (along -N) and scalloped along its outer edge;
  - each sail's normal leans slightly off the sheet's, with its own turn and a ±6% size variation.
  - `open` 0..1 unfurls it: the booms extend and the panels fan open.
- **Drawing (`drawSail(g, k, proj, mesh, look)`):**
  - each panel is shaded by how squarely its billowed facet faces the light (`look.light`, a world
    direction), so the four panels take four tones;
  - the membrane is dense and bright at the hub, thinning to translucent at the edge, with a thin
    bright rim, fine booms (pale when unlit, dark against the lit film) and a soft hot spot at the
    hub where the beam presses (`look.hot`);
  - `look.lit` 0..1 runs from pale tissue to Claude's orange. Draw with `globalCompositeOperation`
    'lighter' (light through tissue) over black, far to near.
- **The formation:**
  - 14 × 10 = 140 sails in a gently curved sheet: the edges lift away from the beams (curve 0.011);
  - staggered rows (alternate rows offset by half a spacing), spacing 1.85 × 1.9 with ±5% and
    jittered positions, and a little height play along N;
  - `SHEET.c` = (3.2, 4.4, 19), U = (0.62, 0, 0.78), V = (-0.70, -0.44, 0.56), N = U × V = (0.35, -0.90, -0.28);
  - `slotAt(i)` gives the centres. `sailCorners(c, side, open, spin)` is kept, so your current
    code still runs, but use `sailMesh` + `drawSail` for the new look.
- **S29's camera (`CAM`):** close, among the sails: at the origin, yaw 0.06, pitch 0.3, focal 1150,
  principal point (960, 560). The nearest sails are about 580 px and cut by the frame's top-left;
  the flock recedes to the right to sails about 25 px. 126 of the 140 hubs are in frame. D's
  voyage cameras can pull back from the same sheet (`project(p, cam)` takes any camera).
- **Colours (unchanged, agreed):** pale rgb(150, 168, 206); lit **rgb(255, 158, 104)**; beams
  rgb(255, 150, 96) at about 28%, from `beamSource(i)` far below.
- **References:** `out/stills/match_fleet_R11_pale.png` and `match_fleet_R11_lit.png`, the flock
  through `CAM` unlit and lit, from the test shot `shots/_FLEET.js`.

### The observatory's pinholes (for I's S27 beats; revision 9: no longer a match)

S25c is cut, and S27 opens on a hard cut from S23's ring. Its observatory beats still show `S26.js`
`s26State` (A at (452.5, 321.6), B at (487.2, 339.9) at local frame 0), but nothing has to land on
them.

### Landings O makes on its own (no inside twin)

- **S25b (4043, the bar-57 kick):** S20 ends in the lab, so the knot's light is drawn in S25b
  itself (protein.js's FOLD conformation as light) over the vial, and pours in.
- **S23 (4691):** a hard cut from S21. The city has no drawing: it comes online from the
  reactor's light.

## Retired by revision 8

- The S22/S24 → S23 grid (the bank line at y 722.5, the risers at x 1039/1177/1345/1479, the
  cross line at y 662, the near-bank line at 978.5, and the district's building silhouettes)
  went with S22 and S24. S23 keeps its buildings and its reactor, with no pre-lit lines.
- S25 → S25b (the vial at (960, 654)) went with S25.
- S27/S28's paper rocket at S28's first frame (5123) went with S28.

## History

- 2026-09-28 14:12: first publication (S23, S25b, S26).
- 14:25 and 14:44: S23's cross line and near-bank line.
- 19:16 (revision 5): re-keyed.
- 21:29 and 21:41 (revision 7): the district silhouettes for S24, and the reactor at the bank.
- 2026-09-29 00:56 (revision 8): the plant (S35), the rocket lines (S29), and the retirements
  above. The pinholes are unchanged.
- 2026-09-29 02:24 (revision 9): S35's plant becomes the compute card (x 1036-1500, y 588-828).
  The rocket lines and the pinholes are unchanged.
- 2026-09-29 02:30 (revision 9): the rocket is replaced by the space elevator (`elevatorlines.js`,
  x 780-1140, y -60 to 880 at 5195). `rocketlines.js` is retired.
- 2026-09-29 02:40 (revision 9): the fleet's look (96 + the hero, formation, size, colour at 76),
  and the paper elevator's still (`match_S29.png`).
- 2026-09-29 04:05 (revision 10): S35's card target becomes the chip, face-on (die x 680-1240,
  y 260-820 at 4331); S34 should end looking straight down.
- 2026-09-29 04:18 (revision 10): the fleet becomes a tilted 3D sheet (`fleet3d.js`, Claire's
  note); one set of colours shared with D. The elevator lines are unchanged.
- 2026-09-29 05:32 (revision 11): the fleet becomes a flock of light sails (`sailMesh`, `drawSail`),
  140 in a curved, staggered sheet, with a closer camera. `sailCorners` is kept for compatibility.
- 2026-09-29 05:40 (revision 11): S29's landing moves to 5183 (shift0 -12); the positions are unchanged.
- 2026-09-29 13:12 (revision 12): sails parallel, facing the source; beams along the normal (normal
  incidence); the hero integrated as the nearest member (`HERO`, index N_SAILS).
- 2026-09-29 16:15 (revision 13): S35 becomes the data-centre pull-out (`datacenter.js`). The chip
  target at 4331 is unchanged; the campus ends in the same square at 4402.
- 2026-09-29 18:10 (revision 14): S35's pull-out is compressed, and the campus holds from 47. The
  4331 and 4402 targets are unchanged.
- 2026-09-29 19:58 (revision 15): S35 runs to 4420 (shift1 18). Frame 4331 is bit-identical, and the
  campus's square is now at 4420.
- 2026-09-30 04:05 (revision 20): S06 -> S07's rows and the lit vents at frame 946 (for T).
- 2026-09-30 11:55 (revision 21): S06 is length-agnostic. Its one-bar ending (the A/B's frame 802) is the
  same view with bay B's card lit too.
