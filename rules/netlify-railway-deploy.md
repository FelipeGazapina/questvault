# Netlify + Railway deployment setup

## Done in repo

- `website/netlify.toml` + `scripts/netlify-build.mjs` — marketing site, injects `QV_WEB_APP_URL`
- `app/railway.toml` + `Dockerfile.railway` + `server.mjs` — Expo web PWA + `convex deploy` on build
- `app/app.config.js` — `EXPO_BASE_URL=/` on Railway, `/app` for local Netlify embed
- `docs/DEPLOY.md` — full variable list

## Browser tool

User skill: `npm i -g agent-browser` (not `browse`). Installed globally; Chromium at `~/.agent-browser/browsers/`.

```powershell
agent-browser open https://app.netlify.com/start
agent-browser snapshot -i
```

Cursor browser MCP opened Netlify (Google login) + Railway new project.

## User must complete (requires login)

### Netlify
1. Sign in → Import Git repo `questvault`
2. Base directory: `website`
3. Env: `QV_WEB_APP_URL` = Railway URL after step 2
4. Add `website/downloads/questvault.apk` when ready

### Railway
1. New Project → GitHub → repo, root `app`
2. Variables: `EXPO_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOY_KEY`, `CONVEX_DEPLOYMENT`, `EXPO_BASE_URL=/`
3. Copy public URL → paste into Netlify `QV_WEB_APP_URL`

### Convex
1. dashboard.convex.dev → Deploy Key for Railway
2. Production deployment URL → `EXPO_PUBLIC_CONVEX_URL`
