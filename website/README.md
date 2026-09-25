# QuestVault — marketing site

Landing page for QuestVault's family mode (Guardião + Aventureiro). It uses the same visual system as the app: dark wood and brass frames, Cinzel + Alegreya Sans, pixel props and scenes from `app/assets/rpg/`.

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
| `styles.css` | Tokens mirroring `app/src/lib/theme.ts` (frames, slots, brass buttons) |
| `main.js` | i18n (PT/EN), mobile nav, web app + APK availability checks |
| `config.js` | `QV_WEB_APP_URL` / `QV_APK_URL` (generated on Netlify by `scripts/netlify-build.mjs`) |
| `assets/rpg/` | Scenes and sprites copied from `app/assets/rpg/` |
| `downloads/questvault.apk` | Optional local APK fallback (used when `QV_APK_URL` is empty) |

## Sync art from the app

```powershell
Copy-Item app/assets/rpg/* website/assets/rpg/ -Recurse -Force
```

## Android APK

The **Android APK** GitHub workflow (`.github/workflows/android-apk.yml`) builds a release APK on every push to `main` that touches `app/`, and publishes it to the `android-latest` release. On Netlify, `scripts/netlify-build.mjs` checks that URL and writes it to `config.js` as `QV_APK_URL`, so the download button only turns on once the file exists. Override with the `QV_APK_URL` env var.

## Deploy

Upload the `website/` folder to any static host (Cloudflare Pages, Netlify, S3, GitHub Pages). If you host the APK yourself, ensure `downloads/questvault.apk` is served with correct MIME type (`application/vnd.android.package-archive`).

## Pencil

Screen mock: `design/s10-landing.js` — run with Pencil desktop + `node design/pencil-mcp.mjs call batch_design "@s10-landing.js"`.
