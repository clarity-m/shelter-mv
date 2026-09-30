# sets/hill: the hill and the shelter (inside, rungs 4-5)

**Shots.** S31 (r5): the pair by the tree under the city and ring; a crane; kicks pulse the windows; time freezes 6118-6130.

**R1:** Clawd's sprite poses (`clawd-pose.js`); `s31Anim(fe)`: her lean (6002), far people and kites (`presence`).

**S30** lands on S31's first frame (no figure or wave; world light 1).

**S32.** `S31_LAST` / `S31_LAST_SQUARE` carry lean, eyes and presence; S32's seam renders S31's frame 6130: re-render S32 if it changes.

**R19:** 64 towers max (also hillx). `waveT` (frames since 81.1): a warm wave from the pair (`uWave`), towers flashing; unset or 0 changes nothing.

**R20:**
- `s31Anim` gains the shared moment (`turn`: her head to Clawd).
- The wave wakes cloud-pruned pines (`youngTrees`, niwaki SDFs in `EXTRAS_FS`); birds; no meadow (Claire).
- `ringLand`: A/B only (`_R20TORUS.js`).

**R22:** eased eyes: blink 5922, look up 5938-5946, ^^ 5953-5997, look back 5999-6009, blink 6036. `eyes.arch` (0..1, `uEye.w`) morphs each eye into a small vector arch.

**R23 (Claire):** `worldLight` (S31 1; S30 eases it in as he sits) swaps the radiant form's 2D rays and halo for light in the world (`clawdlight.js`, shared with hillx): a pool on the grass and her, with her soft shadow (`uCLit`), and a depth-aware glow in the air she shadows (`volPass`). Pines: clumpy shaded pads, rimmed bark, contact shadows, greens hazing with distance. `hill.figureMask()` marks her pixels for S31's forming outline.

**Technique.** Per-frame uniforms; world-anchored strokes and motes; Clawd a crisp 2D composite; kites, people and pines depth-tested screen SDFs (`EXTRAS_FS`).

**Shelter API.** `createShelter(canvas, {log}).render({time, crane, cam, build, ...})` is pure (keys in shelter.js); `.hill.warm([5])` precompiles; `cam` stays inside the dome (R 220 m).

**Page time:** 0.3-0.45 s at 1080p.

**Known issues:** rungs 1-3 not ported; no strokes on the figure in r4; 1 spp.

**Test:** `shots/_HILL.js`.
