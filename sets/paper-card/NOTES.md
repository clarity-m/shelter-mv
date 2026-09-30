# paper-card: the bookend card (S01, S02, S33's card half)

**What.** Black card over a lamp-lit tissue. The hole is Clawd's heart square (72 px), eleven ray flaps (`lib/spark.js`) and Clawd's cells, each flap hinged at its far end.

**S01 (cut 18's unfold; R21, Claire: "just slightly delay the fill in").** The square lights on chop 0 (11). The humans' paper cursor pulls the rays open fan by fan on the chops (30, 44, 84, 106), each fan's rays following three frames apart.
- **The delay.** Each ray's outline is cut first: a thin line of light traced round it in three frames, standing alone for seven before its fill pours in behind the dragged fold.
- The card no longer spins (R20). The cursor is the lighter dusk slate with a cool edge, so it reads on the black card.

**S02 (155-316).** Bar 3 folds the rays shut from the top as Clawd's cells ripple open. In bar 4 the cursor comes back, hovers and settles (227-253), and types `train(corpus)` (253-289, keys on the chops at 253, 271 and 289). It lifts a moment, then clicks on the bar-5 kick (299). The burst floods the frame through the fly-through into the warm wash at 316, which S03 dissolves from.

**Technique.** WebGL2 passes: the hole's SDF and flaps, the air glow and shafts, the cursor. Opt-in passes add to the warm scalar: `st.kerf` (the outlines; also a fill glow and a pen, unused now) and `st.burst` (R19). `st.rotC` sets Clawd's frame, `st.vig` the vignette. Without these, every program is the original.

**Checks.** S02 (155-316) and S33 (6350-6520) are bit-identical to cut 19. S01→S02 is 0.7 and S02→S03 is 1.1. The glitch scan flags 301-304: the flood, one monotonic sweep.

**Page time.** S01 0.09 s/frame; S02 0.17 s (shared GPU).
