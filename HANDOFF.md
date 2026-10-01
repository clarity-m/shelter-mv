# Handoff: for the next model on this project

Read this first, then `CLAUDE.md` (the state, newest cut first) and `render/GUIDE.md` (how a shot is built). The
film was made in 23 cuts over five days (09-26 to 10-01, 2026). Claire directs, and the code renders every frame.

HARD RULE: never write or quote the song's lyrics anywhere: chat, files, code, comments or names. An API content
filter blocks any output that contains them. Key everything to bars and timestamps.

## Working with Claire
- **How she writes notes:** visual notes state intent, so find the change that best delivers it. Musical-timing notes
  are exact instructions with a rationale, so follow them to the letter. Her timestamps are given to the second;
  snap them to the beat or bar inside that second, then tell her what you chose.
- **Before changing something she has praised,** ask what she likes about it, or give her variants. Three blind
  rebuilds of S05's lead-in all read wrong, and cut 20's version came back (R22-R24).
- **She is the only one who sees motion.** Every check here is stills and measurement. Send motion-heavy changes to her
  as a short review clip with sound before they go into a cut (`out/review/`).
- **A/B clips settle her uncertain calls** (`render/ab_hook1.py` is the model). When she says she's unsure, build both.
- **Credit:** she credits the visuals and the animation to the model; the direction and many of the best ideas are
  hers (the space elevator, the bonsai, the cursor that flutters down to be caught, the physics questions).

## Each cut
1. Re-render the changed shots: `node render/render.mjs ID`. A shot with `xin` in shots.json dissolves from the
   previous shot's last frame at render time, so render in dependency order (S06 → S07 → S05, S02 → S03).
2. `node render/assemble.mjs` → `out/film.mp4` (6532 frames).
3. Checks:
   - `.venv/Scripts/python.exe render/check_av.py out/film.mp4`: the A/V offset, +0.0 ms.
   - `python3 render/cuts.py`: designed continuity cuts are ≤ 3.7 mean abs difference (S08→S10 is 6.2 by design).
   - `python3 render/glitch.py out/film.mp4 12`: 0 single-frame spikes and 0 short bursts. The flagged jumps must
     all be intended hits (see the latest CLAUDE.md entry).
   - `python3 render/overview.py`: one frame per shot.
4. Copy `out/film.mp4` to `out/film_cutN.mp4` and `out/overview.png` to `docs/`. Add an entry to `CLAUDE.md`, then
   commit and push (the repo is public; `out/` and all audio stay out of git).

## Fragile spots
- **Exact landings and matches:** S01→S02, S02→S03, S06→S07, S07→S05, S08→S10, S12→S13, S17→S18, S18→S19, S30→S31,
  S31→S32, S32→S33, plus S34→S35's chip and S36→S21's core (S36's last frame must stay bit-exact).
- **The bookends:** S01, S02 and S33 share one function of the global frame (`sets/paper-card/opening.js`).
  Changing S01 must leave S02 and S33 bit-identical.
- **`sets/door/hillx-fix.js`** patches the hill engine at load (solid Clawds in S20 and S36). It hooks onto specific
  lines of `sets/inside-montage/hillx.js` and `glslx.js`. After editing those files, check the render log for
  "hillx-fix: WARNING".
- **One cursor language:** a constant angle, eased glides with gentle curves, holds only where the story needs them
  (with an idle hover), and emotion from translation and timing.
- **The HUD:** S10's metrics (caps about 20 px, rows 32 px apart, the label at x 48, the value 144 px to its right).
  The pretraining shots have no HUD.

## Where the history lives
- `CLAUDE.md`: every cut's changes, from cut 3 onward.
- `render/briefs/`: the plan for each revision, R3-R24.
- `viewers-notes*.txt`: Claire's notes.
- `TREATMENT.md`: the story, through draft 16.
- Each set's `NOTES.md`: its own decisions.
- `render/clips.py` (social clips) and `render/x_clip.py` (the 2:20 X cut).
