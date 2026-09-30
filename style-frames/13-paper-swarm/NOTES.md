# 13 · The swarm as a paper lantern (S32 to S33, ~3:31)

**What it is.** Alpha Centauri B held in three nested paper shells, like a carved puzzle ball. A dark open lattice with punched junction holes sits in front of a glowing vellum shell and a hotter inner one. A port on the view axis shows the star white-hot at the heart. A porthole shows the sim bubble (sunset, hill, tree) in a cupped cradle. Eleven uneven shafts form the spark. A, the faint Sun and a torn-tissue Milky Way complete the sky.

**Technique.** One WebGL2 file with one light-transport model:
- Shell masks over all directions (spherical Voronoi).
- The star as a disc, traced through the stacked masks.
- Single scattering along each line of sight.

Eleven round ports on shared axes line up through all the shells, and their sizes set each ray's width and length. Warm light is one scalar through the fixed ramp, which tops out at #FFF3E6. The render is deterministic.

**Works.**
- Reads in a second at 320x180.
- At 1:1: fibre in lit vellum, backlit edge glow, rims on cuts facing the star.
- The bubble is the only pastel.
- Warm light covers about 8% of the frame.

**Doesn't.**
- At full frame it reads as "glowing sphere" more than "photographed paper craft".
- The lattice can suggest a tortoiseshell.
- Faint leak rays blur the count of eleven.
- The core is a bit of a bullseye.

**Render.** 340 ms/frame for all passes on the MX150 in a persistent page, 140 ms when the swarm is static (`&bench=N`). The brief's screenshot command matches, but compiling on D3D11 takes ~3 min; use `--use-angle=vulkan`.

**Animating.** Every layer has a depth factor (`&camx=&camy=`, see `parallax-test.png`). Rotate the shells with the ports fixed and re-run mask and transport (~200 ms). For S33, widen the ports and the rays become the starburst.

**Opinion.** The strongest possible ending for this style: the lantern metaphor pays off literally. For the whole film it works only if the lab and city carry the paper through silhouettes, because space alone barely reads as paper. I'd still pick it over pixel.
