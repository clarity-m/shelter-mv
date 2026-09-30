# paper-card: the bookend card (S01, S02, S33's card half)

**What.** Black card over a lamp-lit tissue. The hole is Clawd's heart square (72 px), eleven ray flaps (`lib/spark.js`) and Clawd's cells. Each flap is hinged at its far end and swings back, so the light runs outward.

**S01.** The square lights on chop 0 (frame 11). The humans' indigo paper cursor glides in from bottom right and pulls one fan open per chop (30, 44, 84, 106): the fold's free edge rides its tip, the other rays follow, then spring open. It withdraws across the turning, glinting burst by 146.

**S02 (the pretraining command).** Bar 3 and the fly-through are as before. In bar 4 the humans' cursor returns (227-234, in PAPER.dusk so it reads on black card) and types `train(corpus)`:
- One letter per keystroke is cut into the card below Clawd's shape (235-276, on the chops), each along its strokes in 2.6 frames, with a flash. Warm light and kerf light show through.
- On 281 the click: the light surges through Clawd and the letters, and the cursor rides the card as the camera flies through, gone before the card plane.

**Technique.**
- A WebGL2 pass computes the hole's SDF and each pixel's flap, with kerf light, rims and the glint; a half-res hole pass gives the air glow and the shafts.
- The cursor (`st.cursor`, opt-in) is a polygon SDF, composited after the card's rotation blur with jittered shutter samples, and shades the hole pass.
- The letters (`st.letters`, opt-in) are stroke-font capsules (`type.js`: monospace, stencil bridges so no card floats) added to the hole SDF.
- Without these, every program is the original.

**Checks.** Bit-identical against the old code: S01 30, 106 and 150; S02 155, 226 and 298; S33 6480 and 6520. S01→S02 is 2.7 and S02→S03 is 1.1.

**Page time.** S01 175 ms/frame; S02 59 ms.

**Known issues.** The eyes are card islands. Flap thickness is not drawn.
