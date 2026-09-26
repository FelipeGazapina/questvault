# QuestVault Deploy — Live (2026-06-12)

## Production URLs

| Service | URL |
|---------|-----|
| **Marketing (Netlify)** | https://questvaultrpg.netlify.app |
| **Web app / PWA (Railway)** | https://questvault.lypes.agency (CNAME → Railway; also https://questvault-production.up.railway.app) |
| **Backend (Convex)** | https://shocking-greyhound-787.convex.cloud (production) |
| **GitHub** | https://github.com/FelipeGazapina/questvault |

## Config

- Netlify base directory: `website`
- `QV_WEB_APP_URL` in `website/netlify.toml` → Railway URL (build injects `config.js`)
- Railway project `questvault` / service `questvault`: root `/app`, Dockerfile `Dockerfile.railway`, deploys from `main`
- Convex backend: pushed by the **Convex deploy** GitHub workflow (secret `CONVEX_DEPLOY_KEY`)
- Android APK: **Android APK** GitHub workflow → `android-latest` release
- Convex deployment: `prod:shocking-greyhound-787` (the old `dev:doting-wren-467` holds v1 data only)

## Verify after deploy

1. https://questvaultrpg.netlify.app/config.js → `QV_WEB_APP_URL` points to Railway
2. Marketing **Instalar Web App** opens Railway PWA
3. Railway app loads login and connects to Convex (not localhost)
