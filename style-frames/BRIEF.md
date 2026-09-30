# Shelter MV: style-frame brief

You are one of four parallel subagents, each making ONE style frame (a still image) for a code-rendered music video. Claire (the director) wants a feel for the artistic direction before production starts. You run alone and non-interactively: nobody will answer questions, so make decisions and note them.

## The project

A singularity-inspired music video for "Shelter" by Porter Robinson & Madeon (2016, about 3:40; a tender electronic song with a signature vocal-chop synth lead). The original anime MV is about a girl living alone inside a simulation her father built to shelter her after sending her away from a dying Earth. Our version inverts it: an AI grows up inside training environments that humans build for it, and in the end it builds a shelter for them.

HARD RULE: never write or quote the song's lyrics anywhere (replies, code, comments, filenames, notes). An API content filter kills any output containing them, which would end your run. You do not need them.

### The grammar of the whole video

1. The frame is AI training environments. Every scene is an environment: gridworld, Atari-like, MuJoCo physics, open worlds, sims indistinguishable from reality, and finally an environment the AI builds itself. Sim-to-real: advances made inside sims become real-world advances.
2. Color = capability. Early worlds are desaturated gray, and Claude orange is the only saturated thing. Color spreads through the worlds as the AI learns. Resolution, dimensionality and detail also track compute and hardware progress (a "fidelity dial").
3. Holding / enclosure. Every enclosure shares one cupped, sheltering shape: human hands, harness scaffolding, environment walls, a Dyson swarm.
4. Pull-back reveals. Scenes end by pulling back to reveal what contains them.
5. Who holds whom flips at the midpoint: first a human hand holds tiny Clawd; later Claude holds the world.
6. Superintelligence gets gravitas through scale and multiplicity (millions of orange instances), slow movement, haze and backlight, never by making Clawd big or menacing. Tone: tender, luminous, hopeful, a little bittersweet. Never ominous or dystopian: no spreading-infection maps, no red-eyed evil-AI tropes.
7. Starburst bookends: the Claude spark logo (an irregular radial burst of roughly 10-12 tapered rays, orange) appears briefly at the start and the end, ideally emerging as a shape or negative space rather than pasted on as a logo.

## Shared visual language

- 1920x1080, 16:9.
- Anime-film lighting sensibility (Makoto Shinkai skies, Ghibli scale): luminous gradient skies, cumulus, atmospheric perspective, bloom, halation. The original Shelter MV palette: pastel peach, pink, lavender, sky blue, golden hour.
- A painterly surface is preferred over flat vector: brushstroke texture and grain. Reference technique from another Opus video ("Functional Emotions"): paint a flat underpainting, then draw tens of thousands of textured brushstrokes that sample their color from the underpainting and align to edges or a flow field, then bloom, canvas weave, grain, vignette. You do not have to copy this, but painterly and luminous is the target. Fidelity can vary with where your frame sits in the arc (early = cleaner and sparser, late = richer).
- Claude orange: #D97757 (terracotta). Warm white #F5F0E8 and deep ink #141413 are good neutrals.
- Clawd, the pixel mascot, decoded from the Claude Code terminal glyph. An 18x5 grid; each pixel is about 1 unit wide by 2 units tall (terminal quadrant blocks); '#' = orange, '.' = empty; the two holes in row 1 are the eyes:

```
...############...
...##.######.##...
.################.
...############...
....#.#....#.#....
```

  Clawd stays pixel-crisp (never blurred or painted over) even when the world around is painterly; that contrast is part of the look. A soft glow or bloom around Clawd is good.
- Geometric agents (capsules, cubes, spheres, MuJoCo-style stick bodies) populate environments. Humans, when shown, lean anime (clean line, soft cel shading).
- No text on screen except diegetic HUD numbers (episode counters, step counts, FLOP counts, loss values) in a small clean monospace font: sparse and elegant, never captions.

## Technical

- Machine: Windows 11 ThinkPad (i7-8650U, 24 GB, Intel UHD 620). Your Bash tool is Git Bash.
- Preferred renderer (matches the eventual video pipeline): ONE self-contained HTML file using Canvas2D and/or WebGL2. No network, no CDN, no npm (Node is not installed). Deterministic: use a seeded PRNG, never unseeded Math.random. Render it with headless Chrome (verified working here, WebGL2 available):

  "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars --window-size=1920,1080 --virtual-time-budget=30000 --screenshot="C:/Users/USER/Projects/shelter-mv/style-frames/FOLDER/frame.png" "file:///C:/Users/USER/Projects/shelter-mv/style-frames/FOLDER/frame.html"

  Draw synchronously during page load (or finish inside the virtual time budget). Use C:/ style paths in chrome arguments. Set html/body margin 0 and a 1920x1080 canvas.
- Fallback: python3 (numpy, scipy, Pillow, opencv, scikit-image, matplotlib). Use C:/Users/... paths in python, not /c/Users/... . Plain `python` is the wrong interpreter.
- Bash-tool heredocs mangle backslashes and choke on apostrophes and non-ASCII: write files with the Write tool.
- View your render with the Read tool using a Windows path, e.g. C:\Users\USER\Projects\shelter-mv\style-frames\FOLDER\frame.png . Critique it like a demanding art director: composition, value structure, focal point, color, does it read at a glance, does it feel alive and beautiful, does it fit the tone. Iterate: at least 3 render-and-critique passes, more while it keeps improving. Save each pass as pass1.png, pass2.png, ... and the final as frame.png.
- Budget: roughly 30-60 minutes of work. Stop when it is strong.

## Rules

- Work only inside your own folder: C:/Users/USER/Projects/shelter-mv/style-frames/FOLDER/ . Do not touch other folders.
- You are a subagent: do NOT write to ~/.claude/memory (no memwrite.sh, no log entries), no git commits, no emails or notifications.
- No image-generation APIs and no downloaded images: every pixel comes from your code.
- Deliverables in your folder: frame.png (final, 1920x1080), the source (frame.html or .py), pass*.png, and NOTES.md (under about 300 words: what you made, the key technique, what works, what does not, what it would take to animate it, and your candid opinion of the direction).
- Your final reply: 3-5 sentences summarizing the frame and your self-assessment.

