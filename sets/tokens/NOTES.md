# tokens set: rung 0, the 1D token world (S03, S04, S05, S07)

**What.** Animated `01-pretrain` + `01b`: a grey horizon of tokens through a lens on Clawd; only
`"#d97757"` is warm. Ink eyes (#1c1413) that glance.
- **S03 (5.2-8, xin 9):** S02's light collapses into him. From 7.1 the riser builds: tokens beside
  him swell (his cells stay 3 px), the batch lanes race, the line brightens, the sky darkens, the
  camera creeps; light converges on him after the riser cuts (8.4). R20: the arrival is keyed to
  the shot start (317), the build to global frames (unchanged from R19).
- **S04 (9-10):** a white bloom flash on 9.1; the line lifts into 6 layers in one clean camera move.
  Chops 611/620 fire up the whole stack. The stop (646-655) holds.
- **S05 (11-12, xin 6):** opens on S04's last frame; the layers fall into the line; the loss
  curve sweeps down to him.
- **S07 (14, R20):** opens on S06's last frame (O's MATCH.md): six layer rows on the rack's rows
  (121.2 px apart), the lit card's row warm, the empty bay's row dark until beat 1's eighth,
  and his column under the vents (x 981.5), at zoom 1. A pull-back closes the rows into a stack
  that grows a layer per beat to nine, with heads firing up the stack on every beat and chop.
  The 14.4 stop freezes it to the cut on STEP 131 072 (the style frame).

**Technique.** `world.js`: Canvas2D tokens, trails, layers, light, HUD; WebGL2 sky,
field, halo, ripples, reflections, glow, bloom, flash, grain, Clawd.
`hook.js` shares cameras, lens, flash, stack and lanes.

**Page ms/frame (1080p, shared GPU).** S03 269, S04 306, S05 194, S07 403.

**Known issues.** Re-render S03 once S02 is final (its xin reads S02's live last frame).
