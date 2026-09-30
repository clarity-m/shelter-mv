# Revision 23: brief (Claire's notes on cut 21)

The earlier briefs and `render/GUIDE.md` still apply, including R22's note on reading Claire (visual notes
are intent; timing notes are exact) and its cursor language. Cut 21 is committed (ac867f3), and
`out/film_cut21.mp4` is its film.

HARD RULE: never write or quote the song's lyrics anywhere (replies, code, comments, file names,
notes). An API content filter kills any output that contains them.

Claire also asked whether anything else can be improved. The lead is reviewing the whole film and
may send follow-ups.

## Per agent

### L2: S01
Claire: "this is a good synthesis! could speed up/slow down the rate of the cursor drawing to match
beat and unfolding shape".
- The pen currently runs at an even ~55 px/frame. Let its speed breathe:
  - quick along the long straight edges, easing into the tips and corners, as a hand draws;
  - its rhythm locked to the music, landing each fan's last corner just before its fold hits the
    chop;
  - accents on the beats, sized to how much of each fan there is to draw.
- Keep the one continuous stroke, the constant angle, the folds on the chops (44, 84, 116, 147),
  the S01→S02 seam, and S33 bit-identical.

### T: S07→S05
Claire: "transition works, but could improve. the afterimage feels too bold, only one line instead
of several like before".
- Keep the gather and the fall.
- Let several fine lines converge and ride together to the curve's start, like the earlier
  multi-arc trails, instead of one bold bright arc.
- The afterimage is subtle: thinner, dimmer, and fading softly.
- S07→S05 must still read as one motion.

### O: S35
Claire: "start-stop of zoom-out feels somewhat harsh. possibly bc the sung lyrics and soft
instrumental here make the beats feel less distinct, or bc neither S25b or S21 have on-beat camera
motion".
- Make the pull-out one continuous move: steady in log scale (each power of ten takes about the
  same time), easing only into the campus hold at the end.
- No on-beat steps. Beat accents may stay in the light (racks lighting and so on), but not in the
  camera.
- The first frame stays exact (S34→S35). The campus keeps its hold (Claire asked for that time in
  R15).
- S35→S36 must still read.

### I: S31
Claire: "the 2D static drawn rays of light coming out of clawd don't fit the visual theme here, i
think. the bonsai appear less polished than the rest of the environment".
1. **Clawd's light.** The flat spikes behind him read as a sticker on a painted 3D world. Make his
   light part of the world:
   - a soft volumetric glow;
   - light falling on the grass around him and on her;
   - if you keep any rays, make them soft, living shafts that respect depth, not static 2D spikes.
2. **The bonsai.** They read as grey placeholder props next to the main tree and the city. Bring
   them up to the environment's finish:
   - foliage pads with the main tree's material, clumpy edges, depth and dappled light, in
     greens that fade with distance;
   - trunks with bark shading and the sunset's rim light;
   - grounded at the base (contact shadow).

   Keep them distinct from Clawd's unique broad tree: cloud-pruned, varied, smaller.
- The S30→S31 and S31→S32 seams must hold. Tell the lead if S32's first frames change.

### Lead
- **HUD size (Claire):** "i like the size and stylization of S10's hud data. consider making the
  size more consistent". The lead matches S11's HUD and the valley HUD (S13, S14, S15) to S10's
  size, margin and row pitch, each in its own world's medium.
- The whole-film review, then re-renders, assembly, checks, commit and push.

Deliver final clips, `_av` versions and sheets, and NOTES. End with a 5-8 sentence final reply. Never
route around a denied command.

## Added during the round
### D: S20 and S36 (Claire, mid-round, with two screenshots)
"the perspective of the clawds doesn't change in S20 as the camera moves (the same is true for S36) - could
you fix that to make it consistent with S34? they occlude the protein as well."
- The Clawds become world-oriented 3D solids like S34's (sets/valley/clawd3d.js).
- They are depth-tested against the terrain, ribbons, beams and so on.
- Keep their size, poses and timing.
- Keep S20's lab ending and S36's exact last frame.

### L2: S08 (the lead's review)
The lab is the stillest stretch of the hook: bar 15 is a locked camera.
- Add a slow continuous push-in from the first frame that flows into the existing push through the glass.
- No on-beat steps.
- The last frame stays identical (S08→S10).

### Lead: the HUD
S11 (`sets/early-env/vector.js`, dark ink) and the valley HUD (`sets/valley/hud.js`: S13, S14, S15) now use
S10's metrics:
- caps about 20 px;
- rows 32 px apart;
- the label at x 48 and the value 144 px to its right.

### T: the pretraining HUD (Claire)
"tbh, you can remove the pretrain HUD. the visualization stands on its own."
- Remove the small STEP / LOSS corner readout from S03, S04, S07 and S05.
- Keep S05's big counters and the loss curve's own readout.
