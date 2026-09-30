# 12 · Paper fusion (S21, the kick on bar 57)

**What it is.** A tokamak just after ignition, as an eight-layer backlit shadow box: railing; front ribs and punched cryostat; plasma vellum; back ribs and cap; deck; hall; back wall; sky tissue.

**Technique.** One 3D model (plasma, 12 D-coils, deck, cryostat) is projected through one camera. Canvas2D cuts it into mask layers, with hairline gaps where pieces overlap. WebGL2 composites them with wobbly cut edges, 1-2 px rims (bright toward the ring, dark away), light wrap and drop shadows. One analytic light field (the plasma through the coil cage) paints the deck fans, floor fans and wall stripes as cut windows backed by lit fibrous tissue, plus light sheets in the haze. The plasma is stacked tissue, thinning to a hole along its hottest line. All warm light is one quantity mapped onto the orange ramp.

**Decisions.** 12 coils, not 18. The coils are open C-ribs under a cap, because the merged inner legs read as a lump. Camera 19° above the ring. Warm light covers 23% of the frame (14% strongly). The darkest pixel is (9,12,22).

**Works.** It reads in one glance at 320×180 and looks nothing like the pastel ladder. The reactor becomes a lantern: punched base, ribs, cap, fire inside.

**Doesn't.** The shafts are weak: from this angle the light sheets are vertical and merge with the wall stripes, so there is no radial burst. The deck fans pull the eye down. The hall is generic.

**Render time.** A fresh page takes 1.3-2.2 s (mostly the one-off mask upload). A persistent page takes 116 ms per frame including JPEG encoding (MX150, ANGLE/Vulkan), already inside budget.

**Animation.** `ignite.mp4` is 90 frames: dark until the kick on frame 10, then a flash, light fronts sweeping out, and a parallax push-in.

**Opinion.** A strong candidate for the whole outside world. "Light through matter" fits the story, and one orange ramp dials Claude's impact from a single harness up to a star. The cost is building every set as a small 3D model plus hand-tuned cut layers.
