# Revision 4: shared brief (Claire's notes on cut 4)

`R3-common.md` still applies: the rules, ownership style, permissions and working
method. This file lists what changed.

HARD RULE: never write or quote the song's lyrics anywhere.

## Claire's notes on cut 4

1. **The hand-off (S18).** "The cursor should hover, then drop and fall, Clawd
   catches it, or a similar sequence to reinforce that the tool is being given
   freely."
2. **The look (rung 4).** She pointed at S18's painted valley
   (`out/stills/ref_R4_claire_painted_valley.png`, taken from S18) and at the
   final environment (`out/stills/ref_R4_claire_final_env.png`, S31), and said:
   "This style looks amazing. Use it in place of the painted style; it also
   provides a smoother transition to the final environment." So S19, S20, S22,
   S24, S25 and S25c (shots.json marks them `"look": "painted-valley"`) take S18's
   painted-valley look in place of the hazy luminous paint.
   - For the comparison, see `out/stills/ref_R4_S18_2.png` (the target look) and
     `out/stills/ref_R4_S19_old_1.png` (the look being replaced).
   - Rung 5 (S27's night beats, S30, S31, S32) is unchanged.
3. **Timing and pacing come first this round.** "Take away a bar from the first lab
   scene to give to the physics scene (a scene where Clawd tries the steeper slope
   and succeeds?)." The shot list now has S08 at bars 17-19 (3 bars), S10 at 20-25,
   and S11 at 26-30 (5 bars).

## Who does what

| Agent | Work |
|---|---|
| P | S18: the hover, let-go, fall and catch. S18's last beats settle into the restyled S19's opening. |
| D | S08 at 3 bars (its last frame stays identical: S10 opens on it). S20: tighter drafting, so the lab beat holds about 2 s. |
| I | The rung-4 restyle in the hill renderers. Re-render S22, S24, S25 and S25c. Put S24's towers back in S25 and S25c for continuity. Publish S19's new opening early. |
| E2 | S10 moved to bars 20-25; S11 at bars 26-30 with the steep-ramp success. |
| lead | shots.json, the docs, and the final coordinated renders (S19, S20, S23 and S27 after the others land), then assembly. |

Shots whose first frames dissolve out of a neighbour's last frame (xin) read that
neighbour live at render time: S19 reads S18, and S23 reads S22. The lead does their
final renders after both sides are final.

Budget: about 2-3 hours each. Four agents share the GPU.
