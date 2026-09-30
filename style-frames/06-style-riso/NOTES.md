# 06 riso: The harness

**What it is.** A night-lab risograph print. Tiny Clawd sits inside a cradle of jointed finger-ribs, two cupped hands open at the top. A researcher leans in with a stylus, lit by his orange. A second researcher, mug in hand, watches a gray gridworld whose empty spawn cell is dashed in orange. `detail.png` is a 2.2× close-up.

**Technique.** One HTML file:
- Canvas2D draws the vector scene into per-drum density plates, tone (screened) and line (solid).
- A WebGL2 pass prints them: dot screens at 45/15/75°, integer-pixel misregistration, multiply overprint, ink starvation, paper grain.
- Knockouts under Clawd compensate for each drum's offset, so he prints pixel-exact #D97757 (±2).
- Re-renders are byte-identical.

**Inks.** Black, riso Midnight (slate) and orange. Federal blue (`alt-federal-blue.png`, `ink-compare.png`) makes a prettier poster but a blue world. Midnight keeps early scenes desaturated. For the arc, add drums (blue, pink, yellow) as capability grows.

**Works.** It reads in one second, with the full range from paper to near-black. The cradle reads as shelter, not cage. Profile faces hold up in close-up.

**Doesn't.** Hands are simplified mittens: fine at mid-shot, weak in hero close-ups. Researcher 2 is stiff.

**Render.** 3.0 s in-page (0.33 s plates, 2.6 s print pass); about 10 s wall with Chrome startup. The print pass is mostly shader compile, uploads and per-pixel noise. Keeping one page alive and baking the paper and ink fields should get under 1 s per frame (not yet measured).

**Animating.** Fixed screens under moving art will moiré, and H.264 smears 7 px dots. Render at 4K, downsample, use a high bitrate. Re-seeding the misregistration at 12 fps would give a boiling print texture.

**Opinion.** Worth betting on for the early acts: committed, forgiving of anatomy, and ink count makes "color = capability" physical. The main risk is compression.
