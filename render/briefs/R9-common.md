# Revision 9: brief (Claire's notes on cut 8). Everyone reads all of it.

**Update (Claire, after this brief went out): the rocket is replaced by a space elevator.** A
chemical rocket after fusion reads as a step back; a tether to orbit is better technology and
sheer scale.
- In S27 the crowd draws the elevator: the anchor, the ribbon rising out of the sky with its
  bracing, and the climber with the folded sails. `sets/paper-kit/elevatorlines.js` replaces
  `rocketlines.js`.
- In S29 every line lands on the paper elevator at the drop, and the climber races up to the
  ring of satellites (geostationary), where the fleet unfurls. Then the beams push it away.
- The skyhook note below is superseded.

`R8-common.md` and `R3-common.md` still apply (rules, landings, ownership style, permissions,
working method), and so does `render/GUIDE.md`. `shots.json` has 30 shots
(`render/revise9_shots.py`); read it for the bars and the new descriptions.

HARD RULE: never write or quote the song's lyrics anywhere (replies, code, comments, file names,
notes). An API content filter kills any output that contains them.

## Claire's notes on cut 8

- "The pacing and visual beats of the greenhouse are amazing! The transition from sim to real there
  should be the benchmark." (S34 → S35: the outline landing gently, burning off, then the bays
  coming on down the aisle.)
- But the advancement itself (a designed plant) is unclear: it doesn't fit with the protein, the
  fusion reactor and the spaceship. Replace it, and keep the structure of the scene.
- "Now that Clawd's character progression is clear, you can focus on the singularity aspect."
  Her examples: an array of solar sails rather than one; a skyhook rather than a rocket; a fleet of
  satellites in the background of the city lighting up one by one; a change of perspective on the
  sail, moving away from the solar system; more of Clawd's code (or code we wrote). "These are
  examples, try to find better ways to convey the technological acceleration."
- S25c (the crowd marking the two stars) contributes less, so it's cut.

## The idea: every consequence is ten times bigger, and lights faster, than the last

The landings stay as they are (vial 57, card 61, reactor core 65, the whole rocket 73), and so does
their rising fidelity. What changes is what follows each landing, which now accelerates:

| | Bars | What comes online | How it lights |
|---|---|---|---|
| S25b | 57 | a rack of vials | one by one, at a walk |
| S35 | 61 | **a hall of compute** (new) | bay by bay down the aisle |
| S21 | 65 | a reactor | ignition |
| S23 | 66-69 | a city, then **a ring of satellites round the Earth** | windows on the snares; then satellites, doubling, closing into a ring on the 69 kick |
| S29 | 73-76 | **a fleet of sails, pushed by a forest of beams** | all at once |
| S30 | 77-80 | **the solar system, left behind** | a new, wider view each beat |
| S32 | 86-88 | the swarm (unchanged) | millions |

**Compute is the third breakthrough, and it's the engine of the acceleration.** People slid GPU
cards into a rack for Clawd (S06) and filled a hall with them (S16). Now Clawd designs the card,
and people's hall comes online with it (S35). After that, everything grows faster:
- the crowd: a dozen in S34, more in S36, thousands in S27, builders beyond counting in S30;
- the code: one line in S18, names in S20, a few lines in S34 and S36, then a wall of the film's
  own real code in S27 (the rocket's `rocketlines.js`), and a torrent of it in S30 (the shelter's
  code);
- the cutting: one-bar landings, then two-beat cuts in S27, then one-beat cuts in S30.

The skyhook isn't used. The rocket is the payoff of the landings (every line lands), and the
acceleration shows in what comes after it.

## Bars

