# Deploy QuestVault — Netlify + Railway + Convex Cloud

## Architecture

| Service | Hosts | URL example |
|---------|--------|-------------|
| **Netlify** | Marketing site, APK downloads | `https://questvault.netlify.app` |
| **Railway** | Expo web app (PWA) | `https://questvault-app.up.railway.app` |
| **Convex Cloud** | Backend (auth, DB, realtime) | `https://YOUR.deployment.convex.cloud` |

The web app on Railway talks to Convex via `EXPO_PUBLIC_CONVEX_URL` (baked in at build time).

---

## 1. Convex (one-time)

```powershell
cd app
npx convex login
npx convex dev   # creates deployment, writes .env.local
```

**Required for sign-up / sign-in:** Convex Auth needs JWT keys on the deployment. Without them, registration fails with a generic connection error.

```powershell
# After login, with .env.local pointing at your cloud deployment (not anonymous:):
npm run setup:auth-keys
# Or interactively:
npx @convex-dev/auth --web-server-url https://YOUR-RAILWAY-URL.up.railway.app
```

Verify in [Convex Dashboard](https://dashboard.convex.dev) → **Settings** → **Environment Variables**: `JWT_PRIVATE_KEY` and `JWKS` must be set.

**PWA push notifications (Web Push, no Firebase/OneSignal):** uses VAPID keys on Convex + public key on Railway.

```powershell
npm run setup:vapid-keys
# Copy EXPO_PUBLIC_VAPID_PUBLIC_KEY to Railway and redeploy.
```

Convex env: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. Railway: `EXPO_PUBLIC_VAPID_PUBLIC_KEY` (same as public key).

Users enable reminders on the **HERO** tab in the installed PWA. Cron runs hourly to spawn new-period quests and notify subscribers.

From [Convex Dashboard](https://dashboard.convex.dev) → your project → **Settings** → **Deploy Key** → create key for Railway CI.

Note:
- `EXPO_PUBLIC_CONVEX_URL` — public client URL (Railway variable)
- `CONVEX_DEPLOY_KEY` — secret, Railway only
- `CONVEX_DEPLOYMENT` — e.g. `dev:your-team-123` or prod deployment name

---

## 2. Railway (web app + Convex deploy)

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Set **Root Directory** → `app`
3. Railway detects `Dockerfile.railway` via `railway.toml`
4. **Variables** (Railway → Service → Variables):

| Variable | Value |
|----------|--------|
| `EXPO_PUBLIC_CONVEX_URL` | `https://YOUR.deployment.convex.cloud` |
| `CONVEX_DEPLOY_KEY` | from Convex dashboard |
| `CONVEX_DEPLOYMENT` | your deployment slug |
| `EXPO_BASE_URL` | `/` |
| `PORT` | `8080` (Railway sets automatically) |

5. Deploy → copy public URL (e.g. `https://questvault-production.up.railway.app`)

---

## 3. Netlify (marketing + downloads)

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
2. **Base directory:** `website`
3. Build command & publish are in `website/netlify.toml`
4. **Environment variables:**

| Variable | Value |
|----------|--------|
| `QV_WEB_APP_URL` | Railway URL **without** trailing slash, e.g. `https://questvault-production.up.railway.app` |

5. Upload APK: commit `website/downloads/questvault.apk` or use Netlify large-file storage

Build injects `config.js` so **INSTALAR WEB APP** buttons point to Railway.

Optional `_redirects` (auto-generated when `QV_WEB_APP_URL` is set):
```
/app/*  https://your-railway-url/:splat  302
```

---

## 4. Local test before deploy

```powershell
# Railway-like web server (after export)
cd app
$env:EXPO_PUBLIC_CONVEX_URL = "https://YOUR.deployment.convex.cloud"
$env:EXPO_BASE_URL = "/"
npm run build:web
node server.mjs

# Netlify-like marketing
cd ../website
$env:QV_WEB_APP_URL = "http://localhost:8080"
node scripts/netlify-build.mjs
npx serve .
```

---

## 5. Custom domains (optional)

- Netlify: `www.questvault.app` → marketing
- Railway: `app.questvault.app` → web PWA
- Set `QV_WEB_APP_URL=https://app.questvault.app` on Netlify

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Web app blank / 404 assets | Check `EXPO_BASE_URL=/` on Railway |
| Convex auth fails / "could not forge hero" | Run `npm run setup:auth-keys` (missing `JWT_PRIVATE_KEY` / `JWKS` on Convex) |
| Convex auth fails | `EXPO_PUBLIC_CONVEX_URL` must match deployed Convex deployment |
| PWA install missing | Railway must serve HTTPS (default on Railway) |
| APK button disabled | Add `website/downloads/questvault.apk` |
