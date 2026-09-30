# Revision 14: brief (Claire's notes on cut 13, "both targeting consistency"). Everyone reads all of it.

The earlier briefs and `render/GUIDE.md` still apply. Bars are unchanged; `shots.json` has the new
descriptions (`render/revise14_shots.py`). Cut 13 is `out/film_cut13.mp4` and `backups/cut13/`.
Reference stills are in `out/stills/ref_R14/`.

HARD RULE: never write or quote the song's lyrics anywhere (replies, code, comments, file names,
notes). An API content filter kills any output that contains them.

## Claire's notes on cut 13

She says the drop 1 change "definitely conveys progression better", and that further refinements
there are mostly aesthetic or pacing. The voyage "looks much nicer now". Two directions, both aimed
at consistency:

1. **The three technologies as a group.**
   - She loves S20's energy-landscape gradient and S36's sun and aurora as abstract representations
     of physics. The chip landscape (S34), by contrast, is "pretty literal".
   - S20 shares the default environment's colours, while the others have their own schemes.
     Suggestion: colour it by height like a real topographic profile, or remove the trees.
   - S25b, S35 and S21 all last one bar, but S35 feels shorter. Suggestion: a faster zoom-out that
     leaves another beat for the full campus.
2. **Simplify S13-S17.** There are a lot of jump cuts and beats, and many things moving at once.
   - The cursor visibly building the worlds is nice, and clicks and typed text can replace camera
     movement for music sync.
   - One option: S13 is the cursor building the world alone, then the older scene of Clawd
     exploring it in three steps.
   - The cursors dragging the worlds into the grid is a great visual. As a cleaner drag and drop, it
     makes the cursor drawing the other worlds unnecessary. For diversity and scale: the cursor drags
     in three different worlds, then clicks or sends a command that duplicates them into a massive
     grid.
   - Clawd has a lot of movement in the later scenes. S11 shows emotion and curiosity clearly with
     less motion: "the small eye movements do a lot!"
   - The voyage: enlarging it or zooming in could make it feel less grid-like.

## Rule for everyone: Clawd acts with the eyes

S11 is the reference (`ref_R14/S11_eyes_a.png` and `_b.png`; view S11 itself in `out/film_cut13.mp4`,
frames 1811-2170). Clawd's curiosity and emotion come from small eye movements: glances at the
cursor, looking around, looking back. Add small squashes and single hops, used sparingly.
- Drop the continuous hopping, skipping and dashing, and the celebratory multiple hops.
- Running stays where it's the task (S14's episodes). Stillness plus the eyes is the default.
- Crowds can bob once when they arrive; they shouldn't keep bouncing.

## A. The three technologies as a group (D, P, O)

**The principle.** Each tech world is an abstract picture of its technology's physics: a field,
drawn as a painted plot. Each is coloured by that field with its own ramp and has no default-valley
props (no trees or rocks). Seen together they read as a triptych:
- **Protein (S20):** the free-energy landscape, a folding funnel. The chain slides down it into the
  energy minimum.
- **Compute (S34):** the silicon crystal's periodic potential, a lattice of wells (an egg-crate
  surface), with the chip's circuit drawn on it in light.
- **Fusion (S36):** the magnetic field. The aurora's field lines become the helices, and the coils
  close. Its plasma sits in a magnetic well.

All three are wells: one funnel, a lattice of them, and a magnetic bottle. The three follow the same
structure: the world painted in by Clawd's cursors, the design drawn in light, the crowd, the
landing.

**Palettes.** Each world has its own hue family, and Clawd's #D97757 must pop: no orange, coral or
rose-orange where Clawds stand. The lead's recommendation:
- **S20:** colour by height, deep indigo-violet basin (low energy, where the knot glows) through
  violet and magenta to pale rose-lilac at the high rim, with fine painted contour lines in a pale
  gold.
- **S34:** colour by height, deep teal wells through teal-green to gold crests, with fine contours
  circling each well like a density map. It keeps the die's teal and gold but loses its literal
  layout.
- **S36:** as now, cold: polar blues, white ice, and the aurora's teal, green and violet.

## B. Drop 1 simplified (P, E2)

The shape: the humans' cursor builds, Clawd learns, the cursor scales it up. Music sync comes from
clicks and typed lines, not camera moves. The camera is calm: slow drifts and pushes, no swings,
swoops or whip moves.

| Bars | Shot | Content |
|---|---|---|
| 33-36 | S13 (P) | 33.1: the extrusion (keep). Then the humans' indigo paper cursor builds the valley alone, one click per kick, each with a typed line in S10's code-label style (for example `ground.raise()`, `ridge.add()`, `river.carve()`, `trees.scatter(40)`, `mountains.raise()`, `sky.set(dusk)`). Each piece appears grey, unlearned, where it clicks. Clawd waits on the pad and watches with his eyes. |
| 37-40 | S14 (P) | The older scene, restored from `backups/cut10/code/shots/S14.js` and calmed. Clawd explores the one valley in three episodes, ending on the stops at 37.4, 38.4 and 40.4. The ground he crosses paints as learned; each stop freezes and rewinds, and each run gets further. The camera follows calmly. No cursor, no new worlds. Eye beats at each reset. |
| 41-44 | S15 (E2) | Pull back: the learned valley is one tile. The cursor drags in three different worlds, one at a time: a funnel crater, an icy shore, a salt flat (grey tiles, each dropped beside it with a click on a beat). Then it types one command (`envs.replicate(4096)` or similar) and clicks on the 43.1 downbeat: the four duplicate outward into a massive grid, wave by wave on the beats, each tile with its own Clawd, colouring as solved. The camera keeps pulling back slowly through 44. |
| 45-46 | S16 | unchanged |
| 47 | S17 (E2) | The dive from the massive grid into Clawd's valley tile, ending exactly on S18's first frame (S17→S18 must stay 0.4). |

The humans' cursor is the same one as in S10, S11 and S18: the indigo paper cursor with the backlit
edge, its code in S10's label style. Clawd's own code stays orange.

## Ownership this round

- **P:** `shots/S13.js`, `shots/S14.js`, `shots/S34.js`, `sets/fields/*`, and `sets/valley/*`
  except `wall.js` and `wallshot.js` (S15, S17, S18 and S19 must render unchanged unless listed
  here).
- **E2:** `shots/S15.js`, `shots/S17.js`, and `sets/valley/wall.js` and `wallshot.js` (additive
  options; S17's last frame must stay). Import everything else in `sets/valley` read-only. If you
  need an engine change, ask the lead.
- **D:** `shots/S20.js`, `shots/S36.js`, `sets/door/*`, `sets/voyage/*`.
- **O:** `shots/S35.js`, `sets/paper-kit/*`.
- **Lead:** `shots.json`, `render/*`, docs, `shots/S21.js`, and the final re-renders of S30.

Matches that must hold: S12→S13 (S13's first frame), S17→S18 (0.4), S34→S35 (the chip, exact) and
S36→S21 (the core, exact). S19→S20 and S20→S25b are hard cuts.

About 1.5-2 hours. Final clips, `_av` versions and sheets, NOTES, a 5-8 sentence final reply, and
never routing around a denied command.
