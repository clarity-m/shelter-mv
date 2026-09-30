# 09 style: pixel art, "The harness"

**What it is.** A night lab with moonlight shafts. Clawd glows inside jointed ribs that curl up like two cupped hands, open at the top. One researcher leans in with a stylus, their face lit only by him. The other stands back with a mug at a monitor: a gray gridworld with a tiny orange agent, and an eval curve at 0.62. Clawd's light is the only saturated color. Monitor cyan is the one pale accent.

**Technique.** One HTML file, authored at 480x270 into a palette-index buffer (30 colors), then scaled 4x nearest-neighbor. Both are verified in the PNG. Light comes from palette ramps, and dithering (2x2 Bayer) appears only where ramps change. Figures are polygons rim-lit by marching toward each light. The face is hand-placed (headgen.py). Clawd sits on the native grid (1 glyph cell = 1x2 px); I kept him unscaled because sharing the world's grid is the point. Deterministic: a re-render was byte-identical.

**Works.** Reads in a second, uses the full value range, and makes color = capability literal.

**Doesn't.** The humans are charming at 25 px, but the hands are 8-px mittens and B is stiff. Close-ups need a real pixel artist. The lower-third cabinet is dead space.

**Render time.** 0.25-0.5 s of JS per frame on the loaded laptop, about 4 s wall time with Chrome startup. That is already in budget, and caching static layers gets it under 0.1 s.

**Animating.** Drifting motes, palette-cycled glow rings, a ticking curve. The camera steps in whole native pixels, and pull-backs render a larger canvas.

**Fidelity dial.** Hold Clawd's screen size fixed and raise the world's resolution: 60x34 (coarser than Clawd), 480x270 here (matched), 960 and 1920 (finer), then paint. The palette grows with it: 4, 30, 64, then full color.

**Opinion.** Best conceptual fit for the dial. I'd use it for the early acts, not the whole video.

## v2 (round 3)

**Faceless humans.** No eyes, nose or mouth. A's head is a hand-placed sprite (headgen_v2.py): bun, hair falling over the ear, and a smooth egg of a face shaped only by Clawd's light. The bowed head and the stylus hand carry the feeling. B's face is an oval shaded only by the monitor (cyan rim to the hairline). B's head is bowed a little more, and both hands now cradle the mug.

**Clawd 2x.** Each glyph cell is now 2x4 native px (32x20), crisp and integer-aligned. It reads far better: he is the unmistakable focal point, and the fingers visibly hold him. The harness grew only about 10%, so the cup hugs him, and A stepped back 9 px. The trade-off: his pixels are now coarser than the world's, which bends the "shared grid" idea behind the fidelity ladder. I'd make "Clawd cell = 2 world px" the fixed rule for the whole pixel act. `frame-v2.html?cs=1` restores native scale (v2-pass1).

**Fingers.** Each side has three fingers plus a thumb. They are tapered tubes with notched knuckles and glinting tips, and the last joint hooks inward over him. The side facing him is lit warm; the outer side gets moonlight on the left and shadow on the right. Up close they turn slightly stripey.

**Passes.** 1: faceless at 1x. 2: 2x plus the new cup. 3: B's face relit, thicker thumbs. 4 (= frame-v2.png): curled tips. detail-v2.png shows both figures at 1:1.

**Checks.** 30 colors, exact 4x4 blocks, and a re-render is byte-identical. Render time is 0.4-0.6 s of JS, about 5 s wall time on a loaded laptop. frame-v2.html is standalone (make_v2.py derived it once from frame.html).
