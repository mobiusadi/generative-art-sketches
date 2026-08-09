#!/usr/bin/env python3
"""
Regenerates gallery/dashboard.html.
Reads scripts/gallery-metadata.json for title/category/description on
known sketches. Any .html file in gallery/ NOT in that file still gets
included automatically, under a "Generative Sketches" catch-all category,
with an auto title-cased name. Nothing in gallery/ is ever silently dropped.

Usage: python3 scripts/build-dashboard.py   (run from repo root)
"""
import os
import json

BASE_DIR = os.path.dirname(__file__)
GALLERY_DIR = os.path.join(BASE_DIR, "..", "gallery")
META_PATH = os.path.join(BASE_DIR, "gallery-metadata.json")
FALLBACK_CATEGORY = "Generative Sketches"

CATEGORY_ORDER = [
    "Geometric Engines",
    "Architecture & Structure",
    "Physics & Nature",
    "Visuals & Effects",
    FALLBACK_CATEGORY,
]

def load_metadata():
    if os.path.exists(META_PATH):
        with open(META_PATH) as f:
            return json.load(f)
    return {}

def auto_title(filename):
    name = filename.replace(".html", "")
    return name.replace("-", " ").replace("_", " ").title()

def main():
    meta = load_metadata()
    files = sorted(
        f for f in os.listdir(GALLERY_DIR)
        if f.endswith(".html") and f != "dashboard.html"
    )

    by_category = {c: [] for c in CATEGORY_ORDER}
    for f in files:
        m = meta.get(f)
        if m:
            cat = m.get("category", FALLBACK_CATEGORY)
            desc = m.get("desc", "")
            tag = m.get("tag", "")
        else:
            cat = FALLBACK_CATEGORY
            desc = ""
            tag = ""
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append({
            "file": f,
            "title": auto_title(f),
            "desc": desc,
            "tag": tag,
        })

    sections_html = ""
    for cat in CATEGORY_ORDER:
        entries = by_category.get(cat, [])
        if not entries:
            continue
        cards = ""
        for e in entries:
            tag_html = f'<span class="tag">{e["tag"]}</span>' if e["tag"] else ""
            desc_html = f'<span class="meta">{e["desc"]}</span>' if e["desc"] else ""
            cards += f'''
      <div class="file-link" onclick="openSketch('{e["file"]}')">
        {tag_html}<span class="name">{e["title"]}</span>{desc_html}
      </div>'''
        sections_html += f'''
    <div class="category"><h2>{cat}</h2></div>{cards}'''

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><title>Generative Archive</title>
<style>
:root {{ --bg:#111; --panel:#1a1a1a; --text:#eee; --dim:#888; --accent:#00ffff; --accent-dim:rgba(0,255,255,.1); --border:#333; }}
body {{ background:var(--bg); color:var(--text); font-family:'Courier New',monospace; margin:0; padding:20px; }}
header {{ max-width:1200px; margin:0 auto 30px; border-bottom:2px solid var(--border); padding-bottom:20px; }}
h1 {{ font-size:24px; text-transform:uppercase; letter-spacing:2px; margin:0 0 15px; color:var(--accent); }}
input#search {{ width:100%; background:var(--panel); border:1px solid var(--border); color:var(--text); padding:15px; font-family:inherit; font-size:16px; box-sizing:border-box; outline:none; }}
input#search:focus {{ border-color:var(--accent); background:#222; }}
.container {{ max-width:1200px; margin:0 auto; display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:20px; }}
.category {{ grid-column:1/-1; margin-top:30px; margin-bottom:10px; border-bottom:1px solid var(--border); padding-bottom:5px; }}
.category h2 {{ font-size:14px; color:var(--dim); text-transform:uppercase; margin:0; }}
.file-link {{ display:block; background:var(--panel); padding:12px 15px; color:var(--text); border:1px solid var(--border); transition:all .2s ease; font-size:13px; cursor:pointer; }}
.file-link:hover {{ border-color:var(--accent); background:var(--accent-dim); transform:translateX(5px); }}
.file-link .name {{ display:block; margin-bottom:4px; font-weight:bold; color:#fff; }}
.file-link .meta {{ font-size:10px; color:var(--dim); text-transform:uppercase; letter-spacing:1px; }}
.tag {{ float:right; font-size:9px; background:#333; padding:2px 6px; border-radius:4px; color:var(--accent); }}
.hidden {{ display:none; }}
#modal {{ display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,.95); z-index:1000; flex-direction:column; }}
#modal-close {{ align-self:flex-end; margin:15px 25px; font-size:40px; cursor:pointer; color:#fff; border:none; background:transparent; }}
#modal-close:hover {{ color:var(--accent); }}
#viewer {{ width:95%; height:85%; margin:0 auto; border:none; background:#fff; border-radius:4px; }}
</style>
</head>
<body>
<header>
<h1>Architectural Intelligence // Index</h1>
<input type="text" id="search" placeholder="Filter scripts (e.g. 'golden', 'v5')..." onkeyup="filterList()">
</header>
<div class="container" id="file-list">{sections_html}
</div>
<div id="modal">
<button id="modal-close" onclick="closeSketch()">&times;</button>
<iframe id="viewer" src=""></iframe>
</div>
<script>
function openSketch(url) {{ document.getElementById('viewer').src=url; document.getElementById('modal').style.display='flex'; }}
function closeSketch() {{ document.getElementById('viewer').src=''; document.getElementById('modal').style.display='none'; }}
function filterList() {{
  const filter = document.getElementById('search').value.toUpperCase();
  const links = document.getElementById('file-list').getElementsByClassName('file-link');
  for (let i = 0; i < links.length; i++) {{
    const txt = links[i].textContent || links[i].innerText;
    links[i].classList.toggle('hidden', txt.toUpperCase().indexOf(filter) === -1);
  }}
}}
</script>
</body>
</html>"""

    with open(os.path.join(GALLERY_DIR, "dashboard.html"), "w") as out:
        out.write(html)

    described = sum(1 for f in files if f in meta)
    print(f"Wrote dashboard.html with {len(files)} sketches ({described} described, {len(files)-described} fallback)")

if __name__ == "__main__":
    main()
