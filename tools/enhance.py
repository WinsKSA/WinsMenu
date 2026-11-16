"""Build display copies of every photo: upscaled with Lanczos (max 3x), lightly sharpened.
assets/mid   -> up to 1200px, for banners, feature cards and the dish sheet
assets/thumb -> 640px, for the small cards (product photos only)
Also records each product photo's true source width in data/menu.js (field "w")."""
import os, glob, json
from PIL import Image, ImageFilter, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
for d in ("assets/mid", "assets/thumb"):
    os.makedirs(d, exist_ok=True)

# optional AI upscaler: OpenCV dnn_superres + FSRCNN models in tools/models (falls back to Lanczos)
SR = {}
try:
    import cv2, numpy as np
    from cv2 import dnn_superres
    for s in (2, 3):
        m = os.path.join("tools", "models", f"FSRCNN_x{s}.pb")
        if os.path.exists(m):
            sr = dnn_superres.DnnSuperResImpl_create(); sr.readModel(m); sr.setModel("fsrcnn", s); SR[s] = sr
except Exception:
    SR = {}

def enhance(src):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    k = min(1200 / max(w, h), 3.0)
    if k > 1.02:
        s = 3 if k > 2 else 2
        if k > 1.3 and s in SR:                    # neural upscale, then settle to the target size
            out = SR[s].upsample(cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2BGR))
            im = Image.fromarray(cv2.cvtColor(out, cv2.COLOR_BGR2RGB))
        im = im.resize((round(w * k), round(h * k)), Image.LANCZOS)
        im = im.filter(ImageFilter.UnsharpMask(radius=2.0, percent=70, threshold=2))
    elif k < 1:
        im = im.resize((round(w * k), round(h * k)), Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.0, percent=45, threshold=2))
    im = ImageEnhance.Contrast(im).enhance(1.04)
    return im, w

def save(im, path, q):
    """Write via memory with retries: the drive sometimes refuses a file that is being read."""
    import io, time
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=q, optimize=True, progressive=True)
    for attempt in range(8):
        try:
            with open(path, "wb") as f:
                f.write(buf.getvalue())
            return
        except OSError:
            time.sleep(.5 + attempt * .5)
    raise OSError("could not write " + path)

js = open("data/menu.js", encoding="utf-8").read()
menu = json.loads(js[len("window.MENU="):].rstrip().rstrip(";"))
product = {os.path.basename(i["img"]): i for c in menu for s in c["sections"] for i in s["items"] if i.get("img")}

n = 0
for p in glob.glob("assets/img/*.jpg"):
    name = os.path.basename(p)
    im, w = enhance(p)
    save(im, "assets/mid/" + name, 85)
    if name in product:
        t = im.copy(); t.thumbnail((640, 640), Image.LANCZOS)
        save(t, "assets/thumb/" + name, 88)
    n += 1
for c in menu:
    for s in c["sections"]:
        for i in s["items"]:
            if i.get("img"):
                i["w"] = Image.open(i["img"]).size[0]
                i["thumb"] = "assets/thumb/" + os.path.basename(i["img"])
open("data/menu.js", "w", encoding="utf-8").write("window.MENU=" + json.dumps(menu, ensure_ascii=False, separators=(",", ":")) + ";")
print("enhanced", n)
