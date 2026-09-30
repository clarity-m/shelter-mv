# Shelter MV, round 4: the outside world

You are one of four parallel subagents. Each makes ONE style frame (a still) for a
code-rendered music video. You run alone and non-interactively: nobody will answer
questions, so make decisions and note them. Your folder: FOLDER.

## The project in one paragraph

A music video for "Shelter" (Porter Robinson & Madeon, 2016; tender electronic
music). An AI (Claude, whose mascot is the pixel creature Clawd) grows up inside
training environments that humans build for it. Its work there turns into real
breakthroughs outside. At the end, it builds a world to shelter people, and that
world is hosted in a Dyson swarm around another star (Alpha Centauri B). Tone:
tender, luminous, hopeful, a little bittersweet. Never ominous, never dystopian.

HARD RULE: never write or quote the song's lyrics anywhere (replies, code,
comments, filenames, notes). An API content filter kills any output containing
them, which would end your run. You do not need them.

## Two worlds

- **Inside (the training environments)** climbs a fidelity ladder together with
  Clawd: 1D tokens, pixel, vector, low-poly 3D, luminous paint, light. See
  `../10-world-ladder/ladder-strip.png`. That is NOT your job this round.
- **Outside (the real world)** keeps ONE style for the whole film. The only thing
  that changes out there over the film is how much warm orange light it holds.
  Orange light marks Claude's contribution: a harness glowing on a lab bench, a
  sample vial, a fusion reactor, a city district's windows, rocket engines, and
  finally a star's light captured by the swarm. Everything else in the outside
  world is cool, dark and quiet. It is always night, the peaceful kind, never
  bleak.
- Outside shots are often on screen for only 0.6-2.4 s in a quick-cut montage
  that alternates with bright pastel inside shots. An outside frame must read in
  one second and look unmistakably different from every rung of the inside
  ladder. Test this: view your frame at 320x180.
- No HUD numbers or on-screen text outside. The HUD belongs to the inside.
- Humans are rare (only three scenes in the whole film), always faceless and low
  detail. Clawd almost never appears outside. Only the lab frame below has either.

This round compares candidate styles for the outside world on the same shots. Your
prompt section below names your style and your shot.

## Clawd (only where your prompt says so)

The pixel mascot, decoded from the Claude Code terminal glyph. An 18x5 grid; each
cell is 1 unit wide by 2 units tall; '#' = orange #D97757, '.' = empty. The two
holes in row 1 are the eyes:

```
...############...
...##.######.##...
.################.
...############...
....#.#....#.#....
```

He stays crisp: exact cells, never blurred or painted over. His body color must
measure #D97757 (+-6 per channel) at the center of a body cell. A glow around him
is good. `../05-clawd-sprites/clawd-sprites.js` has the glyph in code.

## Technical

- 1920x1080. ONE self-contained HTML file using Canvas2D and/or WebGL2. No network,
  no CDN, no npm packages. Deterministic: use a seeded PRNG, never unseeded
  Math.random. Render with headless Chrome (verified working, WebGL2 available):

  "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars --window-size=1920,1080 --virtual-time-budget=30000 --screenshot="C:/Users/USER/Projects/shelter-mv/style-frames/FOLDER/frame.png" "file:///C:/Users/USER/Projects/shelter-mv/style-frames/FOLDER/frame.html"

  Draw synchronously during page load (or finish inside the virtual time budget).
  Use C:/ style paths in Chrome arguments. Set html/body margin 0, 1920x1080 canvas.
- Python fallback and analysis: `python3` (numpy, scipy, Pillow, opencv,
  scikit-image, matplotlib), with C:/Users/... paths, never /c/Users/... . Plain
  `python` is the wrong interpreter. ffmpeg is on PATH.
- Your Bash tool is Git Bash on Windows. Heredocs mangle backslashes and choke on
  apostrophes and non-ASCII: write files with the Write tool, then run them.
- View renders with the Read tool using a Windows path, e.g.
  C:\Users\USER\Projects\shelter-mv\style-frames\FOLDER\frame.png
- Critique each render like a demanding art director. Check the composition, the
  value structure, the focal point, whether it reads at a glance and at 320x180,
  whether it feels alive and beautiful, and whether it fits the tone. Iterate: at
  least 3 render-and-critique passes, more while it keeps improving. Save each
  pass as pass1.png, pass2.png, ... and the final as frame.png.
- Budget: roughly 45-75 minutes. Stop when it is strong.
- Production needs about 1-3 s per 1080p frame in a persistent page. Measure your
  render time and say how you would reach that budget.

## Rules

- Work only inside your own folder. You may READ other folders under
  style-frames/ and ../TREATMENT.md for reference, but never write there.
  (TREATMENT.md is draft 2; the outside style it mentions is exactly what this round
  decides.)
- You are a subagent: do NOT write to ~/.claude/memory (no memwrite.sh, no log
  entries), no git commits, no emails or notifications.
- No image-generation APIs and no downloaded images: every pixel comes from your code.
- Deliverables in your folder: frame.png (final, 1920x1080), the source,
  pass*.png, thumb.png (the final at 320x180), and NOTES.md (under about 350 words:
  what you made, the key technique, what works, what does not, render time, what
  it would take to animate, and your candid opinion of this style as the outside
  world for the whole film).
- Your final reply: 3-5 sentences summarizing the frame and your self-assessment.

