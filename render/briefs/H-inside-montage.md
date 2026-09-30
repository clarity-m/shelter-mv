# Brief H: the inside montage (rungs 4 and 5), shots S22, S25, S27 and S30, plus the S32 shelter swap

Read `render/GUIDE.md` first, then the TREATMENT.md sections for your shots and
`analysis/STRUCTURE.md`.

## Your sets

- **Inside:** reuse `sets/hill/`. It is the rung 4 (luminous paint) and rung 5
  (light) scene engine, with world-anchored strokes. Its `NOTES.md` documents the
  API, including `sets/hill/shelter.js`. Finished shots in this look to match:
  `out/shots/S19.mp4`, `S24.mp4` and `S31.mp4`. Keep the look identical; extend
  the set only by adding files or clearly additive options. Its owner has
  finished, but other shots depend on it, so don't change its defaults.
- **Outside:** for S30, use the square vellum sail from the paper-montage agent.
  It is being built right now; look in `sets/` for its folder and NOTES, which
  document the sail call. If it isn't ready when you get to S30, build the inside
  beats first and render the outside beats with a clearly marked placeholder, then
  report.

## Shots

**S22:** bars 59-60, frames 4187-4330, 4.8 s, rung 4. Verse 2b, sung. Inside, Clawd
reroutes a river through his valley, and the painted water follows the line he
walks. It is part of the quick-motion intercut, with hard cuts on the downbeats.

**S25:** bars 65-66, frames 4619-4762, 4.8 s, rungs 4 to 5. Build 2: the vocal-chop
lead returns over hats and a snare roll. There are many Clawds now, building
together; multiplicity carries the scale, and no Clawd ever gets big. The
brushstrokes shrink into motes of light and lift (the ladder's 4 to 5
transition). Chops (T.events('chops')) can spawn or light Clawds.

**S27:** bars 69-70, frames 4907-5050, 4.8 s, rung 5. Clawds draft structures in
lines of light: a blueprint turning in space. By now the cuts land on every beat,
so cut between angles inside the shot on the beats (T.events('beats')).

**S30:** bars 77-80, frames 5483-5770, 9.6 s. Drop 2. It intercuts per beat:
- **outside:** the square sail crossing the pinhole dark;
- **inside:** Clawds set the hill at the centre of the new world, and towers rise
  behind it. Use `shelter.js` with `build` going from 0 to 1 and `figure: false`.

Bar 80's turnaround lands on the finished hill, which must match S31's first frame
(`out/shots/S31.mp4`, frame 5771) closely enough to cut on.

**S32 swap:** `shots/S32.js` (by the swarm agent, now finished) opens on a stand-in
shelter inside the sim bubble. Swap in the real one:
- render `shelter.js` at S31's last view into a 2048x2048 canvas;
- pass it to `createSwarm(..., { simSource })`.

The seam is documented in `sets/paper-swarm/NOTES.md` and `sets/hill/NOTES.md`, and
`out/stills/_HILL_f5.png` shows it. Check the cut from S31's last frame (6202) to
S32's first (6203), then re-render S32 and its `_av`.

## Deliverables

- the shots, with `out/shots/<ID>.mp4` plus `_av.mp4` and contact sheets;
- any new set files, with a NOTES.md;
- a final reply of 5-8 sentences.

Budget: about 120-180 minutes. Order: S32 swap, then S30, S25, S22, S27. Other
agents work in parallel; the ownership rules are in the GUIDE.
