"""The song map: sections by bar, with times and 30 fps frame numbers.

Labels come from reading timeline.png (stems, loudness), vocal_f0.png (sung
lines vs vocal chops) and the drum/bass dropout list. Section names are
structural only; no lyrics anywhere in this project.
Writes analysis/sections.json and analysis/STRUCTURE.md.
"""
import json
from pathlib import Path

A = Path(__file__).resolve().parent
g = json.loads((A / "grid.json").read_text())
FPS = 30
END_T = 217.73

# (first bar, last bar, id, name, what the music does)
SECTIONS = [
    (1, 4, "intro-a", "Intro A", "Chop motif alone, soft; sustained bass pad; no drums. A 2-bar melodic cell repeats."),
    (5, 8, "intro-b", "Intro B", "Kick on bar 5, light percussion and a riser build in; chops sparse."),
    (9, 16, "hook-1", "Hook 1", "First drop: full drums, pumping bass, chop lead. Bass stops on beat 4 of bars 9, 13, 14."),
    (17, 24, "verse-1", "Verse 1", "Sung lead enters over a lighter beat; bass drops out for bar 18, then returns."),
    (25, 28, "pre-1a", "Pre-chorus 1a", "Kick drops out; low-register vocal; sustained bass. The first real breath."),
    (29, 32, "pre-1b", "Pre-chorus 1b", "Snare pattern returns, vocal climbs; drums cut out from the end of bar 30 until a fill in the second half of bar 32 (a held breath before the drop)."),
    (33, 48, "drop-1", "Drop 1", "16 bars of chop lead, full drums. Bass stutter-stops on beat 4 of bars 33, 37, 38, 40, 45, 46."),
    (49, 52, "breakdown", "Breakdown", "Drums and bass out; sung, spacious. The song's midpoint (1:55.6 = 53%)."),
    (53, 56, "verse-2a", "Verse 2a", "Sung; still no drums; bass creeps back in from bar 55."),
    (57, 64, "verse-2b", "Verse 2b", "Single kick hit on the bar 57 downbeat; sung with long held notes; bass intermittent."),
    (65, 72, "build-2", "Build 2", "Chop lead returns over hats and a continuous snare roll; bass pumps. Bar 72: the drums drop out for three beats, then on beat 4 (frame 5177) the lead and voice cut out under a loud drum fill into drop 2."),
    (73, 80, "drop-2", "Drop 2", "Second drop, chop lead, full drums; bar 80 dips for a turnaround."),
    (81, 86, "drop-2-vox", "Drop 2 + vocal", "Sung line over the full drop: the climax. Bass stops on beat 4 of bar 85."),
    (87, 88, "held", "Held note", "Drums fall away under one long sustained vocal note (about 4 s)."),
    (89, 91, "outro", "Outro", "Pad and a wavering vocal tail; ends at 3:37.7."),
]


def bar_t(b):
    return g["bar1_t"] + (b - 1) * g["bar_s"]


def mmss(t):
    return f"{int(t // 60)}:{t % 60:04.1f}"


out = []
for first, last, sid, name, music in SECTIONS:
    t0 = 0.0 if first == 1 else bar_t(first)
    t1 = END_T if last == 91 else bar_t(last + 1)
    out.append({"id": sid, "name": name, "bars": [first, last], "t0": round(t0, 2), "t1": round(t1, 2),
                "f0": round(t0 * FPS), "f1": round(t1 * FPS), "music": music})
(A / "sections.json").write_text(json.dumps(out, indent=1))

lines = [
    "# Shelter: song map",
    "",
    f"100.00 BPM, 4/4, locked grid (DAW-quantized; tracked downbeats sit within 40 ms of it). "
    f"Bar = 2.4 s = 72 frames at 30 fps; beat = 0.6 s = 18 frames. Bar 1 downbeat at {g['bar1_t']} s. "
    f"Bar b starts at {g['bar1_t']} + 2.4(b-1) s. 90 full bars plus a tail; length 3:37.7 = 6533 frames. "
    "Key centre C major (Krumhansl estimate).",
    "",
    "| Section | Bars | Time | Frames (30 fps) | Music |",
    "|---|---|---|---|---|",
]
for s in out:
    lines.append(f"| {s['name']} | {s['bars'][0]}-{s['bars'][1]} | {mmss(s['t0'])}-{mmss(s['t1'])} | "
                 f"{s['f0']}-{s['f1']} | {s['music']} |")
lines += [
    "",
    "Shape: two cycles of verse, build, drop, with a sung breakdown between them. The chop lead owns every drop; "
    "sung lines own the verses, the breakdown and the last 6 bars of drop 2. The drops are 8 + 16 + 14 bars, "
    "so the song spends about 40% of its length at full energy.",
    "",
    "Hit points for the edit: the bass stutter-stops (beat 4 of the bars listed above, about 0.3 s each), "
    "the drop downbeats at bars 9, 33 and 73, the kick on bar 57, and the drum cut-outs at bars 31-32 and 72.",
    "",
    "Files: `grid.json` (grid), `beats.json` (tracked beats), `envelopes.npz` (per-frame curves at 30 fps: mix, "
    "stems, kick, snare, bands, centroid, onset, chroma), `bars.json` and `vocal_bars.json` (per-bar stats), "
    "`timeline.png`, `vocal_f0.png`, `ssm.png`. Stems in `stems/` (Demucs htdemucs_ft). Scripts: separate.py, "
    "beats.py, features.py, vocal.py, sections.py, run in that order with `.venv/Scripts/python.exe`.",
    "",
]
(A / "STRUCTURE.md").write_text("\n".join(lines), encoding="utf-8")
for s in out:
    print(f"{s['name']:16s} {s['bars'][0]:>2}-{s['bars'][1]:<2} {mmss(s['t0'])}-{mmss(s['t1'])}  {s['f0']}-{s['f1']}")
