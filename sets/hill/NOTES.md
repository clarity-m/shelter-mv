# sets/hill: the hill and the shelter (inside, rungs 4-5)

**Shots.**
- S19 (r4): the floor swells into the hill; the tree blooms in bar 54.
- S24 (r4): six towers rise on the sung onsets.
- S31 (r5): the pair sit by the tree under the city and ring; the camera cranes; kicks pulse the windows; time freezes 6118-6130.

**Revision 1.**
- Clawd acts in S19/S24 through the sprite sheet's poses (`clawd-pose.js`, passed as `clawd.grid` + `dy`): the looks, blinks, startle, wonder, hops, a raised arm toward the tree and towers.
- S31, via `s31Anim(fe)` in `shelter.js`: Clawd blinks and twice glances up at her. She leans back on the 6002 phrase (`human.lean`). In bar 81, five tiny figures gather on the far ridge and three kites rise over the far slopes (`presence`).

**S30.** S31's opening view is unchanged (presence 0, lean 0, eyes open), so S30 needs no re-render.

**S32.** `S31_LAST` / `S31_LAST_SQUARE` now carry lean, eyes and presence, so re-render S32.

**Technique.** A generalised port of `10-world-ladder` (`scene.js`, `palettes.js`, `glsl.js`, `hill.js`). Scene elements are per-frame uniforms. Strokes (r4) and motes (r5) are world-anchored, so they don't boil. Clawd is a crisp, depth-tested 2D composite. Kites and people are depth-tested screen SDFs (`EXTRAS_FS`).

**Shelter API.** `createShelter(canvas, {log})` returns `.render({time, crane, cam, build, cityPulse, clawdGlow, figure, lean, eyes, presence})`, a pure function. `.hill.warm([5])` precompiles. `build` 0..1 assembles hill, tree, towers and ring. `cam` stays inside the dome (R 220 m); any aspect works.

**Page time, 1080p.** 0.1-0.3 s alone; 0.5-0.65 s with four agents rendering.

**Known issues.**
- Rungs 1-3 not ported.
- No strokes on the figure in r4.
- 1 spp.

**Test:** `shots/_HILL.js`.
