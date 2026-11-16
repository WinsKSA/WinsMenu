"""Generate QR codes for the live menu: plain SVG/PNG for print + a branded card."""
import os, segno
from PIL import Image, ImageDraw, ImageFont, ImageFilter

URL = "https://winsksa.github.io/WinsMenu/"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "qr")
os.makedirs(OUT, exist_ok=True)

INK, CREAM, GOLD = "#0d0a07", "#f3e8d4", "#c8913f"

qr = segno.make(URL, error="h")          # high error correction: survives print wear
qr.save(os.path.join(OUT, "menu-qr.svg"), scale=10, border=4, dark=INK, light=CREAM)
qr.save(os.path.join(OUT, "menu-qr-plain.png"), scale=20, border=4)  # black on white, safest for print

# branded card ----------------------------------------------------------
W, H = 1200, 1650
card = Image.new("RGB", (W, H), INK)
d = ImageDraw.Draw(card)

# warm glow behind the logo
glow = Image.new("L", (W, H), 0)
ImageDraw.Draw(glow).ellipse((150, 40, W - 150, 520), fill=150)
glow = glow.filter(ImageFilter.GaussianBlur(120))
card.paste(Image.new("RGB", (W, H), "#ff9f45"), (0, 0), glow)

# real wordmark (dark letters + amber rim, like the backlit sign)
mask = Image.open(os.path.join(ROOT, "assets", "logo-mask.png")).getchannel("A").point(lambda v: 0 if v < 40 else v)
lw = 760; lh = round(mask.height * lw / mask.width)
mask = mask.resize((lw, lh), Image.LANCZOS)
lx, ly = (W - lw) // 2, 150
rim = mask.filter(ImageFilter.GaussianBlur(10))
card.paste(Image.new("RGB", (lw, lh), "#ffcf8a"), (lx, ly), rim)
card.paste(Image.new("RGB", (lw, lh), "#120c07"), (lx, ly), mask)

# QR on a cream plate
import io
_mods = qr.symbol_size(scale=1, border=3)[0]; _sc = 760 // _mods
_buf = io.BytesIO(); qr.save(_buf, kind="png", scale=_sc, border=3, dark=INK, light=CREAM); _buf.seek(0)
qimg = Image.open(_buf).convert("RGB")
qs = qimg.size[0]
pad = 36
px, py = (W - qs) // 2, 600
d.rounded_rectangle((px - pad, py - pad, px + qs + pad, py + qs + pad), radius=48, fill=CREAM, outline=GOLD, width=4)
card.paste(qimg, (px, py))

# Latin caption (Pillow can't shape Arabic without raqm, so the Arabic lives in the logo)
def font(sz):
    for f in ("C:/Windows/Fonts/segoeuisb.ttf", "C:/Windows/Fonts/arialbd.ttf"):
        if os.path.exists(f):
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default()
cap_y = py + qs + pad + 70
for text, sz, col, gap in (("SCAN FOR THE MENU", 54, CREAM, 0), ("RESTAURANT  ·  CAFÉ", 34, GOLD, 80),
                           (URL.replace("https://", ""), 28, "#8d7b60", 140)):
    f = font(sz); w = d.textlength(text, font=f)
    d.text(((W - w) / 2, cap_y + gap), text, font=f, fill=col)

card.save(os.path.join(OUT, "menu-qr-card.png"), optimize=True)
print("ok", [f for f in os.listdir(OUT)])
