# S21's landing (revision 8, lead)

S21 (bar 65, frames 4619-4690) opens on the kick with the fusion core's lines flashing onto the paper
reactor. The core is the plasma ring (its circle and meridians), its twisted magnetic field (revision 12:
helical field lines on the torus surface, `helixEdges()`, Q 2, 6 lines) and the twelve coils: nothing else.
The column, cap, base and ports are the humans' build and never appear in light.

- `sets/paper-fusion/landing.js`: `coreLines()` gives 3352 segments (torus 280, merid 192, coil 1440, helix 1440)
  in screen px at S21's first frame (1920x1080, push 0); `coreEdges()` gives the same in model
  coordinates; `proj`, `CAM` and `FOCUS` are S21's camera. It imports `sets/inside-montage/reactor.js`.
- Bounding box of the lines: x 497-1438, y 173-804. Ring centre (the push's focus): (960, 478).
- References: `out/stills/S21_f4619.png` (S21's first frame, the lines flashing white on it) and
  `out/stills/landing_S21_marked.png` (the same with the lines drawn over it: ring cyan, meridians blue,
  coils green, helices magenta); `out/stills/landing_S21.json` holds the lines.

S36's last frame (4618) must put its ring and coils of light on these lines: within about 4 px, the
same camera elevation (19 degrees) and the same principal point (960, 470), so the hard cut on the
bar-65 kick reads as the drawing landing. Draw them through `reactorPlacement(...).cam(12)` in the
hill world, or project `coreEdges()` yourself; either way, check against the marked still.
