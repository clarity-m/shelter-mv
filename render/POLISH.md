# Polish list

## Done in Revision 1 (09-28)
All of Claire's review notes except the three she deferred: see TREATMENT.md
(draft 4) and CLAUDE.md.

## Deferred by Claire to a later pass
- **S06, S16:** more light and motion on the GPU racks, with flashes feeding the
  racks.
- **S21:** fusion pulsing, more light after ignition.
- **S29, S30:** refine the solar sail.

## Carried over from Revision 15 (09-29, minor)
- S36: with bar 62 in three beats, the grey paint-in sweeps across in about 6 frames (4424-4428),
  brisk and wipe-like.
- S19 packs the tree, the selection, `clawd.copy(4)` and the five into one bar; it's tight but
  reads.

## Carried over from Revision 14 (09-29, minor)
- S13: `sky.set(dusk)` changes the sky over about 12 frames on its click (163-175). It's intended,
  but it's the biggest change in the shot.
- S36's paint-in opening sweeps the sky as a tall arch-shaped stroke (4407-4412); it reads as a
  brush, and it could be a flatter sweep.
- S34: the crowd lines up in a row on bar 60, a little regimented.
- The voyage's view 2: A and B partly overlap near sails.
- S15's tile Clawds are dots at grid scale (correct for scale, but tiny).

## Carried over from Revisions 12-13 (09-29, minor)
- S14: after the cursor draws each world, the camera swoops back down to Clawd in about 4 frames
  (38.2, 39.2), nearly a whip cut. It's intended, but it could ease over 8-10 frames if it jars.
- S35: the tunnel rings leave brief gaps after each entry, and the magnified near bays render
  soft (O's note).
- S35 -> S36 is 57.9: the night campus into S36's dim, warm opening. Dimming S36's first
  half-beat further would soften it.
- The voyage's parallel sails can read as a regular grid. Scattering the positions irregularly
  across the dish would keep the physics. Offered to Claire.
- `render/glitch.py`: the intended jumps now also include S14's swoops (38.2, 39.2).

## Carried over from Revision 11 (09-29 overnight, minor)
- S10 holds one fixed framing for its 9 bars (Clawd moves inside it). A scrolling alternate is
  ready for Claire to compare, not in the film: `out/shots/_S10scroll.mp4` (plus `_av` and sheet),
  from `shots/_S10scroll.js`.
  - The camera eases left after Clawd in bars 18-19, then settles on S10's framing from local 204.
  - The first and last frames are identical to S10's.
  - To adopt it, make S10.js's default use the scroll option and re-render S10.
- S20's principal-point nudge (`horizonSafe`) is now redundant, since glslx is fixed upstream;
  it's harmless.
- `render/glitch.py` flags intended jumps as well (S02/S03's fly-through, S11's flicks, S13's
  stop, S14's resets, S27's lines-alone moment, S30's intercut). Judge new hits against this list.

## Carried over from Revision 10 (09-29, minor)
- S20 and S36: the code lines are 2D text along 3D paths (additive decals barely show on the
  bright sunset sky), so nearer objects don't hide them.
- S29 no longer uses `launch.js` or `rocketlines.js`; both are unused and can be deleted.
- S27's force-balance diagram reads small at thumbnail size; check it at full size.

## Carried over from Revision 9 (09-29, minor)
- S27's two-column code wall and S30's code torrent are dense on purpose; thin them if they
  compete with the drawing or the build.
- `sets/paper-kit/rocketlines.js` and `launch.js` are retired (S29 no longer imports them). S28.js
  and S26.js stay as modules.
- S35 -> S36 is now 102.9, still a deliberate bright cut.

## Carried over from Revision 8 (09-29, minor)
- S25c: the salt flat is Clawd's making only through the crowd's beams; it doesn't paint in
  as we arrive (one bar leaves no room).
- S35 -> S36: the dark greenhouse cuts to the bright sunset sea (mean diff 95). It's deliberate,
  but lowering S36's opening exposure is a one-line change in S36.js if it jars.
- S34: the far rows thin to stems and grain heads past 45 m, to keep the page time down.
- S34/S35 (bars 58-61) is a swappable slot for the third technology (Claire, 09-29); the pacing
  stays.
- Retired shots kept as modules only: S22, S24, S25 (inside-montage), S26 (observatory state for
  S27), S28 (launch state).

## Carried over from Revisions 5-7 (09-28, minor)
- S19's tree stands at hill (-5.6, 10.0), because the valley's own tree blocks the
  original spot. S20's opening matches it, while the later hill-engine shots use
  (-4.1, 9.2).
- S20 loads hillx through `sets/door/hillx-fix.js`. The ribbon y-flip is now fixed
  upstream, so the loader falls back to the original.

## Carried over from Revision 3 (09-28, minor)
- S25c: the ground's motes sparkle heavily.
- S25: the crowd is small in the wide opening.
- S18: the paint on the far land reads only faintly through the haze, and the
  streaks swirl a little where strokes of different directions cross.
- S22: the river is a little wider on the left, and Clawd now stops near the
  right edge (both from fitting S23's grid marks).
- S20: the pull-back runs about 0.95 s/frame, over budget; this doesn't matter
  for the final clip.

## Carried over (minor)
- The swarm's brilliance at icon distance (S32 end, S33 start) is subtler than
  04b. The close pass has the glitter.
- S32: the lantern's ribs can overlap a wheel that straddles them.
- S26's slit light is a drawn glow; S28's exhaust clouds are on stage before
  ignition.
- The pretraining odometer digits blur when fast.

## Original list (cut 1)

Collected from reviewing every contact sheet, every cut (`render/cuts.py`), and the
agents' own reports. Ordered by visibility.

1. **S31 climax energy.** Six bars of the song's peak, the sung line over the full
   drop, currently play as a near-static tableau with a very slow crane. Options,
   all within the shelter API:
   - a stronger kick pulse on the city (`cityPulse`);
   - motes and lanterns rising;
   - a small gesture: the figure's head turning toward Clawd on the last phrase;
   - a slightly larger camera move.
2. **S02 to S03 seam.** S02 ends on a textured peach wash with visible paper fibre;
   S03 opens on a flat cream wash (mean difference 17). Carry the fibre texture
   into S03's first beat, or have S02 end flatter.
3. **S32 open.** The swarm set's fixed vignette and grain differ from S31's at the
   cut. Expose them as options in `sets/paper-swarm/swarm.js` and fade them in
   over the first 10 frames.
4. **S14, about 1.0 s.** An unlearned gray tree sweeps right past the lens and fills
   half the frame for about 0.3 s. It reads as a blob; drop that tree or move the
   camera path.
5. **S17.** The harness of worlds is seen from above, while the lab harness is seen
   front-on; the echo would read better closer to front-on.
6. **S32.** The treatment's motes of light settling into the lantern's ports are
   not done (optional).
7. **Minor, probably leave:**
   - S26's slit light is a drawn glow, not haze shafts;
   - S28's exhaust clouds are on stage before ignition;
   - S06's rack sled seats in 8 frames;
   - the pretraining odometer digits blur when fast.
8. **Whole-film pass.** Watch the full cut for colour and brightness jumps between
   the inside rungs and the outside paper, especially in the bar 53-80 intercut.
