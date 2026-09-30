# 11 · Paper lab (backlit cut paper)

**What it is.** `frame.png` (S08) is a night lab in 13 paper layers. The harness's back ribs are four fingers per side, held together, so Clawd's light throws two giant soft hands cupping a glow onto the wall. A leans in with a stylus. B holds a mug at a dim monitor. The window has a tissue sky and a pinhole city. `detail.png` (S09) shows silhouette hands cupping Clawd.

**Technique.** `frame.html?shot=lab|hands`, rendered via `render.py`.
- Canvas2D cuts hand-cut masks.
- One WebGL2 pass handles:
  - Claude's area light, with soft shadows projected through every layer in between;
  - moonlight only through the window;
  - edge rims and haze;
  - thin-paper glow as exp(−paper thickness toward the light), with fibre showing in the transmitted light.
- Then bloom, grain and a vignette.
- Clawd goes on last, on exact cells.
- The hands come from a 2D rig (palm, phalanges, thumb).

**Decisions.** Clawd must outshine what he lights, and the warm ramp has a steep toe, so the light pools and then ends. He has dark eyes: hot eyes made him look blank.

**Works.** It reads in one second, even at 320×180. Warm is the only saturated thing, and there is little of it. Clawd measures #D97757. The hands hold up: correct fingers and joints, and graceful, with light glowing through their edges.

**Doesn't.** At thumbnail size it reads as silhouette illustration, and the paper only shows at 1:1. B is stiff. The hands are a 2D cheat, and the bench top is faked.

**Render time.** In a warm page, 85 ms per 1080p frame; masks are a one-time 2 s. Re-renders are byte-identical.

**Animating.** Parallel planes give free parallax, and the shadows recompute, so a breathing glow makes the giant hands breathe. Only masks that change need redrawing (about 0.2 s each).

**Opinion.** I recommend it for the whole outside world. Matter and silhouettes are unmistakably not the inside's light, and "colour is capability" becomes literal: warm light passing through matter. It carries to the city, the reactor and the swarm cheaply. The risk is that the paper reads subtly in quick cuts, so motion has to sell it.
