# Revision 12: brief (Claire's notes on cut 11): physics of the elevator and the fleet

The earlier briefs and `render/GUIDE.md` still apply. Claire's stills are in `out/stills/ref_R12/`.
Cut 11 is `out/film.mp4`, and cut 10 is in `backups/cut10/`.

HARD RULE: never write or quote the song's lyrics anywhere (replies, code, comments, file names,
notes). An API content filter kills any output that contains them.

## Claire's notes

- **The GPU hall (S16):** she prefers the old one. The overnight arched version is reverted, and
  S16 is restored from cut 10 (the lead did this).
- **The fleet** (`claire_S29_fleet.png`, `claire_voyage_fleet.png`): "this looks a lot nicer! Can
  probably work on the geometry more (e.g. should the beams be normal to the plane of the sail? And
  the foreground sail: integrate that sail into the fleet, or remove it)."
- **The climb** (`claire_S29_climb.png`): "this scene is a lot more visually powerful now. Though,
  shouldn't the stars be moving horizontal to the space elevator? Or do they curve as it rises? If
  we work in the frame of the payload, should the space elevator fall away from it as the payload's
  launched?"

## The physics (the lead's answers, which the shots should follow)

1. **Stars don't streak from the climb.** They are too far away for the climber's motion to move
   them. What moves them is rotation. The tether turns with the Earth once a day, and a climb takes
   days, so compressed into seconds the sky wheels around the celestial pole. The result is
   time-lapse star trails: concentric arcs around the pole. On an equatorial tether the pole sits on
   the horizon, so the arcs near it run close to horizontal. The climber's own speed shows on near
   things: the tether's markings and the climber's edges blur along the tether, as now.
2. **At release, the payload's frame is inertial.** The payload no longer turns with the Earth, so
   the star trails stop dead and become points. The tether, still turning, falls away: it drops
   toward the Earth and swings aside as it rotates. The payload drifts free with no push; it's a
   sling release. (S27's release arc is this same path, seen in the tether's turning frame.)
3. **Beamed sails face their beam.** Thrust is greatest at normal incidence, so each sail's normal
   lies along its beam, and the beam meets the sail's centre. The source (the Earth's laser array)
   is far away, so the beams are parallel, or converge in perspective when the source is in view.
   All the sails are therefore parallel, facing the source, and the formation lies in the plane
   perpendicular to the beams. Keep the organic look through position jitter and billow, not
   orientation jitter.
4. **Speed at interstellar scale is aberration, not streaks.** As the fleet speeds up, the stars
   crowd toward the point ahead and ahead-stars whiten slightly while behind-stars warm and dim.
   Any trails must point toward the direction of travel and grow with speed; parallel streaks are
   wrong. Keep colour shifts subtle: warm light through paper is the only saturated thing.

## O: `fleet3d.js` and S29

1. **`fleet3d.js` first, published in MATCH.md for D:**
   - The sails face the beam source (point 3).
   - The formation plane is perpendicular to the beams: a gently curved dish or sheet, staggered.
   - Integrate the foreground hero sail as the nearest member of the flock, with the same mesh and
     orientation, just nearer. If that reads worse, remove it; report which.
2. **S29 (5183-5482):**
   - The landing and the launch on the drop stay.
   - The climb (73-74.3) keeps the tether's motion blur. The vertical star streaks become
     time-lapse star trails around the pole (point 1): the arcs lengthen as the climb speeds up,
     with the pole at or just past a frame edge.
   - The release (74.4) is in the payload's frame: the trails stop dead, and the tether, climber and
     station fall away below and swing aside, shrinking (point 2).
   - The burst (75) and the beams (76) use the new fleet geometry, with the beams from below at
     normal incidence. Only sails and beams are in view, as before.

## D: the voyage (`sets/voyage/`)

- Use the updated `fleet3d.js`: the sails face the beam source (the Earth, beside the Sun at these
  distances).
- **View 0** looks back past the fleet at the Sun. The camera is behind the sails, so it sees them
  from behind: translucent vellum backlit by the beams, the film's backlit-paper look. The beams
  converge toward the Sun and Earth.
- **The hero sail:** integrate it or remove it, as O does.
- **View 1's streaks** become aberration (point 4): the stars drift toward the point ahead and
  crowd there as the fleet speeds up.
- **View 2 (A and B ahead)** follows the same rules.

The lead re-renders S30 afterwards. About 1 hour. Final clips, `_av` versions, sheets, NOTES, a
5-8 sentence final reply, and never routing around a denied command.
