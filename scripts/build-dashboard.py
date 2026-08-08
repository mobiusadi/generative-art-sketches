#!/usr/bin/env python3
"""
Regenerates gallery/dashboard.html by scanning every .html file
currently sitting in the gallery/ folder. Run this any time you add
a new sketch, then git add/commit/push as usual.

Usage: python3 scripts/build-dashboard.py   (run from repo root)
"""
import os

GALLERY_DIR = os.path.join(os.path.dirname(__file__), "..", "gallery")

def main():
    files = sorted(
        f for f in os.listdir(GALLERY_DIR)
        if f.endswith(".html") and f != "dashboard.html"
    )

    cards = ""
    for f in files:
        title = f.replace(".html", "").replace("sketch-", "").replace("-", " ").title()
        cards += f'''
    <div class="card" onclick="openSketch('{f}')">
      <div class="title">{title}</div>
    </div>'''

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><title>Generative Archive</title>
<style>
body {{ margin:0; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; background:#121212; color:#fff; }}
h1 {{ text-align:center; margin:40px 0 20px; font-weight:300; letter-spacing:4px; color:#e0e0e0; }}
.gallery {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:20px; padding:30px; max-width:1400px; margin:0 auto; }}
.card {{ background:#1e1e1e; border-radius:8px; overflow:hidden; cursor:pointer; transition:transform .2s,box-shadow .2s; box-shadow:0 4px 10px rgba(0,0,0,.5); padding:30px 10px; text-align:center; }}
.card:hover {{ transform:translateY(-5px); box-shadow:0 8px 15px rgba(0,0,0,.8); }}
.title {{ font-size:15px; color:#b0b0b0; letter-spacing:1px; }}
#modal {{ display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,.95); z-index:1000; flex-direction:column; }}
#modal-close {{ align-self:flex-end; margin:15px 25px; font-size:40px; cursor:pointer; color:#fff; border:none; background:transparent; }}
#modal-close:hover {{ color:#f7941d; }}
#viewer {{ width:95%; height:85%; margin:0 auto; border:none; background:#fff; border-radius:4px; }}
</style>
</head>
<body>
<h1>GENERATIVE ARCHIVE</h1>
<div class="gallery">{cards}
</div>
<div id="modal">
<button id="modal-close" onclick="closeSketch()">&times;</button>
<iframe id="viewer" src=""></iframe>
</div>
<script>
function openSketch(url) {{ document.getElementById('viewer').src=url; document.getElementById('modal').style.display='flex'; }}
function closeSketch() {{ document.getElementById('viewer').src=''; document.getElementById('modal').style.display='none'; }}
</script>
</body>
</html>"""

    with open(os.path.join(GALLERY_DIR, "dashboard.html"), "w") as out:
        out.write(html)

    print(f"Wrote dashboard.html with {len(files)} sketches")

if __name__ == "__main__":
    main()
