# tokens set: rung 0, the 1D token world (S03, S04, S05)

**What.** Animated `01-pretrain` + `01b`: grey horizon of tokenizer output through a lens
on Clawd. Invented corpus (`corpus.js`); only `"#d97757"` is warm. Clawd has ink eyes (#1c1413)
and acts with them: glances at lit tokens, arcs, curve and counters; blinks.
- **S03 (5-8, xin 9):** S02's light collapses into him; bars 5-6 read at a steady pace. From 7.1
  the riser builds: the lens swells the tokens beside him (cap ~35 to ~50 px; his cells stay
  3 px), the batch lanes race, the line brightens, the sky darkens and the camera creeps along the
  line. When the riser cuts on 8.4, light converges on him from both edges, arriving on 9.1.
- **S04 (9-10):** 9.1 is a white bloom flash out of him along the line. In it the line lifts into
  6 layers (8 frames) and the camera pulls back and tilts up in one 16-frame move. Chops 611 and
  620 fire heads up the whole stack onto one token column; later chops fire two layers. Arcs are
  brighter and bloom where they land. The stop (646-655) holds.
- **S05 (11-12, xin 6):** opens on S04's last frame; the layers fall into the line, and a
  brighter loss curve sweeps down to him beside brighter odometers.

**Technique.** `world.js`: Canvas2D token band with IIR trails, layer atlas, light layer and HUD;
WebGL2 sky, weight-matrix field, halo, ripples (outward, and inward for the gather),
reflections, glow, 11 rays, bloom, flash and grain, then Clawd and his eyes. `hook.js` holds the
shared cameras, lens, flash, stack and lane scroll, keeping S03-S05 continuous.

**Page ms/frame (1080p, shared GPU).** S03 198, S04 287, S05 208.

**Known issues.** Fast odometer digits are grey drums. S03 needs a re-render after S02 changes.
