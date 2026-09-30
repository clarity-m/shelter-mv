# Revision 22: brief (Claire's `viewers-notes-4.txt` on cut 20)

The earlier briefs and `render/GUIDE.md` still apply. Cut 20 is committed in git (7120f8a), and
`out/film_cut20.mp4` is its film (the same as `out/film.mp4` until the lead re-assembles).

HARD RULE: never write or quote the song's lyrics anywhere (replies, code, comments, file names,
notes). An API content filter kills any output that contains them.

## How to read her notes (new, from Claire)
"i'll write notes in terms of intent, unless it's a musical timing thing, where i'll write specific
instructions and rationale." Treat every visual note as intent: find the change that best delivers
it, even when that differs from her wording. Follow timing notes exactly as written. Two of this
round's notes (S01, S31) undo an over-literal reading of her last notes, so re-read the intent.

## shots.json (done: `render/revise22_shots.py`)
Claire picked the alternate hook-1 order from the A/B. The hook is now:

| Shot | Bars | Frames | Entry |
|---|---|---|---|
| S04 | 9-10 | 587-730 | |
| S06 | 11 | 731-802 | hard cut |
| S07 | 12 | 803-874 | xin 6 |
| S05 | 13-14 | 875-1018 | xin 6 |
| S08 | 15-16 | 1019-1162 | hard cut |

The bar-11 beats are 731 (1), 749 (2), 767 (3) and 785 (4). The bass stops are 9.4 (about 641),
13.4 (about 929) and 14.4 (about 1001).

## The cursor's language (for everyone who draws a cursor)
Claire noticed that S11 is the only place the cursor tilts, which reads as inconsistent. Her S19
note is that stop-start motion reads as stutter.
- The cursor keeps a constant angle.
- It moves in eased glides; gentle curves are fine (S13's swoop and S18's sweeps curve).
- It holds only where the story needs a hold. A hold keeps the gentle idle hover, so the cursor is
  never frozen.
- Emotion comes from translation and timing, never rotation. Upward reads as delight or surprise.
  Straight right, away from Clawd, can read as fear.

## Per agent

### L2: S01
Claire: "ideally, the cursor draws the outline, the paper folds in after".
- Across her three notes on S01, the humans' cursor is the maker. Keep cut 18/20's segmented,
  fan-by-fan rhythm on the chops, which she loves.
- In each segment, the cursor's tip visibly draws the rays' outlines. The line of light exists only
  where the tip has passed, like a pen.
- Then the paper folds in to fill what was drawn. This is a real paper fold (the flap swings in
  about its crease and lands, with its light arriving as it lands), not a fill fading up.
- Draw, then fold, segment by segment. One strong shape: the cursor draws in the frames before a
  chop and the fold lands on the chop, so the hit is the fold. You know the timing; pick what reads.
- Keep the cursor at a constant angle, moving in smooth, confident strokes.
- The S01→S02 seam must hold (0.7 now), and S33 stays bit-identical.

### T: the hook in its new order (S04, S07, S05)
1. Claire: "remove freeze frame/slow-mo beat drops, since they interrupt the flow (they're present
   in the first attention arcs scene, and the loss curve)".
   - At every bass stop in the hook (9.4 in S04; 13.4 and 14.4 in S05), there is no freeze, no
     slow motion and no hush.
   - The motion runs straight through at full speed.
   - If any other hook shot still has a stop treatment, remove it there too.
   - S04's snap-back jump at 659 will disappear. That's expected.
2. Claire: "the lead-in to the loss curve should be adjusted (the attention arc that begins the
   curve), since the preceding frame is different".
   - S05 now follows S07 (the taller stack, arcs firing faster), not S04.
   - Grow the curve's lead-in out of S07's actual last frame, so the 6-frame dissolve and the next
     beat read as one motion. For example, the stack's arcs gather into the one arc that becomes
     the curve.
   - The alternate order is final, so drop the other order's branch if that simplifies the code.
3. S04 now hard-cuts to S06's rack at bar 11. Make sure it ends cleanly there; it used to lead into
   S05's arc.

### O: S06 and S23
1. **S06** is one bar at bar 11 (731-802). Claire's timing note, to follow exactly: "gpu slots should
   go in on beat 2 and 3, rather than 1 and 3, since the music in this bar effectively *sounds*
   like chord-kick-kick-kick this would flow better".
   - Beat 1 (the chord) shows the rack.
   - Card 1 slides in and lights on the beat-2 kick (749); card 2 on the beat-3 kick (767).
   - The beat-4 kick (785) can pulse through both cards.
   - No hush or freeze.
   - The last frame must still match S07's opening (T's layer rows on the sled rows). If the final
     composition moves, tell the lead so T can follow.
2. **S23.** Claire: "satellites light up sides->center, but flash left->right, which feels
   inconsistent". Her R20 note asked for the pulse to run left to right so the ring reads as an
   orbit. Make the ring travel one way:
   - on the bar-69 kick, the remaining satellites light left to right, sweeping along the arch;
   - the ring's line draws left to right with them;
   - the pulse then carries on left to right.

   The bar-68 doublings can stay scattered, since they aren't a direction. Keep the separation she
   liked.

### P: S19
Claire: "cursor pauses a few times, the motion seems stuttered. arcing along a parabola could make
motion more natural, but no other cursor scenes have parabolic motion, so it could feel
inconsistent."
- Make the humans' cursor move in one fluid line. Merge the stops into a continuous path whose
  velocity carries through the waypoints: an ease-in at the start and an ease-out at the end.
- A gently curving glide is consistent with S13 and S18; a ballistic parabola would be new.
- Hold only where the story needs it (the moment before the copy, for instance), with the idle
  hover.
- Keep the beat syncs and the S18→S19 and S19→S20 seams.

### I: S31
Claire: "earlier, the motion of the eyes was smoother. also, since this style is vectorized, the ^^
can be smaller to fit the actual eye size. this is overcorrected, sorry, again this is on me, i was
too specific".
- The intent is a soft, natural shared moment. He blinks, looks up at her, smiles (^^), looks
  back, and blinks.
- Each motion is eased and continuous, like cut 19's eyes, rather than stepped poses. Compare
  `out/film_cut19.mp4` and `out/film_cut20.mp4` around 5900-6050.
- The ^^ is the size of his actual eyes in this vector style: each eye becomes a small arch within
  the open eye's footprint, drawn in the vector style, not the large canonical cells.
- Keep the birds' exit, the bonsai and the rest.
- The S30→S31 and S31→S32 seams must hold. The lead re-renders S32 if its first frames change.

### Lead
- S11: the cursor keeps its angle; the startled-then-pleased reaction is a rise upward that settles.
- shots.json, re-renders, assembly, checks, commit and push.

About an hour. Deliver final clips, `_av` versions and sheets, and NOTES. End with a 5-8 sentence final
reply. Never route around a denied command.
