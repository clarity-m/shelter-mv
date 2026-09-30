# Revision 19: the aesthetic pass (Claire's notes on cut 17, plus the lead's drop review)

The earlier briefs and `render/GUIDE.md` still apply: Clawd is a crisp black-eyed solid, never enlarged;
he acts with his eyes; the outside world is backlit paper; renders are deterministic. The code is in git
(github.com/clarity-m/shelter-mv), and cut 17 is `out/film_cut17.mp4`. Claire's notes are in
`viewers-notes.txt`.

HARD RULE: never write or quote the song's lyrics anywhere (replies, code, comments, file names,
notes). An API content filter kills any output that contains them.

The goal of this pass is to make every scene more fluid, clearer or more vivid, and to make the drops
land harder.

## The drops

| Drop | Where | Now | Change |
|---|---|---|---|
| Hook 1 | bar 9, frame 587 (S03 into S04) | bars 5-8 barely change, and 9.1 adds faint grey arcs | S03 builds with the riser; 9.1 snaps (T) |
| Drop 1 | bar 33, frame 2315 (S12 into S13) | the extrusion reads as a white-on-white fade | the humans' first click `ground.raise()` lands on 33.1 with a ring of rising facets (P) |
| Drop 2 | bar 73, frame 5195 (S27 into S29) | strong (Claire) | an ignition bloom at the launch on 73.1, and the star trails start on the downbeat (O) |
| Vocal drop | bar 81, frame 5771 (S30 into S31) | quiet; the figure pops in | a wave of warm light runs through the shelter, and the figure forms from light (I) |

## Per agent (wave 1: T, P, I, O, D; wave 2: E2, L)

### T: pretraining (S03, S04, S05; sets/tokens)
- **S03 (5-8):** build with the riser. The token stream speeds up toward bar 9, the line brightens,
  and the camera creeps along it. The tokens near Clawd become large and legible, as first designed.
  The world stays grey (colour is capability), so the build comes from light, contrast and motion.
- **S04 (9-10):**
  - On 9.1, a decisive snap: the token line lifts into the stacked layers with a white bloom flash,
    and the camera pulls back or tilts in one clean move.
  - The first attention arcs fire across the whole stack on the first chops. Arcs are brighter, with
    a little bloom where they land.
  - The 9.4 stop freeze stays.
  - Claire loved this visualization, so it gets more contrast and legibility, not a redesign.
- **S05:** brighter counters and curve where it helps.
- **Constraints:**
  - S03 opens with a 9-frame dissolve from S02's last frame (xin 9). S02 is changing (L), so the
    lead re-renders S03 last.
  - S03→S04 and S04→S05 stay continuous.

### P: drop 1 and the valley (S13, S14, S34; sets/valley, sets/fields)
- **S13:**
  - The humans' first click, `ground.raise()`, lands exactly on 33.1, together with the extrusion.
    A ring of facets rises out from Clawd like a shock wave: the flat field punching into 3D.
  - The world is a touch deeper grey (it reads washed out now).
  - The humans' code panels are larger, readable at phone size. If you change the default size in
    `papercursor.js`, say so; the lead re-renders S02, S15 and S19.
- **The spawn pad is a square everywhere** (S13-S18), since the environments are square tiles (Claire).
  Re-render S15 and S17 if the pad shows in them.
- **S34:**
  - Scatter the crowd naturally instead of in one regimented row.
  - Add a physics diagram in light, like S27's force diagram: the band structure the periodic
    potential creates (the Kronig-Penney picture), energy against crystal momentum k, with the
    allowed bands and the gaps opening at the zone edges k = ±π/a. Draw it on the lattice beside the
    chip.

### I: S27, S31, S30
- **S27:** move the crowd back from the blueprint's base so the anchor reads clearly (Claire).
- **S31:**
  - On the vocal drop (81.1), a wave of warm light runs through the shelter from the hill outward,
    lighting the towers and brightening the ring.
  - The figure forms from light beside Clawd as the wave passes, drawn in lines of light and then
    real, over about a beat. It no longer pops in, so S31's first frame has no figure.
  - The lower city is denser: mid-rise buildings and lights filling the base of the skyline
    (Claire: it looks sparse).
- **S30 and S32:** if `sets/hill` changes, S30 must still land exactly on S31's first frame
  (re-render it), and S32's seam reads S31 (the lead re-renders S32).

### O: the paper side (S06, S16, S23, S26, S29)
- **S06 and S16:** the LED pulses read on beats 2 and 4; make the main pulse land on 1 and 3
  (Claire).
- **S23:** the satellites stand out more: brighter, clearer glints, and a more prominent ring.
- **S26:** the slit slides cleanly open in one move instead of stepping with the beat.
- **S29:**
  - Brighter lasers and larger sails (Claire).
  - The fleet keeps accelerating once the beams hit, or the camera moves with it; no speeding up and
    then slowing down.
  - The launch gets an ignition bloom on 73.1, and the star trails start on the downbeat.

### D: S20, S36, the voyage
- **S20:**
  - Placing the amino acids is slow and the fold is quick; flip that balance, so the beads drop
    briskly and the fold spiralling down the funnel gets the time (Claire).
  - Add a physics diagram: the chain's contact map, a 15 × 15 grid of light on the funnel's rim.
    Each cell lights as a pair of residues touches during the fold, filling into the native
    pattern: helix bands beside the diagonal, sheet streaks across it. It rhymes with the contact
    maps behind modern structure prediction.
- **S36:**
  - The sun deforms into a torus, not a flat disk. Its hole opens as it's pressed, and a tokamak's
    plasma really is a torus (Claire: do whatever represents the physics).
  - Lower the horizon so the aurora gets more of the sky.
  - Spread the paint-in over its three beats, less wipe-like.
  - Add a physics diagram: the binding energy per nucleon curve, with D + T → ⁴He marked (17.6 MeV),
    drawn in light in the sky or on the sea.
  - The last frame's landing on S21 stays exact.
- **The voyage:**
  - A and B sparkle and glint, and never overlap the sails.
  - The beams are Earth's laser array pushing each sail. They belong only to the first view, near
    the Sun; in the later views the fleet coasts, so the beams fade out.
  - The lead re-renders S30.

### E2 (wave 2): S10, S11
- **S10:** the scrolling version becomes the default (Claire approved), and the humans' cursor
  moves smoothly off screen instead of disappearing.
- **S11:** a beat after Clawd tops the steep slope, the cursor reacts. It hovers nearby and makes a
  small pleased arc, stays a moment, then moves away (Claire).

### L (wave 2, new): the lab's humans (S08, S20's lab coda; sets/paper-lab) and S02 (sets/paper-card)
- **The lab silhouettes** (researcher A seated at the desk, B standing with a mug) are anatomically
  off. Rebuild them from correct proportions: an 8-head figure and correct joints for sitting and
  standing. Trace over a good photo or pose reference: any reference is fine for this
  non-commercial film (Claire). Note the source in NOTES. Keep them faceless, low-detail paper
  silhouettes. S08's push into the screen and its match to S10 must hold.
- **S02:** the click becomes a burst of light from the cursor's tip that floods the frame into S03's
  warm wash (Claire). S01 and S33 stay unchanged.

## Deliverables

For each shot: the final clip, `_av` version and sheet, updated NOTES, and a 5-8 sentence reply
covering what changed, the cut numbers, and anything the lead must re-render. Never route around a
denied command.
