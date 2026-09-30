# 02b · Environment, low-poly

**What it is.** The 02 valley rebuilt as flat-shaded triangles throughout: land, water, trees, agents and clouds. Tessellation density is capability. Learned land is split finer, coloured and painted. Untouched land stays coarse grey facets with a clean wireframe. Clawd (144 px, 2x before) stands on a green knoll at the left third, against a cloud-shadowed plain so the orange pops. Colour runs down an S-shaped river toward the sun. A faceted cumulus fills the upper right, and the right side is plain grey.

**Technique.** JS builds a jittered strip triangulation and splits triangles 1-to-4, up to three times, by the learned field. Shared edges stay flat where a neighbour is coarser, so nothing cracks. WebGL2 rasterizes with three shadow cascades, a mirror reflection and 2x supersampling. Learned facets are painted in the shader with short strokes that follow each facet's slope and stop at its edges. Screen-space brush ribbons paint only the sky and clouds.

**Works.** Learned versus untouched reads instantly, and nothing clashes. Values run 0.11-0.94 (1st-99th percentile). Clawd is the clear focal point.

**Doesn't.** Sun glare swallows the lake. The grey fields are inert. The facet brushwork is subtle at 1080p. The push-the-cube task is too small to read.

**Render time.** About 15 s in-page (20 s wall): meshes 1-2 s, GPU about 1 s, JS sky strokes about 11.5 s. For 3-5 s: build meshes once per shot, move strokes to shaders (instanced, fixed seeds), and reuse one Chrome instance. That should give about 1-2 s per frame.

**To animate.** Facets subdivide and flip to paint in waves from Clawd; the split scheme already blends heights. Clouds drift and the camera pushes in. Facet strokes need facet-anchored coordinates or they will swim.

**Opinion.** Strongest environment language so far. The painted facets and golden-hour grade keep it from reading as generic low-poly.

## v2

**Changes.** Files: `frame-v2.html`, `render-v2.py`, `v2-pass1-4.png`, `frame-v2.png`. The v1 files are untouched.

- **Clawd is 3D.** The 18x5 glyph is extruded into a solid: pixels 1:2, 4 pixel-widths deep, hard edges, no bevels, eye holes punched through. Albedo is #D97757, lit by the scene key, sky fill and per-vertex AO (under the arms, between the legs, inside the eyes). He has contact occlusion at the feet and a real cast shadow. He is never painted, and glow, motes and grain are kept off his pixels. An orange bounce and a halo sit around him.
- **Scale.** He is 0.75 units tall, about 97 px wide on screen (v1 was 144). A new tree beside him is about three times his height. He holds focus through colour (the only orange), light (a warm pool and halo on the crown), a darker patch of ground behind his head, and the tree framing him.
- **Clouds.** The heavy tower is gone. There is one low, softly faceted cumulus bank on the right, fewer small clouds, and thin faceted cirrus up high. Shadow colours are lighter and the light ramp is wider.

**Caveat.** The scene is backlit, so his camera-facing side gets no direct sun. A warm bounce from the sunlit crown and glowing spawn plate keeps it terracotta rather than brown. That bounce is a deliberate cheat.

**Weak.** At 97 px the extrusion depth and AO are subtle. The sun glare still competes with him.

**Render time.** About the same as v1, roughly 16 s in-page; Clawd adds 328 triangles.
