# paper-kit: the outside world (S06, S16, S23, S26, S29, S35) and the sail

**Engine and modules.**
- `kit.js` has opt-in `lpx` and `xs` (edge stencils); unflagged layers are bit-identical.
- `rack.js` gained `beatWave(T, f, lead)` (R19). `fleet3d.js` is unchanged (D's voyage uses it).
- `datacenter.js` is S35's aisle and campus (unchanged since R15).

**Revisions 19-20.**
- **S16:** the main pulse peaks on beats 1 and 3, with a faint echo on 2 and 4.
- **S26:** the slit slides open in one move.
- **S29:** an ignition bloom on 73.1; brighter lasers, 1.4x sails; the push accelerates to the cut;
  the ribbon's pulses pass behind the climber.

**Revision 21.**
- **S29:** the sails light on bar 76's triplet grid (local 228 + 6k), with the big groups and a
  brighter flash on the accents. The hero lights last (pushed earlier, it crosses the formation).

**Revision 22.**
- **S06** is bar 11 and reads its beats from its own range. The chord on beat 1 shows the rack; the
  cards seat and light on the beat-2 and beat-3 kicks; the beat-4 kick pulses through both, and the
  rack's cascade rides the kicks. No stop treatment. It settles over the last 10 frames, and the last
  frame is unchanged for S07 (MATCH.md).
- **S23:** 48 evenly spaced satellites; the bar-68 doublings stay scattered. On the bar-69 kick the
  rest light left to right, with the ring's line drawing behind them, at the pulse's speed. The
  pulse then carries on left to right, one lap a beat (`city.js` `lapAt`), entering the frame on
  each beat.

**Known issues.**
- S29 holds three GL contexts and S35 two.
