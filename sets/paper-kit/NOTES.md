# paper-kit: the outside world (S06, S16, S23, S26, S29, S35) and the sail

**Engine and modules.**
- `kit.js` has opt-in `lpx` and `xs` (edge stencils); unflagged layers are bit-identical.
- `rack.js` gained `beatWave(T, f, lead)` (R19). `fleet3d.js` is unchanged (D's voyage uses it).
- `datacenter.js` is S35's aisle and campus (unchanged since R15).

**Revisions 19-21.**
- **S16:** the main pulse peaks on beats 1 and 3. **S26:** the slit slides open in one move.
- **S29:** an ignition bloom on 73.1; the push accelerates to the cut; the sails light on bar 76's
  triplet grid (local 228 + 6k), with big groups on the accents; the hero lights last.

**Revision 22.**
- **S06** is bar 11 and reads its beats from its own range. The chord on beat 1 shows the rack; the
  cards seat and light on the beat-2 and beat-3 kicks; the beat-4 kick pulses through both, and the
  rack's cascade rides the kicks. No stop treatment. It settles over the last 10 frames, and the last
  frame is unchanged for S07 (MATCH.md).
- **S23:** on the bar-69 kick the rest of the satellites light left to right, the ring's line drawing
  behind them at the pulse's speed. The pulse carries on the same way, one lap a beat (`lapAt`).

**Revision 23.**
- **S35:** the pull-out is one continuous move, steady in log scale (a power of ten every 12.7
  frames, with no beat steps). It eases in from the landing and eases out into the campus hold,
  resting by about local 65. The first and last frames are cut 21's.

**Known issues.**
- S29 holds three GL contexts and S35 two.
