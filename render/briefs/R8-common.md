# Revision 8: brief (Claire's notes on cut 7). Everyone reads all of it.

`R3-common.md` still applies (rules, ownership style, permissions, working method), and so does
`render/GUIDE.md`. Read `shots.json` (31 shots, rewritten by `render/revise8_shots.py`) for the
bars and descriptions, and `analysis/STRUCTURE.md` for the song.

HARD RULE: never write or quote the song's lyrics anywhere (replies, code, comments, file names,
notes). An API content filter kills any output that contains them.

## Claire's notes on cut 7 (bars 49-73)

- S21's light outline landing on the paper reactor is "a very effective transition": use it for
  faster jump cuts that keep a visual thread. For example, S29's build-up (S27's alternation, S28's
  countdown) could become a jump cut from the rocket in light to the launch.
- The protein, fusion and city lights thread feels out of order. The city lights are a result of
  the spread of Clawd's technology; there is no direct sim-to-real analogue. So Clawd should not
  build the city: the city comes after the protein and fusion scenes ("maybe another, for rule of
  three").
- The folded protein does not directly become medicine (people do that work), so the reactor need
  not be an exact blueprint either, only its core shape; then the rocket's exact blueprint reads
  as progression. Or keep cuts before S29, but cut between the Clawds drawing the rocket and the
  observatory.
- To emphasise agency, the world Clawd works in can vary for each breakthrough.
- Musically, the pacing is fine as long as some technology lights up on bar 57.
- As before: carry out the intent, not the letter.

## The new sequence: four landings, each more exact

Each breakthrough is one technology. Clawd makes it in light, in a world made for it. Then a hard
cut lands the light on its paper twin on a downbeat: S21's device. What lands grows each time,
and so does the scale (a vial, a greenhouse, a reactor, a city, a rocket):

| Landing | Bar (frame) | What lands | Means |
|---|---|---|---|
| vial | 57 kick (4043) | the knot's glow pours into it, no outline | people made the medicine |
| greenhouse | 61 (4331) | the plant's outline, only the plant | Clawd's plant; the greenhouse is theirs |
| reactor | 65 kick (4619) | the core: ring and coils | Clawd's core; the machine is theirs |
| rocket | 73 drop (5195) | every line of the blueprint | Clawd's design, built as drawn |

The city (66-68) is the consequence of all three: no drawing, it just comes online. The rocket is
revealed only at liftoff. Every landing falls on the first bar of a four-bar phrase, so the
sequence has a pulse: one bar of landing, then three bars of the next thing.

| Bars | Frames | Shot | Owner | Content |
|---|---|---|---|---|
| 49-52 | 3467-3754 | S18 | P | unchanged |
| 53 | 3755-3826 | S19 | P | unchanged |
| 54-56 | 3827-4042 | S20 | D | the amino acids and the fold, with a few Clawds; the pull-back through the lab screen; A leans in to the knot. **The reactor drawing is removed.** |
| 57 | 4043-4114 | S25b | O | the kick: the knot's light pours into a vial; it blazes; the rack follows |
| 58-60 | 4115-4330 | **S34** (new) | P | a world for growing; a plant designed in light; the crowd plants rows |
| 61 | 4331-4402 | **S35** (new) | O | the paper greenhouse: the plant's outline lands; grow lights come on |
| 62-64 | 4403-4618 | **S36** (new) | D | a world by the sea at sunset: the sun pulled down into a ring of plasma, night falls, coils close round it |
| 65 | 4619-4690 | S21 | lead | the kick: only the core (ring and coils) lands; ignition (done) |
| 66-68 | 4691-4906 | S23 | O | hard cut; the dark city; the reactor's light runs in; the city comes online on the snare roll |
| 69 | 4907-4978 | S25c | I | a night world for looking up; on the kick the crowd marks the two stars |
| 70-72 | 4979-5194 | S27 | I | two beats at a time: the observatory, then the crowd drawing the rocket, every line; on 72's last beat only the lines remain |
| 73-76 | 5195-5482 | S29 | O | the lines land on the dark paper rocket as it ignites; liftoff (then as now) |

Cut from the film: S22 (river), S24 (town of light), S25 (the crowd's proteins), S26 as its own
shot (its observatory plays inside S27) and S28 (its ignition moves into S29's first frames). Their
code stays in the repo as modules; `backups/cut7/` holds everything as it was.

## The landing, precisely (S21 is the reference implementation)

On the outside shot's local frame 0 (the downbeat), the inside drawing's lines appear on the paper
object at exactly the inside's last-frame screen positions: white-hot, with S21's bloom (a 7 px and
a 2.2 px blur under the sharp lines). Each line then burns from white to Claude's orange and goes,
in about 7 frames, staggered: outer parts first, the heart last, its light going into the object.
The paper object lights as they burn (liquid, grow lights, plasma, engines). Flash strength
follows the music: full on the kicks (57, 65) and the drop (73), gentler on bar 61, which is quiet.
See `shots/S21.js` (drawLines) and `sets/paper-fusion/landing.js`.

## The worlds: Clawd makes one for each breakthrough

- The protein stays in the valley where the hill was just raised (S19, S20). Each later
  breakthrough gets its own world, visibly Clawd's making: for example, its last strokes landing
  as we arrive (S18's painting, quickly), or Clawd's act remaking it (S36's night falls because
  Clawd took the sun).
- They stay in S18's painted look (brush streaks over low-poly forms, low-poly trees, clean skies),
  and vary in land, light and palette: golden fields (S34), the sea at sunset turning to night
  (S36), a clear night for stars and a launch (S25c, S27). By S27 it is night, toward S31's
  palette.
- Clawd's cursors type orange code for each piece of work (R5): amino acid names (S20), and short
  lowercase code lines for the plant, the sun and the rocket. Inside only; legible; no brand names.
- The crowd grows through the sequence: a few Clawds in S20, a dozen in S34, many in S25c and S27.

## Rules that bind everyone (additions to R3's)

- **No paper rocket before bar 73,** and no paper twin for the city: its buildings come online
  from the reactor's light, never from a drawing.
- **Outside keeps the dark indigo night;** only the landings and warm lights are bright. Inside,
  S25c and S27 are night worlds, so the intercut doesn't strobe.
- **Clawd outside:** only on the lab screen (S20's end). Humans: only in S20's lab (and S31).
- Determinism, crisp Clawd (#D97757, never enlarged or blurred), no text outside: as always.

## Ownership this round

- **P:** `sets/valley/*` (S17, S18 and S19 must render unchanged), new `shots/S34.js`, and new
  `sets/fields/` if you want one.
- **D:** `shots/S20.js`, new `shots/S36.js`, `sets/door/*` (new files welcome), `sets/paper-lab/*`
  (additive: S08 unchanged).
- **I:** `sets/inside-montage/*` (additive options only: S20, S30, S31, S32 import it),
  `shots/S25c.js`, and **`shots/S27.js` (moves to you from O)**.
- **O:** `sets/paper-kit/*` (sail.js and launch.js stay compatible with S30), `shots/S23.js`,
  `S25b.js`, `S26.js`, `S28.js`, `S29.js`, new `S35.js`, and `sets/paper-kit/MATCH.md`.
- **Lead:** `shots.json`, `render/*`, `lib/*`, docs, `shots/S21.js`, `sets/paper-fusion/*`.

Everything else is read-only: import it, don't edit it. If you need something outside your
files (a hillx option, a shot boundary), put it in your NOTES and final reply, or message the lead.

## Matches (the only hard cross-agent dependencies)

| Cut | Target published by | Where |
|---|---|---|
| S34 last (4330) → S35 first (4331) | O | MATCH.md: the paper plant's outline, screen px, and stills |
| S36 last (4618) → S21 first (4619) | lead (done) | `sets/paper-fusion/LANDING.md` |
| S25c last (4978) → S27 first (4979) | O (unchanged) | MATCH.md: pinholes A (452.5, 321.6), B (487.2, 339.9) |
| S27 last beats (5177-5194) → S29 first (5195) | O | MATCH.md and `sets/paper-kit/rocketlines.js` |

O publishes the plant and the rocket targets first, within about 45 minutes; P and I build the
worlds and mechanics meanwhile and align when they land. There are no dissolves in this stretch
except S19 → S20 (xin 8, unchanged).

## Per agent

### P: S34, the plant (bars 58-60, 216 frames)

A world Clawd paints for growing things: fields in golden light (terraces or rolling fields: your
call), the last strokes landing as we arrive. The cursors type a short line of orange code; a seed
of light goes into the soil, and a plant grows from it in lines of light: stem, leaves, a grain
head. That's the design. Then the crowd (a dozen Clawds, `sets/inside-montage/crowd.js` or your
own clawd3d) plants it in rows along the fields, each row lighting. The last frame has one plant in
the foreground exactly on S35's paper plant (MATCH.md), with the rows behind it. The music: a
quiet sung verse; bass held through 58-59, drops out on 60 beat 2. The previous shot is the paper
vial (warm in a dark hood); the next is the greenhouse at night. Use your valley engine or import
hillx read-only, whichever gives the better world.

### D: S20 and S36

**S20 (bars 54-56):**
- Keep the amino-acid drop and the fold, but give them the room the reactor drawing leaves: a
  calmer fold, with two or three Clawds popping out of Clawd's light on the sung onsets to help,
  and the knot glowing and turning.
- Pull back out through the lab screen. The lab holds about 1.5-2 s: A leans in to the knot on
  the screen, and the room settles dark before the bar-57 kick.
- The first frame (S19's view, xin 8) stays as it is.

**S36 (bars 62-64):**
- A world by the sea at sunset: Clawd and a few Clawds on the shore, the sun big and low over the
  water.
- The cursors type orange code and hook the sun with beams. They pull it down out of the sky and
  press it into a ring of plasma hovering over the water.
- The sky drains to night as it goes (Clawd took the sun), and the twelve coils close round the
  ring, drawn in light (`reactor.js` torus, merid and coil only).
- The bass returns under bars 62-64, and the snare pickup (64.3-64.4, frames 4589-4618) brightens
  the ring.
- The last frame puts the ring and coils on `LANDING.md`'s lines.
- If you need a sea or sun control that hillx lacks, fork into `sets/door/` as you did with
  hillx-fix, or ask the lead to have I add an option.

### I: S25c and S27

**S25c (bar 69):**
- A night world for looking up and launching: your call (a high plateau, a salt flat that mirrors
  the stars, a shore). It is Clawd's making, like the others.
- On the kick (4907) the crowd, many now, turns and marks the two stars with beams.
- The last frame is on the pinholes (unchanged).

**S27 (bars 70-72):**
- Two beats at a time:
  - **outside:** the observatory, `S26.js` `s26State` and `observatory.js`, imported read-only.
    The first beat opens on the pinhole match; the slit opens on the chops, and the lit city is
    in its valley.
  - **inside:** the crowd drawing the rocket in lines of light on S25c's world. Every line:
    body, boosters, engines, fins, fairing, and the sail folded inside, so it reads as a whole
    blueprint.
- On 72.1-72.3 (5123-5176, the drums drop out) the drawing completes and the crowd steps back.
- On 72.4 (5177-5194, the loud fill; lead and voice cut out) the world goes dark and only the
  lines remain, exactly where `rocketlines.js` puts them at S29's first frame.
- The current `S27.js` (O's) has the rocket strokes and the unprojection from paper to hill
  world; reuse whatever helps.

### O: the paper side

1. **MATCH.md first:**
   - the paper plant for S35 (its outline in screen px at 4331, plus stills);
   - `sets/paper-kit/rocketlines.js`: every line of the rocket's blueprint in the launch set's
     paper coordinates, with the draw order S27 needs and a function to project them through a
     launch camera;
   - S29's frame-0 camera and the lines' screen positions there.
2. **S25b (57):**
   - on the kick the knot's light arrives over the vial and pours in: S20's knot, from
     `protein.js`'s FOLD conformation drawn as light (a glow, not an outline of the vial);
   - the vial blazes, then the vials beside it light one after another (people making it at
     scale), throwing shadows up the back panel.
3. **S35 (61):**
   - a new paper greenhouse (`sets/paper-kit/greenhouse.js`): arched ribs, vellum panels, rows of
     paper plants, night;
   - on the downbeat the plant's outline lands on the nearest paper plant and burns off (the
     gentle landing), and the grow lights come on row by row.
4. **S23 (66-68):**
   - a hard cut from S21, with no dissolve;
   - remove the pre-lit bank lines, branches and cross line (they were S22's twins). The city
     opens dark, the reactor glowing on the far bank (and the greenhouse, small, if it fits: the
     world accumulates);
   - the reactor's light runs along the bank into the city, and the city comes online building
     by building on the snare roll, which runs continuously through 65-72.
5. **S26.js:** keep it as the observatory module for I's S27. It is no longer its own shot.
6. **S29 (73):**
   - a new opening: the dark paper rocket on its pad, and on the drop (local 0) every line lands
     on it;
   - the engines ignite in the same instant (S28's ignition, compressed into the first frames),
     and the lines burn off into the exhaust over the first beat as the billows bloom;
   - liftoff and the rest unchanged. S30 must still render as it does.

## Budget, checks, deliverables

About 2-3 hours each; four agents share the GPU. Iterate on stills and half-res previews. Check
your cuts with `python3 render/cuts.py <IDs>`. Finish with final clips, `_av.mp4` versions and
contact sheets, your set's NOTES.md (under 300 words), and a final reply of 5-8 sentences: what
each shot does, cut numbers, page times, anything unfinished, and what the lead must re-render.
If a command is denied, stop that line and report it; never edit `.claude` settings.
