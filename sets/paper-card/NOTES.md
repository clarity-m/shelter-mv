# paper-card: the bookend card (S01, S02, S33's card half)

**What.** Black card over a lamp-lit tissue. The hole is Clawd's heart square (72 px), eleven ray flaps (`lib/spark.js`) and Clawd's cells, each flap hinged at its far end.

**S01 (R22; Claire: "the cursor draws the outline, the paper folds in after").** The square lights on chop 0 (11).
- **The pen.** The humans' cursor draws the outline with its tip in one steady stroke, clockwise from the top (20-138), leaving light only where the tip has passed; its angle never changes.
- **The folds.** Behind the pen the paper folds in fan by fan (the top ray, then 4, 3 and 3 rays): each fan's flaps swing in about their creases, accelerating, and land on a chop (44, 84, 116, 147) with a flash.
- The cursor lifts out between the top rays by 153. No spin.

**S02 (155-316).** Bar 3 folds the rays shut from the top as Clawd's cells ripple open. In bar 4 the cursor comes back, hovers and settles (227-253), and types `train(corpus)` (keys on the chops, 253-289). It lifts a moment, then clicks on the bar-5 kick (299). The burst floods the frame through the fly-through into the warm wash at 316, which S03 dissolves from.

**Technique.** WebGL2 passes: the hole's SDF and flaps, the air glow and shafts, the cursor. Opt-in passes add to the warm scalar: `st.kerf` (the outline, the pen and the landing flash) and `st.burst` (R19). `st.rotC` sets Clawd's frame, `st.vig` the vignette. Without these, every program is the original.

**Checks.** S02 (155-316) and S33 (6350-6520) are bit-identical to cut 20. S01→S02 is 0.7 and S02→S03 is 1.1. The glitch scan flags 301-304: the flood, one monotonic sweep.

**Page time.** S01 0.06 s/frame; S02 0.17 s (shared GPU).
