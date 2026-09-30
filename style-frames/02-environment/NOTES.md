# 02 · Environment showcase

**What it is.** A golden-hour training valley made of voxel tiles. Clawd stands on its spawn tile at the centre of an island of colour: grass, flowers, trees, and a capsule pushing a cube to a flag. Everything not yet learned is grey placeholder: checker tiles, primitive trees, and walkers, ants and a hopper mid-task. Colour runs down the river toward a sunlit lake. Tiles subdivide with depth (1 → 1/8) until the far land is smooth, so the fidelity dial becomes distance. Episode walls, a faint grid and a sparse HUD provide the scaffolding.

**Technique.** One deterministic `frame.html`:
- WebGL2 raymarch (quadtree voxel DDA near, heightfield far, SDF agents, sphere-pile cumulus).
- A JS flow field drives ~175k curved brush ribbons sampling the underpainting.
- Paint amount follows the learned mask, so learned land and sky are painted while untouched grey stays clean CG. Capability shows as fidelity as well as colour.
- Bloom, god rays and grain, then Clawd drawn last and pixel-crisp.

Render: `python3 render.py frame.png "ss=2"`, ~15 s. It uses `--use-angle=vulkan` because the default D3D11 path takes about 2 min just to compile the shader.

**Works.** It reads in a second, the painted-vs-CG split is a bonus idea, and the palette is on brief.

**Weak.** The upper-right sky is empty, the right-hand grey terraces are busy, the layout is near-symmetric, and Clawd is small. The ripples and frontier glow are too subtle for a still.

**To animate.** Grow the bloom so tiles flip in waves (per-tile thresholds already exist), pose the agents, drift the clouds, and push in slowly. Strokes need fixed seeds with per-frame colour or they will boil. At ~15 s/frame, a 10 s shot takes ~75 min.

**Opinion.** Strong and legible. The risk is a Minecraft read; clean grey plus painterly learned land avoids it. The best drop shot is the bloom racing toward the camera.
