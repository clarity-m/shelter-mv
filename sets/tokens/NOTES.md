# tokens set: rung 0, the 1D token world (S03, S04, S07, S05)

**What.** Animated `01-pretrain` + `01b`: grey token horizon through a lens on Clawd; only
`"#d97757"` is warm. Ink eyes (#1c1413) that glance. Hook order (R22, final): S04, S06 (rack),
S07, S05.
- **S03 (5.2-8, xin 9):** S02's light collapses into him. From 7.1 the riser builds: tokens beside
  him swell (his cells stay 3 px), the batch lanes race, the line brightens, the sky darkens, the
  camera creeps; light converges on him when the riser cuts.
- **S04 (9-10):** a white bloom flash on 9.1; the line lifts into 6 layers in one clean camera move.
  Chops 611/620 fire up the whole stack; the last (725) fans up it before the hard cut.
- **S07 (12, xin 6; `s07.js`):** opens on the rack's rows (both lit cards warm), pulls back to a
  stack growing a layer per beat, arcs firing faster, into S05.
- **S05 (13-14, xin 6):** S07's last arcs gather into one arc from the stack's hub to the top-left;
  a bead rides it, landing (local 13) where the loss curve begins. The curve then falls in one
  sweep, readout ticking down, as the residue fades and the stack falls.
  Counters land on 131 072 / loss 2.8416 on the last frame.
- **No stop treatments (R22):** the bass stops (9.4, 13.4, 14.4) play straight through.

**Technique.** `world.js`: Canvas2D tokens, trails, layers, light, HUD; WebGL2 sky, field, halo,
ripples, reflections, glow, bloom, flash, grain, Clawd. `hook.js` shares S03-S04's cameras, lens,
flash and lanes.

**Page ms/frame (1080p, shared GPU).** S04 244, S07 366, S05 177.

**Known issues.** Re-render S03 once S02 is final: its xin reads S02's live last frame, and the
step counter now ends at 1018, so its tiny HUD numbers shift slightly.
