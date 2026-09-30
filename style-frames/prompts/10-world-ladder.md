## YOUR FRAME. Your folder: 10-world-ladder

Round 3 decisions, made by the director after comparing styles:
- Pixel art won for the early phase. See ../09-style-pixel/frame.png.
- Humans are low-detail and FACELESS: hair, silhouette, posture, hands, no facial features. Emotion comes through pose and light.
- In 3D environments, Clawd is his glyph extruded into a solid: crisp edges, recessed eyes, #D97757.
- The video's visual arc is a fidelity ladder shared by Clawd and the world. The in-story justification: we see the world at the fidelity of Claude's world model, so the picture sharpens as he learns. Clawd's own ladder already exists; read ../05-clawd-sprites/ladder.png, NOTES.md and clawd-sprites.js.

The world's five rungs:
1. PIXEL: 480x270 native scaled 4x, a 16-32 color palette, like ../09-style-pixel.
2. VECTOR: flat clean shapes, crisp lines, limited palette. A calmer cousin of ../07-style-ligne-claire, still with faceless humans.
3. DIMENSION: low-poly 3D like ../02b-environment-poly, with Clawd extruded into a 3D solid.
4. LUMINOUS: painterly, with bloom and brushstrokes, like ../04-swarm and the painted regions of ../02-environment.
5. LIGHT: the world dissolving into light and particles; Clawd as the spark.

Your task: render ONE simple shot at all five rungs, so the director can judge whether the ladder reads as one film. The shot: dusk on a small hill inside a training environment. Clawd stands at the crest. There is one tree, and a faceless human figure sits nearby watching him. A sky with a few clouds, and a faint environment boundary grid.

Use the same camera, composition and light direction in all five, so only the rung changes. Clawd's rung matches the world's in each: glyph, 2x pixel, vector, extruded/luminous, spark. Color = capability still applies, so saturation rises rung by rung.

Deliverables:
- rung1.png ... rung5.png (1920x1080 each)
- ladder-strip.png (all five side by side)
- the source
- NOTES.md, including ideas for the on-screen transition between each pair of adjacent rungs (for example resolution doubling, extrusion, or paint bleeding in) and the render time per rung
