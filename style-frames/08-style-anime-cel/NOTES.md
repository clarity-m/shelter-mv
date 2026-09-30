# 08 anime cel: notes

**What it is.** "The harness" at dusk. Three soft window beams slant onto tiny Clawd, who sits on a glowing plate inside six finger-like ribs. Researcher A leans in with a needle probe. Clawd warms A's face and hand, and his orange shows as a catchlight in A's eye. B holds a mug, lit cool by a monitor showing a gray gridworld with an empty spawn cell and a rising eval curve. The room is lavender-slate, and Clawd is the only chroma.

**Technique.** One deterministic Canvas2D file (re-renders are pixel-identical).
- **Background:** gradients and circle-union cumulus, textured with brush dabs sampled from the underpainting, then softened. The glossy bench reflects the sky and Clawd.
- **Cels:** spline shapes with a flat base, one hard shadow tone, highlights, and ink lines.
- **Compositing:** masked light gradients, hard rim lights from silhouette offsets, beams, dust, and bloom. Clawd is stamped last on integer cells (all 54 exact #D97757).

**Works.** It reads in a second: the beams lead to Clawd and the ribs frame him. The face holds up at 2x (detail.png). It is the most emotionally direct style and the closest lineage to Shelter.

**Doesn't.** Hands are the weak point: the curled fingers are chunky and stiff next to the face. B is generic, and the lower bench is empty. There is some "vector anime" flatness, because real cels have hand-inked line variation.

**Render time.** 2.9 s in-page (GPU flushed) with 5 other agents loading the CPU. The static background is 1.6 s of that, so cache it per shot, which leaves about 1 s per frame.

**Animating it.** Limited animation suits it: blinks, a stylus nudge, hair sway, dust, the eval curve ticking, and a slow push-in.

**Opinion.** The humans hold up at mid-shot with simple hands. Hero close-ups need traced key-pose rigs.
