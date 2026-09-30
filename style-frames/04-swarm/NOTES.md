# 04 · The swarm

**What it is.** The final pull-back: a Dyson swarm around Alpha Centauri B. Most of its 21 bands are "cradle" rings whose near arcs pass under the star, so the lower half reads as a basket holding the light (the cupped motif). Eleven open lanes in the near shell let light escape as an irregular 11-ray spark, across the disk and faintly into the haze. A sits upper-left in a blue reflection nebula. HUD: `EP 000001 / STEP 000000`, a new episode, for us.

**Technique.** One HTML file: WebGL2, half-float HDR, seeded, about 15 s per render.
- An fbm nebula underpainting with marched self-shadowing and heightfield cloud relief.
- About 80k instanced brushstrokes sample it, aligned to isophotes.
- An analytic swarm shell composited front to back, 4x AA.
- About 276k crisp 1 to 2 px collector points: one pixel per instance.
- Bloom, a hue-preserving tonemap (ACES bleached the orange), weave and grain.

**Works.** Clear value hierarchy and warm/cool split. The spark reads on a second look. Crisp collectors against painted clouds.

**Doesn't.** At thumbnail size the swarm reads more as a glowing armillary ball than as "millions of instances". The lower bands get scribbly at 1:1. The upper sky is slightly hazy and samey. The cloud bank makes scale ambiguous.

**Animating.** Everything is parametric. Collectors orbit along their bands while the lanes stay fixed, so the spark holds as the swarm flows. Strokes need world-anchored seeds, perhaps held on 2s. About 0.5 to 1 s per frame.

**Opinion.** The direction works: saturated orange holding a pastel sky is a strong final image, and escaping light is the right way to land the spark bookend. I'd push scale further, with denser and smaller collectors and a longer pull-back from inside the lattice. The cloud bank is debatable: it sells Shinkai but costs some "deep space".
