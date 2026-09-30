# Production guide: building shots

Read this before building anything. The project root is
`C:/Users/USER/Projects/shelter-mv`. Also read `../TREATMENT.md`, which covers the
story and every shot, and `../shots.json`, the shot list with bars.

HARD RULE: never write or quote the song's lyrics anywhere, including replies,
code, comments, file names and notes. An API content filter kills any output that
contains them. You never need them: shots are keyed to bars and to audio features.

## The film in one paragraph

This is a code-rendered music video for "Shelter" (Porter Robinson & Madeon): 100
BPM, 90 bars, 3:37.7, 30 fps, 6532 frames. An AI (Claude, whose mascot is the
pixel creature Clawd) grows up inside training environments that humans build.
Its work there becomes real breakthroughs outside. At the end it builds a world to
shelter people, hosted in a Dyson swarm around Alpha Centauri B. Tone: tender,
luminous, hopeful, a little bittersweet. Never ominous.

## Two worlds, two style systems

- **Inside (the training environments)** climbs a fidelity ladder together with
  Clawd. See `style-frames/10-world-ladder/` (`ladder-strip.png`, `NOTES.md`).
  - **Rung 0, 1D tokens:** `style-frames/01-pretrain`, `01b-pretrain-tokens`.
  - **Rung 1, pixel:** 480x270 native scaled 4x, like `09-style-pixel`.
  - **Rung 2, vector:** flat and clean.
  - **Rung 3, dimension:** low-poly 3D like `02b-environment-poly`, with Clawd
    extruded into a solid (`05-clawd-sprites/clawd-3d.js`).
  - **Rung 4, luminous:** painterly, bloom.
  - **Rung 5, light:** particles, threads, glow.

  Colour is capability: early worlds are gray and Clawd is the only orange thing.
  HUD numbers (episode, step, loss; small, clean monospace) exist only inside.
- **Outside (the real world)** is ONE style for the whole film: backlit cut paper.
  The style bible is `style-frames/prompts/_paper-common.md`, and the references
  are `style-frames/11-paper-lab`, `12-paper-fusion` and `13-paper-swarm`.
  - It is always a peaceful night, in cool indigo papers.
  - Warm orange light shining through the paper is the only saturated thing, and
    it marks Claude's contribution.
  - No HUD and no text outside.
