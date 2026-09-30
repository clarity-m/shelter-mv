# paper-card: the bookend card (S01, S02, S33's card half)

**What.** Black card over a lamp-lit tissue. The hole is Clawd's heart square (72 px), eleven ray flaps (`lib/spark.js`) and Clawd's cells. Each flap is hinged at its far end and swings back, so the light runs outward.

**S01.** The square lights on chop 0 (frame 11). The humans' indigo paper cursor glides in from bottom right and pulls one fan open per chop (30, 44, 84, 106): the fold's free edge rides its tip, the other rays follow, then spring open. It withdraws across the turning, glinting burst by 146.

**S02 (the pretraining command).** Bar 3 and the fly-through are as before. In bar 4 the humans' cursor returns to Clawd's shape (227-234) and types `train(corpus)` in the humans' code panel, the same as S13's (`sets/valley/papercursor.js` `panel`, read only, drawn by `shots/S02.js` over the card render at S13's size and offset from the tip, from `st.panel`):
- One character per keystroke (235-276, on the chops and the snare), with the caret.
- The click on 281 flashes the panel and surges the light through Clawd; the panel folds away and the cursor rides the card off.

**Technique.**
- A WebGL2 pass computes the hole's SDF and each pixel's flap, with kerf light, rims and the glint; a half-res hole pass gives the air glow and the shafts.
- The cursor (`st.cursor`, opt-in) is a polygon SDF composited after the rotation blur; it shades the hole pass.
- Without these, every program is the original.

**Checks.** `card.js` is unchanged. Bit-identical against the pre-command code: S01 30, 106 and 150; S02 155, 200, 226 and 298. S01→S02 is 2.7 and S02→S03 is 1.1.

**Page time.** S01 0.18 s/frame; S02 0.14 s.

**Known issues.** The eyes are card islands. Flap thickness is not drawn.
