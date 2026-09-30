## YOUR FRAME. Your folder: 02b-environment-poly

A REVISION of 02-environment. Start by copying ../02-environment/frame.html and render.py into your folder, then read ../02-environment/NOTES.md. Note that render.py uses --use-angle=vulkan, because the default D3D11 path takes minutes to compile the shader.

The main change: replace ALL voxel and cube terrain with LOW-POLY faceted terrain: flat-shaded triangles, one consistent geometry language from the foreground to the horizon. The blocky foreground clashed with the smooth polygonal background and read as Minecraft. Keep everything else that worked:
- The best idea: learned regions are painted and saturated, while untouched regions stay clean gray CG.
- Color running down the river to the lake.
- The golden-hour sky and palette.
- The geometric agents: capsules, cubes, ants, walkers, hopper.
- The episode walls, faint grid and HUD.

A suggested mapping: tessellation density is capability, so learned land gets finer facets and paint, while unlearned land stays coarse gray facets.

Also fix the weaknesses the first agent noted: make Clawd larger and more prominent as the focal point, calm the busy right side, break the near-symmetric layout, and fill the empty upper-right sky. Keep the value range full (strong contrast).
