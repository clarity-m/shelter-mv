# Revision 4, brief E2: the early environments re-timed (S10, S11)

Read, in this order:
1. `render/GUIDE.md`;
2. `render/briefs/R3-common.md` (rules, permissions, working method);
3. `render/briefs/R4-common.md`;
4. this brief.

Then read `sets/early-env/NOTES.md`, `shots/S10.js`, `shots/S11.js` and
`sets/early-env/*.js`.

You own:
- `sets/early-env/*`;
- `shots/S10.js`, `shots/S11.js`;
- `shots/S12.js` (only if its opening needs a touch);
- your outputs.

Claire says the first part of the film, up to the 3D worlds, is close to final and
flows well: keep everything she liked. The pixel world's fails, resets, the paper
cursor's one block, the physics ramp and the cursor dragging its handle all stay.
This is a timing change plus one new story beat.

## Why

The lab (S08) gives one bar to the physics scene. Claire's idea for that bar: "a
scene where Clawd tries the steeper slope and succeeds". Help first, then
independence. That is the story in miniature: people help Clawd learn until Clawd
can do it alone. Later, at the midpoint, they hand Clawd the cursor itself.

## S10: now bars 20-25, frames 1379-1810 (432 frames; it was 21-26)

It is the same length, one bar earlier. S08 (agent D) now ends at bar 19 with the
same last frame as before: the push through the paper screen onto the glyph in the
warm peach field. S10 must still open on exactly that frame and pull back as now.

Re-time the beats to the music at the new position:
- The sung verse runs to bar 24.
- **Bar 25 is where the kick drops out:** pre-chorus 1a, "the first real breath".
  Let the +1 and Clawd's look up, wave and sit land there. A success followed by
  the music breathing is good.
- The rest of the order stays: two failed episodes with resets on downbeats; the
  sit; the indigo cursor coming down, one line of code, one block on a beat; the
  hop across to the flag.

## S11: now bars 26-30, frames 1811-2170 (360 frames; it was 27-30)

The music:
- 26-28 are still pre-chorus 1a: no kick, sustained bass, low vocal.
- The **bar-29 downbeat brings the snare back**, and the vocal climbs.
- The drums cut out at the end of bar 30, and S12's white field follows.

Suggested beats (refine freely):
1. **Bar 26:** Clawd climbs the 34-degree ramp, slips and slides back to its foot.
2. **Bar 27:** the paper cursor takes the handle and eases the ramp to 26 degrees,
   leaving the dashed ghost and the readout as now. It lets go and lifts away.
3. **Bar 28:** Clawd goes again and makes the plateau quietly (no drums yet). Then
   the steep ramp is back: the ghost re-solidifies to 34 degrees, or a steeper
   ramp stands beside it, so it reads as "try the hard one".
   - Optional: the cursor starts to come down to help again, but Clawd is already
     going, so it stops and withdraws. That foreshadows the hand-off.
4. **Bar 29 downbeat (the snare returns):** Clawd makes the steep ramp on his own:
   the triumphant beat.
5. **Then the environments flick past on the backbeat snares** as now, each more
   saturated. The last is the ladder's hill, where he stops on the last snare
   before the drums cut out.

   Three flicks may be too many after bar 29's success. Two is fine if three
   crowds it.

## Checks

- `python3 render/cuts.py S08 S10 S11 S12`:
  - S08 → S10 must stay near 6.2 (continuity). D keeps S08's last frame
    identical; if yours drifts, tell me.
  - S11 → S12 is a hard cut.
- Contact sheets; final `out/shots/S10.mp4`, `S11.mp4` plus `_av`.
- Update `sets/early-env/NOTES.md`.
- Final reply, 5-8 sentences: the beats, the cuts, page times, anything the lead
  must re-render.

Budget: about 2 hours.