| Bars | Frames | Shot | Owner | This round |
|---|---|---|---|---|
| 58-60 | 4115-4330 | S34 | P | the plant becomes a compute card; the scene's structure and timing stay |
| 61 | 4331-4402 | S35 | O | the greenhouse becomes a hall of racks under the same arches; the beats stay |
| 62-64 | 4403-4618 | S36 | D | more Clawds (compute has arrived), a little more code; the last frame is unchanged |
| 66-69 | 4691-4978 | S23 | O | four bars now: the city, then the satellites and the ring on the 69 kick (4907) |
| 70-72 | 4979-5194 | S27 | I | a crowd of thousands; the cursors type the rocket's real code; it opens on a hard cut from S23 |
| 73-76 | 5195-5482 | S29 | O | the climb passes through the ring; a fleet of sails unfurls; a forest of beams |
| 77-80 | 5483-5770 | S30 | I (+D's module) | outside beats: the fleet leaving the solar system; inside beats: the build, with a code torrent |

S25c is cut; S23 takes its bar. Everything else is unchanged. `backups/cut8/` has cut 8.

## Per agent

### P: S34, the compute card (bars 58-60)
Claire calls this scene the benchmark. Keep its structure and timing exactly: the last strokes of
the world landing, the lead cursor's code, the seed of light pressed in at 72, the design growing on
the bar-59 downbeat, Clawd's hop, and on bar 60 the dozen Clawds planting rows with the light racing
up each row.
- **The design:** a compute card in lines of light: the board, the chip (a square with a fine grid),
  traces, heat fins, and the gold edge connector. It grows up out of the soil as the plant did.
- **The rows:** rows of cards planted across the world, a server farm.
- **The world:** keep or restyle it, your call. The golden fields read well; a board-like layout of
  strips suits a chip too.
- **The code:** a little more than before (two or three short lines from more than one cursor).
  Real code from this repo is welcome if it's short and fits.
- **The last frame:** the foreground card lands on S35's paper card. O publishes it in MATCH.md
  first.

### O: S35, S23, S29 and MATCH
1. **MATCH.md first (about 30 minutes):** S35's paper card, as its outline in screen px at frame
   4331, plus stills. It's for P.
2. **S35 (bar 61):**
   - The greenhouse becomes a hall of compute under the same arched ribs and vellum vault (think
     of a supercomputer in a chapel): rows of paper racks down the aisle (your S06 rack and S16
     hall), and in the foreground an open rack with one card.
   - Keep every beat: the card's outline lands gently on the paper card and burns off; then the
     racks come online bay by bay down the aisle (LEDs, warm light through the vellum), and the
     vault warms.
3. **S23 (bars 66-69, 288 frames):**
   - Re-time the city's coming online over bars 66-67. The world still accumulates: the reactor on
     the bank, and a small lit hall where the greenhouse was.
   - **Bar 68:** satellites light one by one above the city. Each is a small paper satellite with a
     warm glint. The rate doubles as they go (one, two, four, eight a beat), following the snare
     roll.
   - **Bar 69:** on the kick (4907) the last ones close into a ring across the sky, the first ring
     of a swarm. It echoes the ring over S31 and S32's swarm. A tilt up so the sky takes more of the
     frame is welcome.
4. **S29 (bars 73-76):**
   - Keep the landing at 73.
   - **Bar 74:** the climb passes through the ring of satellites, the lit Earth below.
   - **Bar 75:** the fairing opens on a fleet of folded sails that spread and unfurl as an array,
     the hero sail in front and dozens to about a hundred behind.
   - **Bar 76:** a forest of beams rises from the lit Earth, one for each sail, and the fleet
     sails off together.
   - Publish the fleet's look in MATCH.md, for D and I: count, formation, size and colour at 76.
   - `sail.js` must stay compatible, or tell I what changed.

### D: S36 and the voyage set
1. **S36:** compute has arrived, so there are more Clawds, for example the four joined by more
   popping out of Clawd's light as they work. Add a little more code. The last frame (the landing on
   S21) stays exactly as it is.
2. **New `sets/voyage/`, outside paper:** the fleet leaving the solar system. It gives S30's six
   outside beats (the odd beats of bars 77-79: local frames 18, 54, 90, 126, 162 and 198 of
   S30, 18 frames each). Each beat is a new, wider view, simple enough to read in 0.6 s:
   - (1) the fleet leaving Earth, the ring of satellites behind;
   - (2) past Jupiter;
   - (3) past Saturn's rings and the outer orbits;
   - (4) looking back: the Sun small;
   - (5) the Sun one star among many, the dark between;
   - (6) the two stars ahead, A and B, large and near.

   Planets are paper discs and orbits fine paper rings. The sails are lit orange by the beams, and
   the Sun and stars are warm pinholes. Deliver it as a module I can call from S30:
   `createVoyage(canvas, { k, log })` and `voyageFrame(beat 0-5, local frame 0-17)`, deterministic,
   1920x1080. Match O's fleet (MATCH.md).

### I: S27 and S30
1. **S27 (bars 70-72):**
   - The crowd grows to thousands, the salt flat covered to the horizon; this is where the
     exponential crowd reads.
   - As they draw each part, their cursors type the real lines of `sets/paper-kit/rocketlines.js`
     that define it: a wall of code, several cursors at once, faster than before. Keep them
     legible in the stills.
   - It now opens on a hard cut from S23's ring; the observatory beats stay.
   - Keep the lines-alone beat and the S29 match.
2. **S30 (bars 77-80):**
   - **Inside beats:** the build as now, but the crowd much larger, and their code pouring out,
     real lines from the shelter's own renderer (`sets/hill/shelter.js`, `shots/S31.js`), faster
     than it can be read.
   - **Outside beats:** D's voyage module replaces the single sail.
   - Bar 80's landing on S31's first frame stays exact (S30 → S31 is 1.4).

## Budget and deliverables

About 1-1.5 hours. Four agents share the GPU. Everything in R8-common's "Budget, checks,
deliverables" applies: final clips, `_av`, sheets, NOTES, a 5-8 sentence final reply, and never
routing around a denied command.
