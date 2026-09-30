# paper-kit: the outside world (S06, S16, S23, S26, S29, S35) and the sail

**Engine and modules.**
- `kit.js` has opt-in `lpx` and `xs` (edge stencils); unflagged layers are bit-identical.
- `rack.js` gained `beatWave(T, f, lead)` (R19). `fleet3d.js` is unchanged (D's voyage uses it).
- `datacenter.js` is S35's aisle and campus (unchanged since R15).

**Revision 19.**
- **S06 and S16:** the main pulse peaks on beats 1 and 3, with a faint echo on 2 and 4.
- **S23:** the satellites flare, then twinkle; the closed ring glows.
- **S26:** the slit slides open in one move.
- **S29:** an ignition bloom on 73.1; brighter lasers, 1.4x sails; the push accelerates to the cut.

**Revision 20.**
- **S23:** 48 evenly spaced satellites; the ring's pulse crosses left to right.
- **S29:** the ribbon's pulses pass behind the climber.

**Revision 21.**
- **S06** reads its bars, beats and stops from its own range, so it works at any length. Card 1
  seats and lights on beat 1, and card 2 on beat 3. In a second bar both cards pulse with the rack
  on 1 and 3, and the stops hush them. At one bar (the A/B's bar 11) it settles to rest with both
  cards lit, for S07 (MATCH.md).
- **S29:** the sails light on bar 76's triplet grid (local 228 + 6k), in groups of 3, 1, 2 / 8, 3,
  4 / 20, 7, 9 / 64, 10, 10. The accented steps get the big groups and a brighter flash, and every
  group is in view. The dozen sails out of view and the hero light on the last accent (pushed
  earlier, the hero would cross the formation).

**Known issues.**
- S29 holds three GL contexts and S35 two.
