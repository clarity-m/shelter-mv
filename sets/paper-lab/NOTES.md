# paper-lab set (S08; S20's coda)

`paper.js` is the engine, `scenes.js` holds the scenes and rigs, and `people.js` (R19) the two researchers. Shots: `S08.js` and the end of `S20.js`.

**Engine.** A hand port of `style-frames/11-paper-lab/frame.html` (2.5D camera, posed layers, dust, Clawd, warm fill, pixel screen); opt-in `ext` shows an external canvas at 1:1 (S20).

**The researchers (R19; Claire: "try finding and tracing over a reference").** Faceless backlit card silhouettes traced from Pexels photos (any reference is fine for this non-commercial film):
- **B** stands in profile with a mug. Outline from 30033728; 7.6 heads; forearm 1.1 heads. `pose.B.turn` turns him toward the screen: the head comes round and nods (0-0.45), the upper body inclines (0.3-0.8), and the mug comes down to his waist, forearm level (0.4-1; after 5061274).
- **A** sits on a lab stool. Torso line and posture from 7679592 (mirrored); 7.5 heads; hip 80°, knees 76°/67°, feet on the ring. She reaches up to the mouse (S08) or rests a hand on her thigh (coda). `pose.A.lean`: a 0.36 rad hip hinge with the spine extending, so the chest leads (6803531). Her head moves forward and lifts, and her hand slides to drape over her knee (6995881).
- Each layer draws from its key's rounded pose (restart-safe).

**S08 (bars 15-16).** As before; B makes only the head part of the turn (0.45). Last frame 1162 is bit-identical to cut 17; S08→S10 is 6.3.

**S20's coda.** The pull-back runs 204-232, pixel-exact at its first frame. A leans in (218-278) and B turns (232-282), with the whole turn and the mug lowered.

**Measured.** S08: 0.11 s/frame of page time. S20 lab stills: about 0.9 s, first-frame setup included (see sets/door/NOTES.md).

**Known issues.** Clawds on the lab screen are about 30 px and filtered.

**Left.** The lead re-renders S20.
