# sets/fields: S34, the chip (bars 58-60)

**Revision 14.** The land is the silicon crystal's periodic potential: an egg-crate of wells, one under each die of the grid. It is coloured by the potential like a painted density map: deep teal wells, teal-green, then gold crests, with fine contours circling each well (`glsl.js` `latColor`, `uStrokePal` 3). The relief is in the shading (`latNormal`, `latAmp` 2.4); the ground itself is a flat plane to the horizon. There is no painted die layout and there are no props; the chips exist only as light, each in its own well.
- The structure and timing are unchanged: the cursors paint the land in, write their lines, and press the seed (72); the chip spreads in light (74-128); the crowd lights the columns (144-215).
- Clawd watches from a well's floor (deep teal).
- The crowd arrives with one hop each, then stands still with arms up.
- The last frame lands exactly on S35's paper chip (overlay: every line on its twin).

**Technique.**
- `die.js`: the grid and die-local coordinates.
- `chipmatch.js`: `solveCamera` and `unproject` for O's lines.
- `groundtext.js`: code lying on the ground.
- The old wafer painting (`dieColor`, `uStrokePal` 2) is kept but unused.

**Page ms/frame (1080p):** 201.

**Cuts:** S25b→S34 73.1 (hard); S34→S35 41.3, where the chip lands exactly and only the colours differ.

**Tools:** `shots/_P34.js`.
