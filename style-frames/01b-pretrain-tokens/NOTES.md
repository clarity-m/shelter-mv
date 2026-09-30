# 01b pretrain (tokens): notes

**What changed.** Only the stream and the attention layer changed. The horizon is now real tokenizer output on Clawd's baseline. Tokens are Consolas at 14-18 px cap height beside Clawd, shrinking to about 3.5 px by 500 px out. Boundaries show as alternating warm and cool tints, small gaps, and ruler ticks under the line. Whitespace prints as `·`, newlines as `\n`, and documents are joined by `<|endoftext|>`. The content is invented: code, facts, LaTeX, JSON, digits. The legible stretch reads `px.color = "#d97757"` with Clawd right after it. That's a deliberate wink; swap in neutral code if it feels too cute. Attended tokens glow slightly. In the upper third, five faint arcs reach in from beyond the frame; it's one code block, easy to delete.

**Technique.** Tokens are drawn with fillText into a strip along the horizon. Each row gets a leftward trail that lengthens with distance from Clawd. Far tokens also get a crisp mirror image, which keeps the round-1 glitter.

**Works.** Legible at a glance, yet still one luminous stream; Clawd is still the only color.

**Doesn't.** Near Clawd the stream looks almost still. The two largest tokens are washed out by the burst.

**Render time.** 7.6 s of JavaScript when idle (22 s with other renders running), plus about 5 s of Chrome overhead. The sky, strokes and field don't move in this shot, so bake them once (saves 3 s). Moving grain and bloom to WebGL2 saves 3.3 s more. That's about 1 s per frame.

**Animating.** Tokens scroll through a fixed magnifier centered on the spark. On a vocal chop the stream freezes and one token becomes Clawd.

**Opinion.** This beats round 1: "data becomes a mind" now reads without captions. Readable code does pull the eye briefly.
