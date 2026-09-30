# 05 · Clawd sprites and model sheet

**What it is.** `sprites.png` is the model sheet: canon construction, 14 emotes (also shown at 3×6 px), motion strips (walk, hop, sit, ledge sit, wave, carry, hold, sleep, look up) and a face kit. `ladder.png` has six rungs: glyph, 36×10 shaded pixel, vector, luminous bevel, radiant, spark. `clawd-sprites.js` holds every grid as strings, plus `drawSprite`, `drawFrame` (anchored at ground center), `mirror` and `toTerminal`. `frame.png` copies the sheet for contact-sheet scripts.

**Key decision.** Everything, accents included, stays on the 1:2 terminal grid, so any sprite prints in quadrant blocks. `toTerminal(GLYPH)` returns the exact Claude Code glyph. Emotes are carved from the two eye holes (arch, cup, slit, tall, low, side, o.O, \ /), the arm tips, the legs and one-pixel offsets.

**Works.** Every emote reads at 3×6 px. Arch and cup eyes give happy and content without a mouth. The spark's 11 rays are Clawd's limbs (two arms, two pairs of legs, five from the head), which gives the bookends a real morph.

**Doesn't.** Look-up is weakest: eyes can't rise without notching the head, so the head gains a row. That reads in motion, not as a still. The "!" and z accents are chunky. Curious leans on o.O more than the tilt. Rung 5's leg beams look like spurs. The eyes in the spark should fade as the burst completes.

**Render time.** Sprites are free: 1000 `drawFrame` calls take 55 ms. The ladder's four SDF rungs take 0.96 s of CPU JS, and a Chrome run takes 5-7 s. For 3-5 s/frame, port the rungs to WebGL2 fragment shaders with GPU bloom. Swarms need instanced quads from an atlas.

**Animating.** Walk uses `dx`, hop uses `dy`. Blink 2-3 frames every 3-5 s. `burst(x, y, t)` already drives the rung 5→6 morph.

**Opinion.** Committing to the strict grid was right. The constraint is where the charm comes from.

## Round 3: extruded 3D Clawd (`clawd-3d.png`, `clawd-3d.html`, `clawd-3d.js`)

**What it is.** A turnaround (front, 3/4, side, back, top) under a fixed warm key and cool fill, with the model on a turntable. It also shows blink, happy, sad, surprised, sleepy and love in 3/4 next to their 2D sprites, hop apex and walk passing keys, and depth 3/4/5 side by side. `clawd-sprites.js` is unchanged.

**Technique.** `Clawd3D.buildVoxels(grid, depth, opts)` extrudes any sprite into boxes in pixel-width units, with the origin at ground center:
- body runs are merged: neutral is 14 boxes, love is 40
- eyes are 1.0-deep pockets with an ink floor (`eyes: 'punch'` cuts through instead)
- blush and tears inside the body become flush inlays
- floating accents become inset small voxels at mid-depth; held objects sit just in front of the face

The renderer raymarches a 1×2×0.5 lattice in a WebGL2 fragment shader. It adds jittered key shadows, smooth voxel AO and a hairline chamfer on convex edges. Output is deterministic.

**Works.** Front and 3/4 read as the glyph. The back is blank, so facing is never ambiguous. Shallow pockets keep the eyes dark from 3/4, and accent voxels float with real parallax.

**Doesn't.** Side and top views are thin slabs; that's inherent to the design. Pockets deeper than 1.0 show orange walls and lose the eye. Punched eyes only read near 0°/180°.

**Cost.** The 16 views at 9 samples per pixel take 6.3 s on the UHD 620, about 0.4 s per 110k-pixel view. One Clawd about 300 px wide at 4 samples costs roughly 0.1 s. Crowds should rasterize the box list as instanced cubes.
