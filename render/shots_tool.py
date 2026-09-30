"""Edit shots.json fields from the command line, keeping one shot per line.

usage: python3 render/shots_tool.py S21 shift0=-18 [S20 shift1=-18 ...]
Values are parsed as JSON when possible (numbers, lists, null), else kept as strings.
key=null deletes the field.
"""
import json, sys

P = "C:/Users/USER/Projects/shelter-mv/shots.json"
d = json.load(open(P, encoding="utf-8"))
by = {s["id"]: s for s in d["shots"]}
cur = None
for a in sys.argv[1:]:
    if "=" not in a:
        cur = by[a]
        continue
    k, v = a.split("=", 1)
    try:
        v = json.loads(v)
    except json.JSONDecodeError:
        pass
    if v is None:
        cur.pop(k, None)
    else:
        cur[k] = v
lines = ["{", ' "note": ' + json.dumps(d["note"], ensure_ascii=False) + ",", ' "shots": [']
for i, s in enumerate(d["shots"]):
    lines.append("  " + json.dumps(s, ensure_ascii=False) + ("," if i < len(d["shots"]) - 1 else ""))
lines += [" ]", "}", ""]
open(P, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
print("ok")
