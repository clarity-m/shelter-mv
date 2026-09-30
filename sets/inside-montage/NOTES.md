# sets/inside-montage (briefs H, R3-I, R4-R11)

**Rung 4's default is S18's painted-valley look** in `hillx.js` (the LOOK variant of `glslx.js`). Options include `look: 'luminous'`, `drift`, `night.js` and `salt` (R8). Rung 5 is unchanged since cut 4.

**R10 added `decals`**: the film's code lying in the world (`codeline.js`), perspective-correct and occluded.

**R11:**
- The rung-4 luminous Clawd is now the valley engine's crisp solid (Claire): flat #D97757, ink eye slots, and a darker side face swept along `uExt` (hillx derives it from the camera).
- `landShade` evaluates facet normals only within 75 m. A ray a hair below level made them NaN, blacking out the frame (test: `shots/_R11NaN.js`).

**S27 (R11: bars 71-72, 5051-5182, about 140 ms/frame):** the blueprint alone. The observatory is O's S26 again.
- About 2,100 Clawds draw `elevatorlines.js`, with the camera level:
  - 71.1-2: the anchor, tower and stays;
  - 71.3-4: the ribbon;
  - 72.1-2: the climber and sails.
- Code rows stream along the flat into the anchor.
- The foreground is a drafting table, kept clear. On it the force balance about GEO is drawn from 71.1, held through 72.2, and gone by 72.3:
  - the Earth's arc;
  - gravity and spin arrows;
  - the taper and the tension curve peaking at GEO;
  - GEO as S23's dotted ring;
  - the escape line;
  - the release arc and its payload.
- 5177-5182: the lines alone, within 1.4 px of `match_S29_lines.png` (p99).
- R19: the crowd stands back from the base (the ring from 6.8 m; no one overlapping the platform).

**S30 (R10):**
- Bars 77-79: two beats in, then two beats of D's voyage.
- The shelter's code rings the hill and runs along the ring.
- Bar 80 lands on S31 (1.4).

**Re-render** S27 if `elevatorlines.js` changes, and S30 if `voyage.js`, `shelter.js` or `S31.js` changes.
