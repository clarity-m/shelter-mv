# paper-kit: the outside world (S06, S16, S23, S26, S29, S35) and the sail

**Engine and modules.**
- `kit.js` has opt-in `lpx` and `xs` (edge stencils); unflagged layers are bit-identical.
- `rack.js` gained `beatWave(T, f, lead)` (R19). `fleet3d.js` is unchanged (D's voyage uses it).
- `datacenter.js` is S35's aisle and campus (unchanged since R15).

**Revision 19 (Claire's notes on cut 17).**
- **S06 and S16:** the main pulse lands on beats 1 and 3 (a faint echo on 2 and 4), each wave starting
  early so its peak falls on the beat; S16's rows light on 1 and 3.
- **S23:** the satellites are brighter, flare and then twinkle; the closed ring glows.
- **S26:** the slit slides open in one move (local 3-50).
- **S29:**
  - an ignition bloom peaks on 73.1 (frame 5195), and the star trails start on it;
  - the lasers have a white-hot core in a warm halo;
  - the sails are 1.4x (via `sailMesh`'s `side`), screen-blended;
  - the push accelerates to the cut, and the camera follows at 30%.

**Revision 20.**
- **S06:** one bar. The card slides into bay A on beat 1, its vents light on 3, and the stop on
  13.4 hushes it. The last frame (946) is still. Its rows and lit vents are in MATCH.md for T's S07,
  and T's rows already sit on them.
- **S23:** 48 satellites, spaced evenly by arc length, about 60 px apart. The ring's pulse crosses
  it left to right, one beat per crossing.
- **S29:**
  - the ribbon's pulses pass behind the climber;
  - the sails light in three waves (3, then 12, then all on 76.2), each pushed from when it lights.

**Known issues.**
- S29 holds three GL contexts and S35 two.
