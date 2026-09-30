"""A/B of hook 1's order (Revision 21): cut 18's order against Claire's alternate.

  main:      S04 9-10, S05 11-12, S06 13-14, S08 15-16          (shots.json as committed)
  alternate: S04 9-10, S06 11, S07 12 (xin 6), S05 13-14 (xin 6), S08 15-16

usage: python3 render/ab_hook1.py
Renders the alternate's S06, S07 and S05 with a temporary shots.json into out/ab/ (the main clips and
shots.json are restored afterwards, even on failure), then cuts bars 9-16 (frames 587-1162) of both
orders with the song: out/ab/hook1_cut18order.mp4 and out/ab/hook1_alt.mp4.
"""
import json, shutil, subprocess, sys
from pathlib import Path

ROOT = Path("C:/Users/USER/Projects/shelter-mv")
NODE = "C:/Program Files/nodejs/node.exe"
AB = ROOT / "out" / "ab"; AB.mkdir(parents=True, exist_ok=True)
SJ = ROOT / "shots.json"
fb = lambda b: round((0.38 + 2.4 * (b - 1)) * 30)
F0, F1 = fb(9), fb(17)          # 587, 1163

def write_shots(d, path):
    lines = ["{", ' "note": ' + json.dumps(d["note"], ensure_ascii=False) + ",", ' "shots": [']
    for i, s in enumerate(d["shots"]):
        lines.append("  " + json.dumps(s, ensure_ascii=False) + ("," if i < len(d["shots"]) - 1 else ""))
    lines += [" ]", "}", ""]
    path.write_text("\n".join(lines), encoding="utf-8", newline="\n")

def render(sid):
    r = subprocess.run([NODE, "render/render.mjs", sid], cwd=ROOT, capture_output=True, text=True)
    print((r.stdout.strip().splitlines() or [""])[-1] or r.stderr[-300:])

main = json.loads(SJ.read_text(encoding="utf-8"))
alt = json.loads(SJ.read_text(encoding="utf-8"))
by = {s["id"]: s for s in alt["shots"]}
by["S06"]["bars"] = [11, 11]
by["S05"]["bars"] = [13, 14]
S07 = {"id": "S07", "bars": [12, 12], "section": "hook-1", "set": "transformer", "rung": 0, "still": None, "xin": 6,
       "desc": "Back inside, one bar: the new hardware becomes new layers (A/B alternate)."}
order = []
for s in alt["shots"]:
    if s["id"] == "S05":
        continue                       # moved after S07
    order.append(s)
    if s["id"] == "S06":
        order += [S07, by["S05"]]
alt["shots"] = order
assert [s["id"] for s in order[3:8]] == ["S04", "S06", "S07", "S05", "S08"], [s["id"] for s in order[:9]]

shots_dir = ROOT / "out" / "shots"
keep = {sid: shots_dir / f"{sid}.mp4" for sid in ("S05", "S06", "S07")}
saved = {}
for sid, p in keep.items():
    if p.exists():
        saved[sid] = AB / f"main_{sid}.mp4"; shutil.copyfile(p, saved[sid])
main_text = SJ.read_text(encoding="utf-8")
try:
    write_shots(alt, SJ)
    for sid in ("S06", "S07", "S05"):
        render(sid)
        shutil.copyfile(shots_dir / f"{sid}.mp4", AB / f"alt_{sid}.mp4")
finally:
    SJ.write_text(main_text, encoding="utf-8", newline="\n")
    for sid, p in saved.items():
        shutil.copyfile(p, shots_dir / f"{sid}.mp4")
    print("restored shots.json and the main clips")

def cut(parts, out):
    lst = AB / (out.stem + ".txt")
    lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="utf-8")
    tmp = AB / (out.stem + "_v.mp4")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(tmp)], check=True)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(tmp), "-ss", f"{F0 / 30:.4f}", "-t", f"{(F1 - F0) / 30:.4f}",
                    "-i", str(ROOT / "analysis" / "shelter.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac",
                    "-b:a", "256k", "-shortest", str(out)], check=True)
    tmp.unlink(missing_ok=True); lst.unlink(missing_ok=True)
    print("wrote", out)

S = lambda sid: shots_dir / f"{sid}.mp4"
cut([S("S04"), S("S05"), S("S06"), S("S08")], AB / "hook1_cut18order.mp4")
cut([S("S04"), AB / "alt_S06.mp4", AB / "alt_S07.mp4", AB / "alt_S05.mp4", S("S08")], AB / "hook1_alt.mp4")
