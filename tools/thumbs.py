"""Preview only: save small copies of the deal photos and hero photos, because the preview sandbox can't load other sites."""
import hashlib, json, pathlib, httpx
out = pathlib.Path("probe/img"); out.mkdir(parents=True, exist_ok=True)
deals = json.loads(pathlib.Path("data/deals.json").read_text())
def small(u):
    if "scene7.com" in u: return u.split("?")[0] + "?wid=320&hei=320&fit=fit&fmt=jpg&qlt=70"
    if "delhaize.be" in u: return u.split("&imwidth")[0] + "&imwidth=300"
    if "imgproxy" in u: return u  # signed URLs: any change gives 403
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
pathlib.Path("probe/img-map.json").write_text(json.dumps(m))
print(len(m), "thumbs")
