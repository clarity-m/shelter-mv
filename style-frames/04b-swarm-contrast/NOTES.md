# 04b · The swarm, full contrast

**What it is.** The last pull-back. The camera has just left the humans' sim (its golden-hour sky inside a crisp soap-film boundary, bottom). Above: near-black space and Alpha Centauri B's swarm, five thin inclined bands of about 380k one-pixel collectors. The lit far arcs cup the white core, and eleven shafts escape beyond the bands to form the spark. A and the HUD stay. `alt-nosim.png` drops the sim for comparison.

**Technique.** One WebGL2 HDR file, byte-identical on re-render.
- The GPU hashes the collectors from `gl_VertexID` through inverse-CDF tables (ringlets, knots, stragglers).
- The lanes lie in the ring plane, and the swarm's interior is swept clean, so the shafts appear only in the dust beyond it. The spark grows out of the swarm instead of sitting on top.
- Only the sim is painted (18k sampled strokes); space stays crisp.

**Cloud bank → sim edge.** I kept it, recast as the boundary: painted inside, crisp outside, which is sim versus real. It is the story's payoff (the world the swarm holds), the frame's only Shelter pastels, and an echo of 01's spark-on-horizon.

**Works.** Full value range, one focal object, lots of black; the bands glitter at 1:1 and the spark reads within a second.

**Doesn't.** At thumbnail the bands read as fine dust rings rather than "millions". In a still, the sim could pass for a pastel planet; the pull-back makes it unmistakable. The rays border on a starburst filter, and the clouds are only serviceable.

**Render.** 1.9–2.5 s in-page, of which about 2 s is one-time shader compile. The frame itself draws in about 0.15 s. Compile once and loop frames in one page to get well under 1 s per frame.

**Animating.** Collectors advance a Kepler phase per band while the lanes stay fixed, so the spark holds as the swarm flows. The bubble recedes.

**Opinion.** A strong ending. I'd keep the sim edge.

## v2 (round 3): `frame-v2.png`, `frame-v2.html`, `v2-pass1–8.png`, `render-v2.sh`

**Cage.** Eight orbital bands at different tilts cross each other around B, about 620k collectors in total. Near collectors are brighter, warmer and often 2 px, and they partly occlude what lies behind them. Two nearly edge-on bands cross the disk as a dark X of backlit collectors. Far arcs are dim, deep-red 1 px threads that vanish behind the photosphere. A sparse veil of collectors fills in the shell.

**Spark.** Each of the 11 lanes is a 3D cone the swarm keeps clear, so the collectors inside it are removed. Its light shows only in the dust outside the cage: a broad, soft wedge that is hot at the opening, streaked along its length, and fading within about one radius. The swept interior stays dark. I hand-balanced the lane strengths so the burst is uneven.

**Sim: rethought.** In v1 the limb read as a separate planet with no tie to the swarm. The sim is now a small soap-film bubble held inside the cage beside the star, containing a tiny sunset world (sea, low sun, cumulus). Near bars cross in front of it. "Hosted by the swarm" is now literal, and the pull-back ends on what contains the world.

**Also.** Bloom now skips its finest level so silhouettes and single points stay crisp.

**Doesn't.** At thumbnail the cage leans toward an armillary or atom icon. The tails of the shafts can read as smoke. The bubble's sunset only reads at 1:1, so the pull-back has to establish it.

**Render.** 3.1–3.4 s in-page, of which about 3 s is compile and about 0.17 s is drawing. Deterministic.
