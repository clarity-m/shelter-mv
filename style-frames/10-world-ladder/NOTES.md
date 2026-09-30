# 10 · World ladder

**What it is.** One shot at five rungs: dusk on a hill inside a domed training environment. The sun sets on the right shoulder, Clawd stands on the crest, and a faceless figure hugs her knees by the tree, watching him. Camera, composition, sun and objects are shared; only the lens changes, and saturation climbs rung by rung. `ladder-strip.png` sets them side by side. `frame.png` cuts one frame into five bands, and the hill line runs unbroken across the seams.

**Technique.** One file, `ladder.html?rung=N`. The scene is defined once in 3D (a hill heightfield, an SDF figure and tree, cloud ellipsoids, a lat-long dome) and ray-cast in WebGL2. Each rung reads the same hits:
1. **Pixel:** a 480×270 G-buffer, 24 colours, dither only at band edges, 1-px rims toward the sun. Clawd is the 36×10 ladder sprite (my reading of "glyph, 2x pixel").
2. **Vector:** a 2× cel pass (two flat tones, banded sky), with ink on the near side of every boundary. Clawd is the ladder's vector SDF, inked.
3. **Dimension:** the same primitives as jittered polytopes. Clawd is the glyph extruded 4 cells, eyes punched through to the sky.
4. **Luminous:** an underpainting plus 117k isophote-aligned strokes, light wrap and bloom. Clawd is composited crisp, lit from within.
5. **Light:** the world as a ghost. Contour lines of light pool around him, motes lift off, and the dome becomes threads. Clawd is the 11-ray spark.

**Transitions.** 1→2: resolution doubles while dither snaps to flat shapes and ink draws on. 2→3: a small dolly reveals depth and the glyph extrudes. 3→4: facets subdivide smooth, then paint bleeds outward from Clawd. 4→5: strokes shrink to motes and lift, contours ignite from the crest, and his limbs become rays (`burst(t)`). Within a rung, clouds drift and motes rise. Rung 4's strokes need world-anchored seeds so they don't boil.

**Render time** (warm cache, in page / Chrome wall): 1.7/3.5 s, 1.0/2.7, 1.7/4.5, 1.5/4.8, 1.1/4.6. All in budget. The GPU passes alone take 0.1–0.8 s, so compiling once per shot in a persistent page should get every rung near 1 s.

**Works.** It reads as one film. Clawd is the focal point on every rung (measured #D97757, #DA7757, lit #CD775A, luminous #F18C68), and his halo carries through: pixel rings, flat rings, glow, spark corona.

**Doesn't.** Rung 4's paint is soft impressionism, not confident brushwork. The foreground slope is large and quiet in rungs 3–4. Rung 5 darkens the sky, a deliberate break, and its grid flirts with synthwave. The 3D figure is mannequin-smooth.

**Opinion.** It works because geometry is authoritative and styles are lenses. Build production that way: one scene graph, five renderers, so transitions become per-pixel blends between lenses.
