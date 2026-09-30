# paper-swarm: the swarm around Alpha Centauri B (S32, S33's swarm half)

**Revision 2 (Claire: the lantern's shape was unclear; use 04b pass 1's).** The swarm is now crossing orbital bands around the star, in the paper world's texture:
- four near-coplanar flat bands and one steep ring (the hero's);
- each band is a tilted annulus hit exactly per pixel (true pinhole camera);
- the bands carry warm vellum chips in ringlets and knots, the wheel habitats (lit paper rings with warm windows and pastel hubs) riding in rows among them, and rare hot glints sweeping along each band as it orbits;
- far arcs show lit faces, near arcs warm backs;
- loose collectors and a hot corona round the star; A, the faint Sun and the Milky Way stay.

**Spark.** The style frame's transport is kept. Light escapes only along the eleven lanes of `lib/spark.js` (per-lane veils set the uneven lengths), so there are exactly eleven shafts. They now rise from the star itself, matching the card spark in S33.

**S32.** Z (the hero plane's magnification) runs log-scale from about 4436 to 1, with a Beta-shaped speed and a dip at the wheel. The sequence: bubble, hero wheel, a thick stream of wheels round the hero the band narrowing to a glittering arc, the rings resolving, the icon (S33's first frame). The look-at point drifts to the star only below 8×, so the band stays in frame. The haze comes up as the rings resolve. The seam (`sets/inside-montage/seam.js`) still sees a 1240 px bubble, centred, same lens; the grade ramp is unchanged.

**Page time.** S32 607, S33 454 ms/frame on a shared GPU (S32 peaks in its dense band stage, slightly over budget).

**Known issues.** The haze stays orthographic in the star's frame.
