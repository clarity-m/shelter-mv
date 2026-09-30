"""Port a style-frame HTML (single classic script) into an ES-module factory.

usage: python3 render/port_frame.py SRC.html OUT.js FACTORY_NAME "return-expr"
The script body between <script> and </script> is wrapped as
    export function FACTORY(CANVAS, LOGFN) { ...body...; return RETURN_EXPR; }
Rewires: the canvas lookup -> CANVAS, the log sink -> LOGFN, query params -> empty,
and cuts the trailing "main" block (starting at the first line that begins with
  if (Q.get('anim')  or  renderFrame(animState(FR))  at top level).
Logic is otherwise untouched.
"""
import re, sys

src_path, out_path, name, ret = sys.argv[1:5]
src = open(src_path, encoding="utf-8").read()
body = src[src.index("<script>") + len("<script>"): src.rindex("</script>")]
cut = None
for pat in [r"^if \(Q\.get\('anim'\) === '1'\) \{", r"^renderFrame\(animState\(FR\)\);"]:
    m = re.search(pat, body, re.M)
    if m and (cut is None or m.start() < cut):
        cut = m.start()
if cut is not None:
    body = body[:cut]
body = re.sub(r"const log = s => \{[^\n]*\};", "const log = s => { LOG.push(s); LOGFN(s); };", body)
body = body.replace("const Q = new URLSearchParams(location.search);", "const Q = new URLSearchParams('');")
body = re.sub(r"const cvs = document\.getElementById\('[^']+'\);", "const cvs = CANVAS;", body)
body = re.sub(r"window\.onerror = [^\n]*\n", "", body)
body = re.sub(r"^\s*['\"]use strict['\"];?[ \t]*$", "", body, count=1, flags=re.M)  # modules are strict already
out = (f"// Ported from {src_path.split('shelter-mv/')[-1]} by render/port_frame.py (logic unchanged).\n"
       f"export function {name}(CANVAS, LOGFN = () => {{}}) {{\n{body}\n  return {ret};\n}}\n")
open(out_path, "w", encoding="utf-8", newline="\n").write(out)
print(f"wrote {out_path}: {len(out)} chars, cut main at {cut}")
