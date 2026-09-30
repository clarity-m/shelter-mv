# 07 ligne claire: the harness

**What it is.** A dusk lab. A green enamel lamp drops a flat cream beam onto a bench. There sits the harness: two cupped hands of finger-ribs, four per side, curling over tiny pixel Clawd. One finger still lies on the bench, waiting to be fitted. Researcher A, elbow braced, adjusts a rib collar with a stylus and steadies the disc with her other hand. B stands back at a cart holding a mug, where a gray gridworld waits beside a rising eval curve.

**Technique.** One Canvas2D HTML file. The architecture and props are cm geometry in one-point perspective, and the figures are hand-authored Catmull-Rom contours. Ink lines are uniform and each surface has two flat tones. The scene is drawn at dusk, re-drawn lamp-lit offscreen, and composited through the beam hull. A's lit layer also passes through a disc around Clawd, whose glow lights her face. Clawd is stamped last on the pixel grid. Renders are deterministic: 0.1–0.5 s of drawing per 1080p frame, far under budget.

**Works.** It reads in one second: beam, cupped fingers, orange. The value range is full. The two-hands harness is the shelter motif as engineering. detail.png and detail-b.png show the humans holding up at 2x: warm profiles, a pencil grip, a beard and glasses.

**Doesn't.** The cabinet makes the lower third heavy. Clawd's glow on A is a lighting cheat. The faces are competent, not masterful; profiles only, and 3/4 views would need traced reference. The beam's inner core is a two-step tone.

**Animating it.** The camera is free, and a pull-back can reveal the room as the container. Poses need keyframed, lerpable contours. Candidates: the collar click, the steam, the ticking curve.

**Opinion.** The most legible, authored direction yet. Its risk is coldness; its tenderness comes entirely from lighting design.
