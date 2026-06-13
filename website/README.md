# QuestVault — marketing site

Pixel-art landing page for the game. **Phase 1 messaging only** — no vault, money, or roadmap spoilers. Future section is a vague tease.

## Preview locally

Any static file server works:

```powershell
cd website
npx --yes serve .
# open http://localhost:3000
```

Or open `index.html` directly (APK check needs a server for `fetch` HEAD).

## PWA (install from browser)

The **game** is the Expo web export at `/app/`, not the marketing homepage.

### Build once

```powershell
node website/scripts/build-pwa.mjs
```

This generates icons, runs `expo export --platform web`, and writes to `website/app/`.

### Local test

```powershell
cd website
npx --yes serve .
```

1. Open `http://localhost:3000/app/`
2. Chrome/Edge: address bar install icon, or the in-app **INSTALL** banner
3. iOS Safari: Share → **Add to Home Screen**

Marketing buttons **INSTALAR WEB APP** / **ABRIR WEB APP** link to `/app/` and enable when the build exists.

### Production

- Deploy `website/` over **HTTPS**
- Set `EXPO_PUBLIC_CONVEX_URL` before export (production Convex URL)
- `app.json` uses `experiments.baseUrl: "/app"` so assets resolve under `/app/`

## Structure

| Path | Purpose |
|---|---|
| `index.html` | Single-page site (PT/EN) |
| `styles.css` | Sweetie 16 design tokens |
| `main.js` | i18n, mobile nav, APK availability check |
| `assets/sprites/loot/` | Pixel loot icons (sync from `app/assets/sprites/loot/`) |
| `downloads/questvault.apk` | Direct Android install (you add the build) |

## Sync loot icons after Pencil edits

```powershell
node design/render-loot-icons.mjs
Copy-Item app/assets/sprites/loot/* website/assets/sprites/loot/ -Force
```

## Deploy

Upload the `website/` folder to any static host (Cloudflare Pages, Netlify, S3, GitHub Pages). Ensure `downloads/questvault.apk` is served with correct MIME type (`application/vnd.android.package-archive`).

## Pencil

Screen mock: `design/s10-landing.js` — run with Pencil desktop + `node design/pencil-mcp.mjs call batch_design "@s10-landing.js"`.
