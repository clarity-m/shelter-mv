# 01 pretrain: notes

**What it is.** A Sugimoto-style gray seascape. The horizon is the token stream: tiny letter-like glyphs that never spell anything, with rear-curtain motion trails and faint lanes for other sequences in the batch. One token has stopped, taken color, and become Clawd: pixel-exact #D97757, backlit by an irregular 11-ray burst, with the glow showing through its eyes. Attention arcs (opacity = weight) converge on it from earlier positions, and their faint reflection forms a cupped bowl under the stream. The floor is a weight-matrix heatmap in perspective, converging on the spark and visible only where it catches light. The HUD shows step, loss, and a tiny loss curve with a sudden drop at "now".

**Technique.** One HTML file, Canvas2D plus linear-light float buffers: underpainting, then ~12k horizontal brush strokes sampled from it, analytic perspective cells, additive light layers, multi-scale bloom with a horizontal flare, then weave, grain and dither. Clawd is stamped last. Deterministic (a re-render was byte-identical), about 10 s headless.

**Works.** Reads at a glance. The single warm point dominates. It's quiet, and the stream feels like motion.

**Doesn't.** The morph is implied rather than shown. I chose the burst→Clawd instant; pixel debris and an orange trail read as "shattering" and "a wire", so I cut them. The upper third is deliberately empty and may feel sparse. The brushwork is barely visible.

**Animating it.** The stream scrolls, arcs fade in by weight, and the burst hits on a vocal chop. End by pulling back to reveal the line as one row of a matrix. Port the per-pixel passes to WebGL2 (the JS takes ~10 s per frame).

**Opinion.** Strong for an opener: stream, attention, weights, and color as capability all read without text. The risk is austerity over 30 seconds, so the arcs and burst need to be timed to the music.
