# sets/door: S20 and S36 (R11-R24, agent D)

**Solid Clawds (R23).** `hillx-fix.js` `loadHillxDoor(log, { icy, solid })` patches the hill
engine (read only): with `state.solidClawds`, each Clawd is S34's extruded solid (clawd3d.js,
depth 4) facing `c.yaw` in the world, with 4x MSAA and a depth buffer. His distance goes to a
second layer, so ribbons, lines and decals pass in front of him or hide behind him. The land
hides him only when nearer than his middle: slopes never cut his legs.

**S20, bars 53-56: the folding funnel (288 frames from 3755, hard cut from S19).**
- Cursors paint the grey hill in (5-22), coloured by height.
- Brisk beads (33, 44, 55); the chain spirals down the funnel (`Kat`, 74-186).
- Contact map (`CM_*`): 15 x 15 on the far-right terraces, lit as chain segments touch.
- Clawds face between the lens's side and their work (the chain, then the knot), turning to
  the lens for the happy hop; the lab screen shows the same solids. The 2D code and names hide
  behind nearer Clawds (`clawdShield`).

**S36, 62.2-64: a polar sea under the aurora (198 frames from 4421).**
- Time warp: old t*72/54 for local t < 54, t + 18 after (times below are old).
- Three-beat paint-in; horizon 130 px lower; the sun pressed into a torus.
- The binding energy curve lies on the ice before the crowd, with ground text (40-118); faint
  dipole field lines loop from the pole into the curtains.
- Clawds face the lens as the world is painted, then turn a quarter toward the sun. Beams
  carry no code (R24: the cursors hook).
- Helices, then the D-coils; the last frame is exact (median 1.0 px on S21).

**Cuts.** S19→S20 54.7 (hard); S20→S25b 16.6; S35→S36 32.6; S36→S21 20.0.
