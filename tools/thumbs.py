"""Preview only: save small copies of the deal photos and hero photos, because the preview sandbox can't load other sites."""
import hashlib, json, pathlib, httpx
out = pathlib.Path("probe/img"); out.mkdir(parents=True, exist_ok=True)
deals = json.loads(pathlib.Path("data/deals.json").read_text())
def small(u):
    if "scene7.com" in u: return u.split("?")[0] + "?wid=320&hei=320&fit=fit&fmt=jpg&qlt=70"
    if "delhaize.be" in u: return u.split("&imwidth")[0] + "&imwidth=300"
    if "imgproxy" in u: return u.replace("/w:427/h:320/", "/w:320/h:240/")
    return u
c = httpx.Client(timeout=30, follow_redirects=True, headers={"User-Agent": "DealFinderBot/0.1 (preview thumbnails)"})
m = {}
for d in deals:
    u = d.get("image_url")
    if not u: continue
    name = hashlib.md5(u.encode()).hexdigest()[:12] + ".jpg"
    try:
        r = c.get(small(u)); r.raise_for_status(); (out / name).write_bytes(r.content); m[u] = "img/" + name
    except Exception as e: print("fail", u, e)
for k, u in {"hero1": "https://images.unsplash.com/photo-1757609909192-0246239198c0?auto=format&fit=crop&w=1100&q=70&fm=jpg",
             "hero2": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=70&fm=jpg",
             "hero3": "https://images.unsplash.com/photo-1775227612415-4569328d9631?auto=format&fit=crop&w=800&q=70&fm=jpg"}.items():
    try:
        r = c.get(u); r.raise_for_status(); (out / f"{k}.jpg").write_bytes(r.content)
    except Exception as e: print("fail", k, e)
pathlib.Path("probe/img-map.json").write_text(json.dumps(m))
print(len(m), "thumbs")
