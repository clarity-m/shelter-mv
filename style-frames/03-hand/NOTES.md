# 03 - The hand

**What it is.** A cupped right hand (lab-coat sleeve), seen from above and to the thumb side, backlit by a low golden-hour window sun. Pixel Clawd stands in the palm, lighting the cup orange as sparks drift up. Behind, a blurred monitor shows the gray gridworld with its orange agent (sim-to-real).

**Technique.** One deterministic HTML file (seeded PRNG), about 50 s per render at 2x supersampling on the UHD 620.
- **Hand:** a raymarched SDF rig. Fingers are chains of tapered round-cones driven by joint angles; the palm is a metacarpal fan plus thumb and hypothenar pads. The shader does anime cel work: banded key light, crevice tone, banded Clawd glow, blush, creases, nail decals. Ink comes from depth, normal and material edges; rim and bounce light are fixed-width screen-space bands.
- **Background:** a Canvas2D underpainting, blurred for depth of field, overpainted with 42k color-sampled bristle strokes.
- **Finish:** bloom, god rays, grade and grain. Clawd is drawn last on integer cells.

**What works.** The three layers read instantly: a clean cel hand, a painted room, crisp Clawd. The anatomy holds up (four fingers and a thumb, creases, a clear thumbnail), and the warm glow carries the tone.

**What doesn't.** Up close, the hand reads as 3D toon, not hand-drawn: round cross-sections, uniform line weight, no knuckle detail. Fingernails only show as crescents from this angle. A flat #D97757 Clawd can't be the brightest thing in a bright scene, so its glow has to come from darker, orange-lit surroundings. The cup reads as gentle holding more than a closed shelter.

**Animating it.** Every parameter is exposed (finger flex, camera, sun, Clawd). Render the background once per shot, with strokes seeded per shot, and the hand per frame. Candidates: a push-in, fingers closing slightly, a breathing glow.

**Code-drawn humans.** Viable for hands at mid-shot. Hero close-ups want traced reference poses and line tapering. I would not attempt faces without reference.
