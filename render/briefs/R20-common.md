# Revision 20: brief (Claire's notes on cut 18, `viewers-notes-2.txt`; possibly the last revision)

The earlier briefs and `render/GUIDE.md` still apply. Cut 18 is committed in git (efa56a9), and
`out/film_cut18.mp4` is its film. `shots.json` is updated by `render/revise20_shots.py`:
- S02 runs to 5.2 (shift1 18) and S03 starts there (shift0 18);
- S06 is bar 13, and S07 returns at bar 14;
- S10 ends a beat early (shift1 -18), and S11 starts on 25.4 (shift0 -18).

HARD RULE: never write or quote the song's lyrics anywhere (replies, code, comments, file names,
notes). An API content filter kills any output that contains them.

Claire on cut 18: "it's so pretty oh my god. pretrain scene woahh, the climax space elevator
scene/solar sails scene is amazing. the final shelter pulse of light too." Keep everything she named.
She also said the final shelter visual is "almost entirely yours - you should continue ideating on
that." She withdrew her S19 note; S19 stays as is.

## Per agent

### L2: S01, S02 (sets/paper-card)
- **S01:** drop the spin; the cursor makes the motion now. Make the unfolding clearly two steps:
  the humans' cursor draws the starburst's outline first, ray by ray, as a thin line of light cut
  into the card, and the rays then fill with light and open.
- **S02:** it's now a beat longer (frames 155-316). The click's flash must land exactly on the bar-5
  kick (frame 299), flooding into the fly-through, which ends in the warm wash at 316. S03 dissolves
  from that frame (xin 9). Use the extra beat for subtler, more expressive cursor movement (a small
  hover and settle before typing, a tiny pause before the click).
- S33 stays bit-identical.

### T: S07 (new again, bar 14) and S03's new start
- **S07 (frames 947-1018):** one bar, cause and effect after S06's new GPU card. The new hardware
  becomes new layers:
  - it opens on a match to S06's rack (the old S07 had this: layer rows on the sled rows);
  - it pulls back to the stack growing a layer per beat, with arcs firing faster across the taller
    stack;
  - the bass stop at 14.4 (frame 1006) freezes it, like S04's 9.4 freeze;
  - the hard cut to the lab comes at bar 15.

  The old shots/S07.js is a starting point; rewrite it as you need.
- **S03** now starts at 5.2 (frame 317; its first beat went to S02). Check that its opening still
  reads with the 9-frame dissolve from S02's warm wash, and that the build to 9.1 is intact.

### O: S06, S23, S29
- **S06:** one bar (875-946), consistent with S16: the card slides in on beat 1 and the LEDs light
  on beat 3; the bass stop on 13.4 hushes it. End on a frame S07 can match (tell T the sled rows'
  screen y and the lit vents' x).
- **S23:**
  - Keep some separation between the satellites; don't let them overlap.
  - The pulse along the ring goes left to right, not centre-out, so it reads as an orbit.
- **S29:**
  - The white pulse inside the elevator's ribbon currently draws in front of the climber and
    payload; it must pass behind them.
  - The sails lighting up (the delay she likes) mirrors S23's satellites: a few, then more, then
    all at once, if there's time.

### D: S20, S36, the voyage
Claire: "S34 integrates the abstract physics into the environment well, but these are more off."
S34's band diagram is drawn on the ground in perspective, as part of the world.
- **S20:** map the contact map onto the funnel's surface itself. The grid is laid on the terraces
  or basin floor as painted lines in perspective, with cells lighting on the ground as residues
  touch, not as a panel on the wall.
- **S36** (Claire: "please ideate"). The lead's direction:
  - Draw the binding-energy curve on the ice shelf's surface in perspective, near the crowd, like
    S34's diagram.
  - Make the aurora readable as physics: faint dipole field lines arc through the sky and come down
    into the pole, the curtains hanging where they converge. The tokamak's helices then continue
    the same language. Keep it subtle; the aurora is beautiful as it is.
  - The last frame stays exact.
- **The voyage:** make Alpha Centauri A and B smaller, and let them wink (brief twinkles) instead
  of holding one shape and size. The lead re-renders S30.

### I: S27, S31 (and the final shelter)
- **S27:**
  - The elevator's blueprint lines draw in front of the Clawds, additive light over them.
  - Check that the lines-alone beat and the S29 match still hold.
- **S31:** Claire feels some lingering space, and suggested "Clawd emote (^^ would be cute) or human
  turning to Clawd". Do both, as one shared moment in the lingering stretch (bars 83-84):
  - the figure turns her head to Clawd;
  - Clawd looks up at her, and his eyes go to the happy arch (^^) and hold for a beat or two;
  - she leans back.
- **The final shelter, ideation (lead's direction):** the tree was Clawd's first living thing; the
  shelter should be full of life.
  - A few younger trees of the same kind on the far slopes, a flowering meadow on the near hill,
    and small flocks of birds crossing the sky on the phrase starts. Keep it gentle and uncluttered.
  - Optional, if time allows, as an A/B still only (don't replace anything): the habitat's land
    curving up overhead instead of the abstract ring, as in the Stanford torus paintings. A wide
    band of land with fields, water glints and tiny settlement lights rises from both horizons and
    arcs overhead. The vocal drop's light wave runs along it. The lead decides after seeing it.
- **Constraints:** S30→S31 and the S32 seam must hold; the lead re-renders S32.

### E2 (wave 2): S11, S15
- **S11** now starts on 25.4 (frame 1793), the vocal pickup. Claire:
  - "leave the cursor in frame for the slope scene (Clawd resets, but it doesn't, good way to show
    that)";
  - "arc back instead of loop as a reaction";
  - "after, having the cursor stay for a bit before fully leaving view shows some care";
  - "consider the intended message behind the movements and pauses".

  So: through Clawd's failed tries and resets the cursor stays put, watching, and is not reset with
  the episode. When he tops the ramp it arcs back, a small startled-then-pleased lean away. It
  lingers, then leaves slowly.
- **S10** ends a beat earlier (1163-1792); make sure its ending still reads.
- **S15:** Clawd appears backwards relative to how he spawns. Fix his facing.

### P (wave 2): S12's tail and S13
- **S13:** the humans' cursor should not appear suddenly. It swoops in quickly from below or the
  side as a transition, arriving so the first click still lands on 33.1. The swoop starts in S12's
  last half-beat (frames about 2297-2314): you may edit S12.js for this overlay only (E2 owns it but
  won't touch S12 this round).
- The S12→S13 continuity cut must still match (3.7 now).

### Lead
- **S21:** after the flash, keep a few bright highlights travelling along the plasma's helical
  field lines, rotating toroidally, so the plasma isn't static.
- Then all re-renders, assembly, checks, commit and push.

About 1.5-2 hours. Final clips, `_av` versions and sheets, NOTES, a 5-8 sentence final reply, and never
route around a denied command.
