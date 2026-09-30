# sets/hill: the hill and the shelter (inside, rungs 4-5)

**Shots.** S31 (r5): the pair sit by the tree under the city and ring; the camera cranes; kicks pulse the windows; time freezes 6118-6130.

**Revision 1:** sprite-sheet poses for Clawd (`clawd-pose.js`, `clawd.grid` + `dy`); `s31Anim(fe)`: her lean on 6002 and the far ridge's people and kites (`presence`).

**S30** lands on S31's first frame (presence 0, lean 0, eyes open, no figure, no wave).

**S32.** `S31_LAST` / `S31_LAST_SQUARE` carry lean, eyes and presence; S32's seam renders S31's frame 6130: re-render S32 if it changes.

**R19:** SKYLINE adds 44 mid-rise blocks (64 towers max, here and in hillx). `waveT` (frames since 81.1) sends a warm wave from the pair (`uWave`): towers flash, the ring brightens. Unset or 0 changes nothing.

**R20:**
- `s31Anim` gains the shared moment (`turn`: her head to Clawd).
- The wave wakes the shelter: cloud-pruned garden pines (`youngTrees`, niwaki SDFs in the extras pass) and S31's birds. No meadow (Claire).
- `ringLand` (A/B only, `shots/_R20TORUS.js`) swaps the ring for the habitat's land.

**R22:** eased eyes: blink 5922, look up 5938-5946, ^^ 5953-5997, look back 5999-6009, blink 6036. `eyes.arch` (0..1, `uEye.w`) morphs each eye into a small vector arch within its footprint.

**Technique.** A port of `10-world-ladder`. Scene elements are per-frame uniforms; strokes and motes are world-anchored; Clawd is a crisp 2D composite; kites, people and young trees are depth-tested screen SDFs (`EXTRAS_FS`).

**Shelter API.** `createShelter(canvas, {log})` returns `.render({time, crane, cam, build, cityPulse, clawdGlow, figure, lean, eyes, presence})`, a pure function. `.hill.warm([5])` precompiles. `build` 0..1 assembles hill, tree, towers and ring. `cam` stays inside the dome (R 220 m); any aspect works.

**Page time, 1080p:** 0.1-0.3 s (0.5-0.65 s under load).

**Known issues:** rungs 1-3 not ported; no strokes on the figure in r4; 1 spp.

**Test:** `shots/_HILL.js`.
