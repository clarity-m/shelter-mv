# 14 · Pixel swarm: the lantern at the end of the pull-back

**What it is.** Alpha Centauri B inside three nested shells of dark collector panels. Each shell leaves an opening around the axis the camera came out along, so we look down into the lantern to the white star. A porthole to its lower right holds the world, a pastel sunset over a hill. Eleven lanes run through all three shells and leave hot notches in the rim. Their light fans into the dust as uneven tapered shafts: the spark. A sits upper left; the Sun is a faint point lower left, ending Cassiopeia's W.

**Technique.** It uses the 09 craft: 480x270 authored into a palette-index buffer (32 colours: the lab's two ramps plus 6 pastels and 2 cool), then 4x nearest-neighbour. Exact 4x4 blocks; byte-identical re-renders. Each panel is a Voronoi cell of a rotated Fibonacci lattice, inset by its seam and filled as a flat polygon. A per-pixel cast collects haze through the gaps. Rims light by marching toward the star and A.

**Works.** It reads as an icon at 320x180 (91% of the frame is below 10% luminance). The panels look built, and the bubble reads as a tiny world.

**Doesn't.** The inner shells show only through the opening, as a warm mottle. The nesting needs the pull-back to sell it. The ray tails come out rust-maroon, because the lab ramp is brown at low values. Cutting the lanes across the face gave a stronger spark (pass 2) but looked like shattered glass.

**Render.** 0.86 s of JS per frame, about 3 s with Chrome startup. Caching the sky and clipping rays to their wedges gets it under 1 s.

**Animating.** Shells turn at different rates while the lanes hold. Dust streaks scroll outward. The zoom is hard in pixel art: re-rasterize every frame on the native grid and accept some edge shimmer.

**Opinion.** Pixel makes a strong icon and keeps the outside consistent with the lab. For the whole film I'd hesitate, for two reasons. It duplicates inside rung 1, so the early intercuts differ only in palette. And S32 leaves a rung-5 world of light for a 480x270 reality, which reads as reality being downgraded.
