# sets/voyage: the fleet leaving the solar system (R12-R14, agent D)

S30's three outside views (36 frames each): only the sails, their beams, the Sun and the stars.
0. **Looking back** past the flock at the Sun, small in its orbits. The camera is downstream of the
   beams, so the sails glow through from behind; the beams converge on the Sun and Earth.
1. **One star among many.** As the fleet speeds up (v/c 0.04 to 0.32), aberration draws the stars
   away from the Sun toward the point ahead, behind the lens; behind-stars warm and dim a little.
2. **A and B** by the point ahead, the flock heading in on beams from behind. At v/c 0.3 the stars
   crowd toward the point ahead and whiten a little.

**Physics.** O's `fleet3d.js` (read only): the sails are parallel and face the source
(`SOURCE_DIR`), with the formation perpendicular to the beams. Each beam is parallel to the axis
and meets its sail's hub along the normal. O's hero (index `N_SAILS`) is the flock's nearest
member, turned into the voyage's frame (source at -Z, travel +Z). Stars sit at their aberrated
angle, cos t' = (cos t + b) / (1 + b cos t), with subtle Doppler colour. Short
trails from their place at 94% of the speed point along the travel direction and grow with speed.

**API.** `createVoyage(cv, { k, log })` draws into a fresh canvas's 2D context; `voyageFrame(view
0-2, t 0-35)` is a pure function (`shots/_VOYAGE.js` plays the views as frames 0-107).

**Look.** O's `drawSail` in the shared orange, rgb(255,158,104). R14: close cameras (8-13 units, a
900 px lens): near sails large and cut by the frame, the rows broken up in perspective.

**Page time.** 0.19 s/frame at full res.
