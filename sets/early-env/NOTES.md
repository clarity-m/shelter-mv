# early-env: rungs 1-2 (S10, S11, S12)

**S10, pixel, bars 17-25.** It opens on S08's last frame (cut 6.3). Bar 17: a 42-frame pull-back eases out of the held match frame. Bar 18 (voice alone): he looks around and walks left, bumping `STEP` (a two-tile step) on the bar's one kick. Bar 19: he hops onto it on the downbeat, hops off toward the gap (landing on the beat-4 kick) and peers in. Bar 20: he eyes the flag; from his hop at frame 266 this is Revision 4's S10 (`clawdR4` on `fo = fl - 216`). HUD steps count from bar 17.

**Alternate, opt-in (`shots/_S10scroll.js` = `makeS10({ scroll: true })`).** A side-scroller camera: `createGridworld`'s `ext` widens the world 64 px left, and `st.cam` (whole native px) eases up to 53 px after him while he explores, back to 0 by frame 204. Default output is pixel-identical; so are the alternate's first frame and everything from 204 on. Clip: `out/shots/_S10scroll.mp4`.

**S11, vector, bars 26-30.** Bar 26: he slips on the 34° ramp. Bar 27: the cursor drags it to 26°. Bar 28: he makes the plateau quietly, and a new episode springs the ramp back to 34°. The cursor starts down, brakes as he sets off, withdraws. He tops the steep ramp on the bar-29 snare; the camera rises and pans with him (`drawRamp`'s optional `cam`). Pier, then hill, on the backbeat snares; he stops on 2153, matching S12.

**S12** is unchanged (hand-off to S13: 3.7).

**Page ms/frame (1080p):** S10 39, S11 50-79, S12 92.

**Known issues.**
- Over the dark pit the cursor reads by its warm edge.
- Clawd jumps at the pixel-to-vector cut (48.5).
- The hill's palette is pushed 12% past the ladder's.
- The bump's sparks barely show.

**Left.** Nothing.
