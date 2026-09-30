## YOUR TASK. Your folder: 05-clawd-sprites

You are NOT making a scene. You are designing Clawd's sprite and model sheet for production. Clawd is the pixel mascot in the brief (18x5 grid, pixels 1:2, #D97757). Everything must stay unmistakably that silhouette.

Design:
1. EMOTES, 10-14 of them, expressed mainly through the two eye holes, the arm tips (the ends of row 2), the legs, and small squash/stretch or offsets. Include at least: neutral, blink, happy (^^ eyes), sad, surprised, sleepy, determined/focused, curious (head tilt via a pixel shift), love/warm, and a few you find useful for a tender music video. Tiny accessory pixels are allowed sparingly (a sweat drop, a spark, a heart); the body grid itself should mostly stay canonical.
2. MOTION: a walk cycle (4-6 frames), a hop or jump (3-5 frames), sitting, waving, holding or carrying a small object, sleeping, and looking up.
3. EVOLUTION LADDER. In the video, fidelity rises with capability. Show Clawd across 5-6 rungs:
   - the canonical 18x5 glyph
   - a 2x-detail pixel version (36x10 at the same proportions, with subtle shading pixels)
   - a clean smooth vector silhouette
   - a luminous geometric form
   - the transition into the Claude starburst (an irregular radial burst of about 10-12 tapered rays)
   Each rung must still read as Clawd.

Deliverables in your folder:
- sprites.png: a clean labeled model sheet at 1920x1080 or larger, on a neutral dark background, pixels crisp (nearest-neighbor).
- ladder.png: the evolution ladder.
- clawd-sprites.js: all sprite grids as data (arrays of strings, '#' and '.', plus any accent-color key) with a tiny drawSprite(ctx, grid, x, y, pixelW, pixelH, palette) helper, so production code can import them.
- NOTES.md.

Use HTML/Canvas with headless Chrome, as in the brief. Iterate by viewing your sheets. The quality bar is a professional pixel-art model sheet: every emote legible at the canonical size and charming.
