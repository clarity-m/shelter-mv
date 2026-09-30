# tokens set: rung 0, the 1D token world (S03, S04, S07, S05)

**What.** Animated `01-pretrain` + `01b`: grey token horizon through a lens on Clawd; only
`"#d97757"` is warm. Ink eyes (#1c1413). Hook order (R22, final): S04, S06 (rack), S07, S05.
- **S03 (5.2-8, xin 9):** S02's light collapses into him. From 7.1 the riser builds: tokens beside
  him swell (his cells stay 3 px), the batch lanes race, the line brightens, the sky darkens, the
  camera creeps; light converges on him when the riser cuts.
- **S04 (9-10):** a white bloom flash on 9.1; the line lifts into 6 layers in one clean camera move.
  Chops 611/620 fire up the whole stack; the last (725) fans up it before the hard cut.
- **S07 (12, xin 6; `s07.js`):** opens on the rack's rows (both lit cards warm), pulls back to a
  stack growing a layer per beat, arcs firing faster.
- **S05 (13-14, xin 6):** S07's last arcs gather into five faint, fine lanes converging on the loss
  curve's start (R23); a small bead rides each, landing together (local 13). The curve then falls
  in one sweep as the lanes fade and the stack falls.
  Counters land on 131 072 / loss 2.8416 on the last frame.
- **No stop treatments (R22):** the bass stops (9.4, 13.4, 14.4) play straight through.
- **No corner HUD (R23):** the STEP / LOSS readout is gone; S05's counters and curve readout stay
  (`hud.js` unused).

**Technique.** `world.js`: Canvas2D tokens, trails, layers, light; WebGL2 sky, field, halo,
ripples, reflections, glow, bloom, flash, grain, Clawd. `hook.js` shares S03-S04's cameras, lens,
flash and lanes.

**Page ms/frame (1080p, contended GPU).** S03 238, S04 362, S07 352, S05 261.

**Known issues.** Re-render S03 whenever S02 changes (xin reads the live last frame), S05 whenever
S07 does.
