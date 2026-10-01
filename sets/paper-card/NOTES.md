# paper-card: the bookend card (S01, S02, S33's card half)

**What.** Black card over a lamp-lit tissue; the hole is Clawd's heart square, eleven ray flaps (`lib/spark.js`, hinged at their tips) and his cells.

**S01 (R22; Claire: "the cursor draws the outline, the paper folds in after").** The square lights on chop 0 (11).
- **The pen.** The humans' cursor draws the outline with its tip in one continuous stroke, clockwise from the top (20-140), leaving light only where the tip has passed; its angle never changes.
- **Its pace (R23).** A hand's: quick on the straight edges, braking into the tips and V corners, surging on the beats (larger for bigger fans); each fan's pace is solved so its last corner lands 7 frames before its chop.
- **The folds (R24).** Ray by ray, like S33's close: each flap lands 7 frames after the pen closes its outline; each fan's last ray (0, 4, 7, 10) lands on its chop (44, 84, 116, 147) with the full flash, the rest softer.
- The cursor lifts out between the top rays by 153.

**S02 (155-316).** Bar 3 folds the rays shut as Clawd's cells ripple open. In bar 4 the cursor hovers, settles and types `train(corpus)` on the chops, then clicks on the bar-5 kick (299): the burst floods the fly-through into the warm wash at 316, which S03 dissolves from.

**Technique.** WebGL2: the hole's SDF and flaps, air glow, shafts, the cursor; opt-in passes `st.kerf` (outline, pen, landing flash) and `st.burst`, plus `st.rotC` and `st.vig`. Without them every program is the original.

**Checks.** S02 (155-316) and S33 (6350-6520) are bit-identical to cut 22. S01→S02 is 0.7, S02→S03 1.1. The glitch scan flags 301-304: the flood, one monotonic sweep.

**Page time.** S01 0.09 s/frame; S02 0.17 s (shared GPU).