- **Clawd** is the 18x5 glyph, with cells 1 wide by 2 tall, in #D97757, with dark (ink)
  eyes in every form (Claire, 09-29: no lit eyes). He stays
  crisp, with exact cells, and is never blurred or painted over. See `lib/clawd.js`
  and `style-frames/05-clawd-sprites/`. Outside, he appears only on the lab's
  screen (S08, and S20's end).
- **Humans** appear only in the lab (S08, and its coda at the end of S20) and on
  the final hill (S31). They are faceless and low-detail: silhouettes outside.

## How a shot is built

A shot is one ES module, `shots/<ID>.js`, with a default export:

```js
export default {
  async setup(ctx) { /* build scene, compile shaders, precompute. ctx.canvas is yours */ },
  render(ctx, fr) { /* draw frame fr.f into ctx.canvas (may return a Promise) */ },
};
```

- `ctx.canvas` is a `ctx.W` x `ctx.H` canvas: 1920x1080, or smaller with
  `--scale`. Call `getContext('2d')` or `getContext('webgl2', {preserveDrawingBuffer:
  true, antialias: false, alpha: false})` on it once. For a scale-independent
  shot, draw in 1920-based units times `k = ctx.W / 1920`. If your set only works
  at 1920x1080, render full size into a private canvas and downscale into
  `ctx.canvas` when `ctx.scale !== 1` (see `shots/S21.js`).
- `ctx.T` is the timeline (`render/timeline.js`), and `ctx.log(msg)` prints in the
  driver log.
- `fr` is the frame info:
  - `f`: global frame;
  - `t`: seconds;
  - `fl`: local frame in the shot;
  - `tl`: local seconds;
  - `u`: progress through the shot, 0 to 1;
  - `n`: frames in the shot;
  - `bar`: float bar number, where 57.0 is the bar-57 downbeat;
  - `beat`: float beats since bar 1;
  - `section`: section id.
- **Determinism is mandatory:**
  - `render(fr)` must be a pure function of the frame, with nothing carried
    between frames.
  - Use seeded randomness (`lib/util.js`: `rng`, `hash`, `vnoise`, `fbm`), never
    `Math.random`.
  - Particle systems are closed-form in time, or re-simulated from a
    deterministic seed.

  The driver may restart Chrome mid-shot and continue at any frame.
- Put set code shared by several shots in `sets/<set-name>/`. Shared helpers live
  in `lib/`. To port an existing style frame, `render/port_frame.py` wraps its
  script into a factory (see `sets/paper-fusion/fusion.js`).

## Timeline and music: `ctx.T`

- `T.env(ch, f)`: audio features normalised to 0..1, per frame. Channels:
  - `mix`, `vocals`, `drums`, `bass`, `other`, `kick`, `snare`, `sub`, `lowmid`,
    `high`;
  - `onset`, `drums_onset`, `centroid`;
  - `chroma_C` .. `chroma_B`.

  `T.envSmooth(ch, f, r)` averages over +-r frames.
- `T.events(name)` returns frame lists:
  - `beats` and `bars`;
  - `kicks` and `snares` (drum stem);
  - `chops` (vocal-chop lead notes, in intro, hooks and drops);
  - `sung` (sung-line onsets);
  - `stops` (the bass stutter-stops, about 10 frames each).
- `T.since(name, f)` gives frames since the last event, and
  `T.pulse(name, f, halfLife)` gives a decaying 1-to-0 pulse. `T.inStop(f)` is true
  inside a stutter-stop.
- `T.barTime(b)` and `T.frameOf(t)`: bar b starts at `0.38 + 2.4(b-1)` s. A bar is
  72 frames and a beat is 18.
- The song map, with hit points, is `analysis/STRUCTURE.md`.

Keep motion musical but restrained: land big changes on the downbeats the
treatment names, let the kick or voice breathe light, and don't strobe.

## Rendering and reviewing

Run from the project root with Node on PATH: `export PATH="/c/Program Files/nodejs:$PATH"`.

```
node render/render.mjs S19 --still 3800            one frame -> out/stills/S19_f3800.png
node render/render.mjs S19 --scale 0.5             half-res preview clip -> out/shots/S19_s0.5.mp4
node render/render.mjs S19                         the final clip -> out/shots/S19.mp4
node render/assemble.mjs --shot S19                clip + its stretch of the song -> out/shots/S19_av.mp4
python3 render/sheet.py out/shots/S19.mp4 12 4     contact sheet -> out/shots/S19_sheet.png
node render/assemble.mjs                           the whole film so far -> out/film.mp4
```

- **Iterate on stills first.** View them with the Read tool (Windows path) and
  critique like a demanding art director: value structure, focal point, whether
  it reads in a second, whether it fits the style bible. Then render a preview
  clip and view its contact sheet to check motion, timing and flicker.
- Where you can, render the final clip and its `_av` version at the end.
- **Budget:** at most about 0.5 s of page time per 1080p frame; the driver adds
  about 0.15 s. The logs in `out/logs/` show page times.
- The GPU is a 2 GB MX150, shared with other agents rendering in parallel. Keep
  VRAM modest and mostly render stills and half-res previews. The driver retries
  automatically if Chrome loses its WebGL context. Headless Chrome already runs
  with `--use-angle=vulkan`.
- **Bash is Git Bash on Windows.** Heredocs mangle backslashes and choke on
  apostrophes and non-ASCII: write files with the Write tool and run them. Use
  `python3` (numpy, scipy, Pillow, opencv) with `C:/Users/...` paths; plain
  `python` is the wrong interpreter.

## Ownership (several agents work at once)

- **Yours:**
  - your `shots/<ID>.js` files;
  - your `sets/<name>/` folder;
  - new files you add under `lib/`;
  - your outputs in `out/`.
- **Don't touch, but you may read and import:**
  - `render/*`;
  - existing `lib/` files;
  - `shots.json`, `TREATMENT.md`;
  - other agents' shots and sets;
  - `style-frames/`.

  If you need a change there (a new env channel, a shot boundary moved with
  `shift0`/`shift1`, a driver fix), describe it in your NOTES and final report.
- Don't write to `~/.claude/memory`. No git commits, no emails.
- **Deliverables:**
  - the shots and sets;
  - `out/shots/<ID>.mp4` plus `_av.mp4`, where finished;
  - `sets/<name>/NOTES.md`, under 300 words: what each shot does, the technique,
    page ms/frame, known issues, and what is left.
