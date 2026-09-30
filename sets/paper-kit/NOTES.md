# paper-kit: the outside world (S06, S16, S23, S25b, S26, S29, S35) and the sail

**Engine and modules.**
- `kit.js` has two opt-in layer params: `lpx` (R13, edges in the layer's own pixels) and `xs`
  (R14, an explicit edge stencil). Unflagged layers are bit-identical.
- Also: `sail.js`, `burn.js`, `smear.js`, `sky2d.js`, `fleet3d.js`, `elevator*.js`.
- `hall.js`: the card (`drawCard`) and the die's floorplan.
- `datacenter.js`: S35's aisle (S16's bays from rack.js, reused exactly, with an end row and the
  card) and its campus (the die's floorplan as data halls).

**S35 (R15: 4331-4420, 90 frames to 62.2; about 110 ms/frame).**
- Local 0-47 are R14's exactly: frame 0 is bit-identical, and the log-zoom schedule is identical
  through 47.
  - The landing is done by local 14.
  - The bays enter as a tunnel book (17-23) and the lit hall holds a beat (25-31).
  - Through the roof (29-34); the full campus is in frame by 47.
- The hold is now 42 frames:
  - R14's settle continues as a cubic (value and slope matched), resting on 89;
  - the wave front keeps R14's path to 47, then slows toward the far edge, so the outer halls and
    the generator ring light through about 78;
  - the power lines then pulse outward, and the glow swells to the end.
- There are no tunnel gaps (each bay carries the nearer bays' paper); the far bays draw at up to 7x.
- Checks:
  - the die lines are within 6e-12 px;
  - S34→S35 is exact on the lines (41.3, P's new palette);
  - S35→S36 is 35.1 (against D's pre-R15 S36).

**Known issues.**
- S29 holds three GL contexts and S35 two.
- S26's shaft is a drawn fan.
- The entering near bays read as mildly out of focus, by design.
