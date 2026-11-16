"""Scrape the Wanas Pro easymenu site into data/menu.json + assets/img/."""
import json, os, re, sys, html, urllib.request, concurrent.futures as cf
from html.parser import HTMLParser

BASE = "https://wins-pro-lounge.easymenu.site"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "assets", "img")
os.makedirs(IMG_DIR, exist_ok=True)
os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0"}

def get(url, binary=False):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        b = r.read()
    return b if binary else b.decode("utf-8", "replace")

def clean(s):
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", html.unescape(s)).strip()

def subcats(page):
    out = []
    for m in re.finditer(r'data-link="([^"]+)"\s+data-id="(\d+)">(.*?)</a>', page, re.S):
        link, sid, inner = m.groups()
        img = re.search(r'<img src="([^"]+)"', inner)
        name = clean(re.search(r"<label[^>]*>(.*?)</label>", inner, re.S).group(1))
        out.append({"id": sid, "link": link, "name": name, "img": img.group(1) if img else ""})
    return out

def products(page):
    out = []
    blocks = re.split(r'<div data-url="[^"]+/product/', page)[1:]
    for b in blocks:
        pid = re.match(r"(\d+)", b).group(1)
        name = clean(re.search(r'product-name[^>]*>(.*?)</h5>', b, re.S).group(1))
        desc = re.search(r'<p class="description"[^>]*>(.*?)</p>', b, re.S)
        head = b.split("product-description", 1)[0]
        cal = re.search(r'class="pl-1 calories"[^(]{0,300}\((\d+)', head)
        price = re.search(r'product-price.*?<span[^>]*>\s*([\d.]+)', b, re.S)
        img = re.search(r'product-image.*?<img[^>]*?(?:data-src|src)="([^"]+)"', b, re.S)
        out.append({
            "id": pid, "name": name,
            "desc": clean(desc.group(1)) if desc else "",
            "cal": int(cal.group(1)) if cal else None,
            "price": float(price.group(1)) if price else None,
            "img": img.group(1) if img else "",
        })
    return out

menu = []
for cid, key, label in [(32253, "restaurant", "مطعم"), (32254, "cafe", "كافيه")]:
    page = get(f"{BASE}/category/{cid}")
    secs = []
    for s in subcats(page):
        items = products(get(s["link"]))
        secs.append({"id": s["id"], "name": s["name"], "img": s["img"], "items": items})
        print(label, s["name"], len(items), file=sys.stderr)
    menu.append({"key": key, "name": label, "sections": secs})

# download images
urls = set()
for c in menu:
    for s in c["sections"]:
        urls.add(s["img"])
        for i in s["items"]:
            urls.add(i["img"])
urls.discard("")

def local(u):
    return "assets/img/" + os.path.basename(u)

def dl(u):
    p = os.path.join(ROOT, local(u))
    if not os.path.exists(p):
        open(p, "wb").write(get(u, True))

with cf.ThreadPoolExecutor(8) as ex:
    list(ex.map(dl, urls))

PLACEHOLDER = "6a7e167dc62269.39036086.jpg"  # site's generic branch photo
for c in menu:
    for s in c["sections"]:
        s["img"] = local(s["img"]) if s["img"] else ""
        for i in s["items"]:
            i["img"] = "" if (not i["img"] or PLACEHOLDER in i["img"]) else local(i["img"])

json.dump(menu, open(os.path.join(ROOT, "data", "menu.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# thumbnails for list tiles (full size stays for the detail sheet)
try:
    from PIL import Image
    os.makedirs(os.path.join(ROOT, "assets", "thumb"), exist_ok=True)
    for c in menu:
        for s in c["sections"]:
            for i in s["items"]:
                if not i["img"]:
                    i["thumb"] = ""
                    continue
                src = os.path.join(ROOT, i["img"])
                dst = "assets/thumb/" + os.path.basename(i["img"])
                if not os.path.exists(os.path.join(ROOT, dst)):
                    im = Image.open(src).convert("RGB")
                    im.thumbnail((640, 640), Image.LANCZOS)
                    im.save(os.path.join(ROOT, dst), quality=86, optimize=True, progressive=True)
                i["thumb"] = dst
except ImportError:
    print("Pillow missing: no thumbnails", file=sys.stderr)

# medium copies (1200px) for banners, feature cards and the dish sheet
try:
    import glob
    os.makedirs(os.path.join(ROOT, "assets", "mid"), exist_ok=True)
    for p in glob.glob(os.path.join(IMG_DIR, "*.jpg")):
        d = os.path.join(ROOT, "assets", "mid", os.path.basename(p))
        if not os.path.exists(d):
            im = Image.open(p).convert("RGB"); im.thumbnail((1200, 1200), Image.LANCZOS)
            im.save(d, quality=86, optimize=True, progressive=True)
except NameError:
    pass

# page data
for c in menu:
    for s in c["sections"]:
        s["name"] = " ".join(s["name"].split())
        for i in s["items"]:
            i.pop("id", None)
            if i["price"] is not None and i["price"] == int(i["price"]):
                i["price"] = int(i["price"])
with open(os.path.join(ROOT, "data", "menu.js"), "w", encoding="utf-8") as f:
    f.write("window.MENU=" + json.dumps(menu, ensure_ascii=False, separators=(",", ":")) + ";")
print("items:", sum(len(s["items"]) for c in menu for s in c["sections"]), "images:", len(urls), file=sys.stderr)
