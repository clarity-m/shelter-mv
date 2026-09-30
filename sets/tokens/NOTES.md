# tokens set: rung 0, the 1D token world (S03, S04, S05, S07)

**What.** Animated `01-pretrain` + `01b`: a gray horizon of tokenizer output flowing through a
fisheye on Clawd (tokens 1.7x 01b). Invented corpus (`corpus.js`); only `"#d97757"` is warm.
- **S03:** S02's peach light (xin 9) collapses into him; chops light tokens with arcs to him.
- **S04:** on the drop the line lifts into 6 layers; chops fire attention heads, the layer set by
  pitch. The stop (646-655) holds the frame.
- **S05 (xin 6):** opens as S04's last frame; the layers fall into the line on the downbeat and
  a loss curve sweeps down to him. In the last beat the curve settles onto the horizon and the
  layers begin to lift again.
- **S07 (xin 9):** match dissolve from S06: six layer rows sit on the rack's sled rows (y 170..770),
  his warm column on the lit vents, then a pull-back; the stack grows to 12, one layer per beat.
  Frames 1148-1162 (mix dropout) are frozen near-black; the HUD reads 131 072 / 2.8416.

**Light on the music (`pulse.js`).** Every beat sends a ripple out of him along the line and up the
stack, scaled by the kick envelope (faint in intro B). Downbeats ignite the attention bundle:
beads race out along the arcs; beads run down the loss curve on beats. The halo breathes with the
bass. No full-frame flashes.

**Technique.** `world.js`: Canvas2D band (luminance + column tint) with JS IIR trails, a layer atlas,
light layer, HUD; WebGL2 does sky, weight-matrix field, halo, ripples, reflections,
glow, 11 rays, bloom and grain, then stamps Clawd #D97757.

**Page ms/frame (1080p, shared GPU).** S03 367, S04 394, S05 449, S07 474.

**Known issues.** Fast odometer digits are gray drums. S06.js is untouched: S07 matches it.
