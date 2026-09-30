# paper-kit: the outside world (S06, S16, S23, S26, S29, S35) and the sail

**Engine and modules.**
- `kit.js` has opt-in `lpx` and `xs` (edge stencils); unflagged layers are bit-identical.
- `rack.js` gained `beatWave(T, f, lead)` (R19). `fleet3d.js` is unchanged (D's voyage uses it).
- `datacenter.js` is S35's aisle and campus (unchanged since R15).

**Revision 19 (Claire's notes on cut 17).**
- **S06 and S16:** the main pulse lands on beats 1 and 3, a faint echo on 2 and 4. Waves peak a
  few frames in, so each starts early (S16 by 4 frames, S06 by 5), and peaks now fall on the beat.
  S16's per-beat highlight is 0.15 / 0.04 / 0.18 / 0.08. S16's rows light on 1 (left) and 3 (right).
- **S23:** the satellites are 45% larger and brighter, flare and then twinkle; the closed ring
  glows, and a glint runs out from its middle on every beat.
- **S26:** the slit slides open in one smootherstep move (local 3-50), not a notch per chop.
- **S29:**
  - an ignition bloom peaks on 73.1 (frame 5195), and the star trails start on it;
  - the lasers have a white-hot core in a warm halo;
  - the sails are 1.4x (via `sailMesh`'s `side`), screen-blended;
  - the push accelerates to the cut, and the camera follows at 30%.
- **Cuts:** S27→S29 is 45.9 (landing unchanged), S29→S30 106.6, S23→S26 19.6, S26→S27 16.2.

**Known issues.**
- S29 holds three GL contexts and S35 two.
