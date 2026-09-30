# Revision 3: shared brief (read this, then your own R3 brief)

Read `render/GUIDE.md` first, then the draft-5 section at the top of `TREATMENT.md`
("Draft 5 is Revision 3") and `shots.json` (34 shots; your shots' bars and frames
are there). The song map is `analysis/STRUCTURE.md`.

HARD RULE: never write or quote the song's lyrics anywhere (replies, code, comments,
file names, notes). An API content filter kills any output that contains them.

## What Claire asked for (her notes on cut 3)

The first part of the film, up to the 3D worlds, is close to final. What needs
work is one transition: Clawd **exploring** given worlds, then **making** them,
then **changing the real world**. Cut 3 had two problems there:
- The midpoint (S18) painted the valley green outward from Clawd, the same image as
  drop 1's learned ground. So it read as more learning, not a new power.
- After the first two pairs, the inside shots (Clawd building) and the outside
  shots (paper breakthroughs) only alternated, and nothing in the pictures linked
  them.

Revision 3's answer is one chain of tools, then one rule.
- **The chain:**
  - the humans' paper cursor is *handed* to Clawd, and lights orange from inside;
  - he commands several cursors at once, and they draw his world into paint;
  - the cursors burn away into light;
  - light is his medium from then on, and what he draws in light becomes real.
- **The rule (bars 55-72): drawn in light, then real in paper.**
  - Every outside montage shot is the paper twin of a light drawing just before it.
  - The cut between them is on a match: the same silhouette in the same place in
    frame, so the edit tells the story.
  - It accelerates: 2-bar shots in verse 2, 1-bar pairs in build 2, per beat in
    bars 69-70.

| Bars | Shot | Owner | Content |
|---|---|---|---|
| 49-52 | S18 | P | the cursor is handed over; several cursors draw the valley into paint; they burn into light |
| 55-56 | S20 | D | Clawds draft the reactor in light; pull back out through the lab screen; researcher A leans in |
| 57-58 | S21 | lead | hard cut on the kick: the reactor ignites (done) |
| 59-60 | S22 | I | the river, plus lines of light along it |
| 61-62 | S23 | O | the city's grid follows those lines; windows light (match dissolve, xin 12) |
| 65 | S25 | I | the crowd multiplies and folds a painted protein |
| 66 | S25b | O | the paper vial glows where the protein was (new shot) |
| 67 | S25c | I | the crowd marks two points of light in the sky (new shot) |
| 68 | S26 | O | the observatory's slit opens on the same two pinholes |
| 69-70 | S27 | O | per beat: the rocket drawn in light against the paper rocket |

## Rules that bind everyone

- **Clawd:** crisp, exact cells, #D97757; never blurred or enlarged. Scale comes
  from multiplicity.
- **Humans:** faceless silhouettes, only in the lab and on the final hill. Claire
  dropped the hand motif: no hands reaching for or holding anything.
- **Outside is backlit paper:** no text, no HUD. Warm light through paper is the
  only saturated thing.
- **Don't strobe.** Where inside and outside alternate quickly, keep the inside
  beats dimmed toward night (as at the end of S20 in cut 3), so the light drawing
  carries the brightness.
- **Determinism:** `render(fr)` is a pure function of the frame.

## Ownership this round

- **P:** `sets/valley/*`, `shots/S17.js`, `shots/S18.js`. Also `shots/S19.js`, for
  the optional touch in your brief and a re-render.
- **D:** `shots/S20.js`, `sets/paper-lab/*` (additive: S08 must render
  unchanged), and any new `sets/door/`.
- **I:** `sets/inside-montage/*`, `shots/S22.js`, `shots/S25.js`, `shots/S25c.js`.
  Keep hillx/glslx defaults and existing options unchanged: S20, S27, S30 and S32
  import them. Add options additively.
- **O:** `sets/paper-kit/*` (sail.js and launch.js stay behaviour-compatible for
  S28-S30), `shots/S23.js`, `shots/S25b.js`, `shots/S26.js`, `shots/S27.js`, and
  `sets/paper-kit/MATCH.md`.
- **Lead:** `shots.json`, `render/*`, `lib/*`, `TREATMENT.md`, `GUIDE.md`,
  `shots/S21.js`.

Everything else is read-only for you: import it, don't edit it. If you need a change
outside your files, write it in your NOTES and final reply.

## Coordination

- O publishes the match targets in `sets/paper-kit/MATCH.md` first. These are the
  screen positions in 1920x1080 that each inside twin's last frame must hit, plus
  reference stills.
- I builds mechanics until MATCH.md exists, then aligns to it.
- If you change a shot's last frame and the next shot dissolves from it (xin), the
  next shot needs a re-render. Say so in your reply.

## Working

- Iterate on stills and half-res previews, and view contact sheets. The GPU is
  shared by four agents, so expect about 2x page times.
- Check your cuts with `python3 render/cuts.py <IDs>`, which writes
  `out/stills/cuts.png`.
- Finish with final clips plus `_av.mp4` and a contact sheet per shot.
- **Permission denials:** if a command is denied, stop that line of work and report
  it in your reply. Don't route around it, and never edit `.claude` settings.
- Don't write to `~/.claude/memory`. No git, no email.
- **Final reply:** 5-8 sentences covering what each shot now does, the cut numbers,
  page times, anything unfinished, and anything the lead must re-render. Also
  update your set's `NOTES.md`, under 300 words.
