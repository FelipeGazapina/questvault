# PWA Web Push — period quest notifications

## Research

**Can we do push without third-party SDKs (Firebase, OneSignal)?** Yes.

PWA push uses the **Web Push Protocol** (W3C) with **VAPID** keys:
- Browser vendors run the push service (Chrome → Google, Firefox → Mozilla, Safari 16.4+ → Apple).
- We self-host: generate VAPID keys, store subscriptions in Convex, send via `web-push` npm from a Convex `"use node"` action.
- No Firebase/OneSignal account required.

## Behavior

When a new period starts (daily / ISO week / month):
1. Hourly Convex cron (`crons.ts`) runs `push.runPeriodPushCron`.
2. For each user with an active push subscription, `processUserPeriodPushes` summons quests from their pool (`spawnForType`).
3. If new instances were spawned and no push was sent yet for that user/type/period, a Web Push is delivered.

## Client

- Toggle on **HERO** tab (`PushNotificationsToggle`, web only).
- Requires `EXPO_PUBLIC_VAPID_PUBLIC_KEY` at build time (Railway).
- Service worker `public/sw.js` handles `push` and `notificationclick`.

## Setup (production)

```powershell
cd app
npm run setup:vapid-keys
# Add EXPO_PUBLIC_VAPID_PUBLIC_KEY to Railway → redeploy
```

## Tests

```powershell
npm test   # convex/pushMessages.test.mjs (6 tests)
```

## Files

| Area | Path |
|------|------|
| Pure logic + tests | `convex/pushMessages.ts`, `convex/pushMessages.test.mjs` |
| Subscriptions + cron | `convex/push.ts`, `convex/crons.ts` |
| Delivery | `convex/pushActions.ts` |
| SW | `app/public/sw.js` |
| Client | `src/lib/push-notifications.web.ts`, `src/components/push-notifications-toggle.web.tsx` |
