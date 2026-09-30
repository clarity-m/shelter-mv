# Revision 15: brief (Claire's notes on cut 14). Everyone reads all of it.

The earlier briefs and `render/GUIDE.md` still apply, including R14's rule that Clawd acts with his eyes.
`shots.json` is updated (`render/revise15_shots.py`). Cut 14 is `out/film_cut14.mp4` and `backups/cut14/`.
References are in `out/stills/ref_R15/`.

HARD RULE: never write or quote the song's lyrics anywhere (replies, code, comments, file names,
notes). An API content filter kills any output that contains them.

## Claire's notes on cut 14

- Drop 1's simplification is "very effective ... one of the stronger scenes". It has small visual
  glitches:
  - in S13, the humans' cursor cuts into the terrain (`claire_S13_cursor_clip.png`);
  - "maybe a glitch during S14 zooms". The lead found it: at the first two rewinds the camera snaps
    from the wide view straight back to Clawd in one frame (2671→2672 and 2743→2744;
    `S14_rewind_snaps.png`).
- The three technologies "feel like a group now ... the environments now have their own identity ...
  looks pretty, is meaningful". The only significant edit: give the full campus another beat or half
  beat.
- The next major target is S18-S19. Her ideas:
  - the humans' cursor drag-and-drops a cursor for Clawd, which flutters down for Clawd to catch;
  - Clawd creates something that isn't from any previous environment;
  - some kind of replication leading up to S20, for example "the cursor duplicates Clawd, then
    drag-and-drops in a cursor".

  She left the choice to the lead.

## The lead's design for the pivot (S18-S19)

The trust escalates in steps:
1. The humans give Clawd a tool of Clawd's own.
2. Clawd explores with it.
3. Clawd remixes what it learned.
4. Clawd makes something new.
5. The humans, seeing that, make more of Clawd.

The copies are the humans' act, made after they trust Clawd; Clawd never replicates itself. Humans
choosing to scale up a trusted Clawd fits the song, and an AI copying itself unasked is a red flag we
don't draw.

| Bar | Frames | Beat |
|---|---|---|
| 48 (drop's last bar) | 3395-3466 | S17's dive ends on S18's first frame (keep). The humans' indigo paper cursor enters dragging a new cursor: blank cream paper, unlit, trailing just behind like a dragged file (S15's grammar). It carries it above Clawd, who looks up. |
| 49 (breakdown) | 3467-3538 | It lets go (the drag ends) and withdraws upward, keeping its own. The new cursor flutters down like a sheet of paper, rocking side to side, slow. Clawd's eyes track it, he steps under it, and catches it at about 49.3 (as now). It lights orange from inside. |
| 50 | 3539-3610 | First edits as now, with eye acting: puddle, pebble, sapling, undo and redo. The sapling matters: it becomes the tree. |
| 51 | 3611-3682 | `paint(cursors=10)`: the ten cursors paint the valley and bring in the learned worlds (as now). |
| 52 | 3683-3754 | They burn into light that returns to Clawd. He turns to the sapling, it starts to grow in light, and the hill swells. |
| 53 (S19) | 3755-3826 | Clawd's first original creation. The hill rises under the sapling, and it grows into the tree of the final scene: S31's tree (sets/hill), with its sturdy trunk and big rounded canopy that glitters, drawn in light and then filled. Nothing like it existed in any training world, and it's the tree the figure sits under in S31. Clawd looks up at it. On 53.3 the humans' cursor returns, clicks Clawd (a selection outline) and types `clawd.copy(4)` in S10's label. On 53.4 it clicks, and four copies of Clawd appear beside him, each already holding its own orange cursor. They glance at each other. Hard cut to S20. |

## Per agent

### P: S13 and S14 fixes, then S18-S19
1. **S13:** the humans' cursor never cuts into the terrain. Keep it above the surface, or draw it on
   top.
2. **S14:** each rewind glides. The camera travels back with Clawd's rewinding ghost trail, eased
   over the stop, and never snaps (2671→2672, 2743→2744). Check the 40.4 crane too.
3. **S18 and S19** as in the table. Keep the catch timing, the first edits, the ten cursors and the
   burn. The last frame of S19 is free (it hard-cuts), but S20 opens on the five Clawds, so end with
   the five of them beside the tree.

### D: S20 and S36
1. **S20:** the helpers are the four copies from S19. They're present from S20's first frame on the
   grey hill (five Clawds), and nobody pops out of Clawd's light. Each of the five orange cursors that
   paint the funnel world in belongs to one of the five Clawds, linked by a faint line of light or
   starting at him. The five fold the chain together. Everything else stays: the palette, the
   contours, the code, the fold and the lab.
2. **S36:** it now starts a beat later, at 62.2 (frame 4421, 198 frames; `shots.json` shift0 18).
   Compress bar 62's content (the paint-in, the hook) into its three beats with a time warp, like
   S31's: new local frame t maps to old local t·72/54 for t < 54, and to t + 18 after that. Bars 63-64
   and the last frame stay exact (S36→S21).

### O: S35
It now runs a beat longer, to 62.2 (frames 4331-4420, 90 frames; `shots.json` shift1 18). Keep the
landing and the pull-out as they are, and extend the campus hold by the new beat (about 42 frames).
Give the extra beat something gentle, such as a slow settle and the lighting wave reaching the far
edge, rather than a freeze. The first frame stays exact (S34→S35).

About 1.5 hours. Final clips, `_av` versions and sheets, NOTES, a 5-8 sentence final reply, and never
routing around a denied command.

## Addition (Claire, after the brief): the tree is the first living thing

Claire loves the tree, and asked that the earlier environments' trees become boulders, "so Clawd's
first creation is the first living thing in their environment".
- No trees or plants appear in any training world before bar 50 (S13-S18, the wall tiles
  included). They become low-poly boulders and rock clusters, and painted boulders in the painted
  valley.
- The sapling of the first edits is the first life, and it grows into the tree in S19.
- Also from her: the first copy being human-initiated is right, and later crowds (S34, S36, S27)
  may stay Clawd's own initiative.
