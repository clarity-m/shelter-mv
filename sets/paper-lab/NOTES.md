# paper-lab set (S08; S20's coda)

`paper.js` is the engine; `scenes.js` holds scenes and rigs. Shots: `S08.js` and the end of `S20.js`.

**Engine.** A hand port of `style-frames/11-paper-lab/frame.html`: 2.5D camera, posed layers, dust, box-coverage Clawd, warm fill, and `kind: 2` (the pixel screen).

**Opt-in additions (R3).**
- `createPaper(..., {ext: true})` adds layer `kind: 3`, which shows `st.ext.canvas`, exact at 1:1. The original shaders are untouched.
- `sceneLab({screen: 'ext', cursor: false})`.
- `pose.A.lean` (0..1) bends A forward.
- `pose.A.mouse = false` with `HAND_LAP` rests her hand in her lap.

**S08 (R5: the hook, bars 15-16, 144 frames; hard cut from S06).**
- The glow breathes on the kicks and swells on the chops, and the dolly runs at twice its old speed.
- The cursor makes three small moves on the chops, then eases away as the push begins (85).
- The push and the fill run on the four-bar cut's clock. The fill completes on the drop-out (131), then creeps.
- Last frame 1162 equals the old 1450 bit for bit; S08→S10 is 6.3.

**S20's coda (R8: the build before it is in `sets/door/NOTES.md`).**
- The pull-back runs 132-160 and starts pixel-exact on the inside frame.
- The lab holds about 1.8 s: the knot glowing on the monitor, A leaning in (146-206), B turning (160-210).
- The inside world goes toward night through `inside-montage/night.js`, which keeps the Clawds exact.

**Measured.** Page time on the shared GPU:
- S08: 0.36 s;
- S20: see sets/door/NOTES.md.

**Known issues.** Clawds on the lab screen are about 30 px and filtered.

**Left.** Nothing required.
