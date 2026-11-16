# ونس برو — Menu

Animated, phone-first menu for Wanas Pro (restaurant + café).

- Open `index.html` directly, or serve the folder: `python -m http.server 5181`
- `?intro=1` replays the welcome gate.
- Refresh prices, photos and calories from the live easymenu site: `python tools/scrape.py` (needs Pillow for thumbnails).

Files: `index.html`, `styles.css`, `app.js` (UI, motion, search, sheets), `audio.js` (generated music + UI sounds), `data/menu.js` (menu data), `assets/` (logo mask, photos, thumbnails).
