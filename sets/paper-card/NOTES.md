# paper-card: the bookend card (S01, S02, S33's card half)

**What.** Black card over a lamp-lit tissue. The hole is Clawd's heart square (72 px), eleven ray flaps (`lib/spark.js`) and Clawd's cells, each flap hinged at its far end.

**S01.** The square lights on chop 0 (frame 11). The humans' paper cursor pulls one fan of rays open per chop (30, 44, 84, 106), then withdraws by 146.

**S02 (the pretraining command).** Bar 3 as before. In bar 4 the cursor returns to Clawd's shape (227-234) and types `train(corpus)` in S13's code panel (`sets/valley/papercursor.js`, read only), one keystroke per character (235-276).
- **The click is a burst of light (R19; Claire: "a burst of light that transitions into S03 on click").** On 281 a white-hot flash at the cursor's tip. A front of light runs out through Clawd's shape and across the black card, which glows through like lit tissue. The frame floods white while the camera flies through (282-288), then settles into the warm wash by 298.
- The cursor and panel stay put and dissolve into the light (the panel lit peach). The vignette lifts while the frame is white.

**Technique.** WebGL2 passes: the hole's SDF and flaps, the air glow and shafts, the cursor (`st.cursor`). `st.burst` (R19) adds the burst to the warm scalar in Clawd's card frame (sharing the ramp and bloom), with the tissue's fibre, so the flood becomes the wash; `st.vig` sets the vignette. Without these, every program is the original.

**Checks.** Bit-identical to cut 17: S01 30, 106 and 150; S02 155, 200, 226, 250, 276, 280 and 298; S33 6380, 6450 and 6500. S01→S02 is 2.7 and S02→S03 is 1.1. The glitch scan flags 283-286: the flood, one monotonic sweep.

**Page time.** S01 0.18 s/frame; S02 0.11 s.
