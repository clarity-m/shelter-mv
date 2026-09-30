# tokens set: rung 0, the 1D token world (S03, S04, S05, S07)

**What.** Animated `01-pretrain` + `01b`: a grey horizon of tokens through a lens on Clawd; only
`"#d97757"` is warm. Ink eyes (#1c1413) that glance.
- **S03 (5.2-8, xin 9):** S02's light collapses into him. From 7.1 the riser builds: tokens beside
  him swell (his cells stay 3 px), the batch lanes race, the line brightens, the sky darkens, the
  camera creeps; light converges on him after the riser cuts (8.4). R20: the arrival is keyed to
  the shot start (317), the build to global frames (unchanged from R19).
- **S04 (9-10):** a white bloom flash on 9.1; the line lifts into 6 layers in one clean camera move.
  Chops 611/620 fire up the whole stack. R21: the 9.4 stop is a held breath (16% speed, dimmed and
  greyed, never an exact freeze), snapping back bright on 10.1 (`breathS04` in `hook.js`).
- **S05 (xin 6):** keyed to its own start; it opens on the previous shot's last frame (S04 in the
  main order, 11-12; S07 in the alternate, 13-14); the layers fall, the loss curve sweeps down.
  Stops inside it (alternate 13.4, 14.4) are breaths that step the loss down; else it settles.
- **S07 (alternate order, bar 12; `s07.js`):** opens on the rack's rows (both lit cards warm), pulls
  back to a stack growing a layer per beat, arcs firing faster, into S05. Unused in the
  main order.

**Technique.** `world.js`: Canvas2D tokens, trails, layers, light, HUD; WebGL2 sky,
field, halo, ripples, reflections, glow, bloom, flash, grain, Clawd.
`hook.js` shares cameras, lens, flash, stack and lanes.

**Page ms/frame (1080p, shared GPU).** S03 269, S04 277, S05 194.

**Known issues.** Re-render S03 once S02 is final (its xin reads S02's live last frame).
A/B stills: out/stills/AB_*.
