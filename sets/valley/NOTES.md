# sets/valley: rung 3 (S13-S15, S17-S19)

**No trees before his sapling** (Claire, R15): `buildProps` puts low-poly boulders where the trees stood (`treeStyle: 'tree'` restores them), wall tiles included. S13 clicks `rocks.scatter(24)`.

**S13:** the humans' cursor swoops in over S12's last beat (`swoop.js`, shared with S12) and clicks `ground.raise()` on 33.1. **S14:** one smoothed lens path, so each rewind glides.

**S18 (47-50):**
- Bar 47: the humans' cursor drags in a cream cursor and lets go; his eyes follow it (`eyes()`), and he catches it on 47.4.
- Bar 48: five edits, one per drum hit; the sapling is planted at `TREE_SEAT`.
- Bar 49: `paint(cursors=10)` on 49.1. Bar 50: the burn, the light, the tree begins in light.
- The humans' cursor stays in frame, observing (`watchW`, shared with S19), with slow wide sweeps far right and far left (R21).
- The valley clock is `V`; `LT0`/`START` fit the quick lines.

**S19 (51-52):**
- Bar 51: S31's tree (`bigtree.js`) is drawn in light and filled, blooming on the sung onsets (`clockAt`).
- Bar 52: `clawd.copy(4)`: select 52.1 (73), click 52.2.5 (100); one shared happy beat, then stillness to the cut.
- R22 (Claire: no stutter): the humans' cursor moves in one fluid line at a constant angle. `curve()` is a C1 Hermite through waypoints, so velocity carries through them; each phase has one ease-in/ease-out. It loops out toward the tree and in to him (0-71), holds with the idle hover while selecting, typing and clicking (71-104), then rises once to watch (104-143).

**Engine** (off by default): `bigtree.js`, `sprouts.js`, `P.propGate`, `P.sweep`, `P.world`, `P.traits`.

**Cuts:** S12-S13 3.7, S17-S18 0.4, S18-S19 2.1; S19-S20 54.7 (hard).

**Tools:** `_P13`-`_P19` (listed frames); `_PW` (the worlds).

**S15, S17 (E2):** the grid is `wallshot.js` `replicaTiles`.
