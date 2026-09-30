# paper-card: the bookend card (S01, S02, S33's card half)

**What.** Black card over a lamp-lit tissue. The hole is Clawd's heart square (72 px), eleven ray flaps (`lib/spark.js`) and Clawd's cells, each flap hinged at its far end.

**S01 (R20; Claire: the spin is unnecessary now; "make it clear the cursor draws the outline, and it's later filled in").** The square lights on chop 0 (11).
- **The outline.** The humans' paper cursor comes in from the bottom right and draws the starburst's outline ray by ray, clockwise (30-108). It leaves a thin line of light cut into the card, with a spark at the pen that flares on the chops. It lets go where it began and leaves (116-144).
- **The fill.** From the chop at 116, the rays fill with light in a clockwise wave from the top (the paper glowing through), and their flaps swing open (123-151).

**S02 (155-316).** Bar 3 folds the rays shut from the top as Clawd's cells ripple open. In bar 4 the cursor comes back, hovers and settles (227-253), and types `train(corpus)` (253-289, keys on the chops at 253, 271 and 289). It lifts a moment, then clicks on the bar-5 kick (299). The burst floods the frame through the fly-through into the warm wash at 316, which S03 dissolves from.

**Technique.** WebGL2 passes: the hole's SDF and flaps, the air glow and shafts, the cursor. Opt-in passes add to the warm scalar: `st.kerf` (R20: outline, fill, pen) and `st.burst` (R19). `st.rotC` sets Clawd's frame, `st.vig` the vignette. Without these, every program is the original.

**Checks.** S33 is bit-identical (6350-6520). S01→S02 is 0.7 and S02→S03 is 1.1. The glitch scan flags 301-304: the flood, one monotonic sweep.

**Page time.** S01 0.09 s/frame; S02 0.17 s (shared GPU).
