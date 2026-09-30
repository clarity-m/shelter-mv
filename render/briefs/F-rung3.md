# Brief F: open worlds (rung 3, low-poly 3D), shots S13, S14, S15, S17, S18

Read `render/GUIDE.md` first, then the TREATMENT.md sections for your shots and
`analysis/STRUCTURE.md`. The worked example is `shots/S21.js`.

## Your sets

Build `sets/valley/`: the low-poly valley and the wall of parallel environments.

Sources:
- `style-frames/02b-environment-poly/` (`frame-v2.png`/`.html`, `NOTES.md`): the
  low-poly valley with a river, painted "learned" ground next to gray CG
  "unlearned" ground, and the extruded Clawd.
- `style-frames/02-environment/`: the painted versus gray split idea.
- `style-frames/05-clawd-sprites/clawd-3d.js` and `clawd-3d.png`: the glyph
  extruded four cells deep, with eye pockets. Avoid pure side and top views, where
  he becomes a slab.
- `style-frames/10-world-ladder/` rung 3: the dimension lens of the inside world.

Colour is capability: colour spreads where he has learned. The HUD (episode, step,
reward) is small and clean.

## Shots

**S13:** bars 33-36, frames 2315-2602, 9.6 s. Drop 1, the film's first big hit.
On the bar-33 downbeat (frame 2315), Clawd's flat glyph extrudes into a solid and
the camera swings around him for the first time. The low-poly valley rises
outward from where he stands, one wave of facets per kick (T.events('kicks')).
The previous shot ends with Clawd centred in a white field whose plane has just
tilted into perspective; start from a matching composition. The bass stutter-stop
on beat 4 of bar 33 (T.inStop) freezes the frame and resets the episode (the HUD
ticks).

**S14:** bars 37-40, frames 2603-2890, 9.6 s. He runs the valley. Ground he has
crossed turns painted and saturated; the ground ahead stays gray CG. The
stutter-stops in bars 37, 38 and 40 each freeze the frame and reset the episode,
and each episode he gets further.

**S15:** bars 41-44, frames 2891-3178, 9.6 s. Pull back: the valley turns out to be
one tile in a wall of hundreds of parallel environments. Each has its own tiny
orange Clawd, and each tile colours in as it is solved. Scale and multiplicity
carry gravitas; never make Clawd big.

**S17:** bars 47-48, frames 3323-3466, 4.8 s. Still pulling back, the wall of worlds
curves into the harness shape: the same cupped rib-fingers as on the lab bench
(see `style-frames/11-paper-lab/frame.png`), now holding hundreds of worlds. S16,
between S15 and S17, is an outside shot by another agent.

**S18:** bars 49-52, frames 3467-3754, 9.6 s. The breakdown and the film's
midpoint: drums and bass out, sung, spacious. One slow shot. Clawd is alone in the
valley. For the first time, he changes his own world: he touches the ground and
paint spreads out from him, and the facets subdivide into smooth painted forms.
This is the rung 3 to rung 4 transition. Nobody helped. Pace the spread with the
voice (T.env('vocals')). The next shot (S19, another agent) is the painted rung-4
hill that Clawd raises, so end in paint.

## Deliverables

- the shots, the sets, and `out/shots/<ID>.mp4` plus `_av.mp4` for each, with
  contact sheets;
- `sets/valley/NOTES.md`, updated as you go;
- a final reply of 5-8 sentences.

Budget: about 90-150 minutes. Order: S13, S14, S18, S15, S17. Other agents work in
parallel; the ownership rules are in the GUIDE.
