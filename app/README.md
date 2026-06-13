# QuestVault — Phase 1 app

React Native (Expo SDK 56) + Convex. Phase 1 scope: the pure game — quests, XP, stickers, wishlist only. **No money UI** (no play-gold, no vault tab). Real Pix and the vault debut together in Phase 2 (see [docs/07-roadmap.md](../docs/07-roadmap.md)).

## Run it

Two terminals:

```powershell
# 1. Backend — local Convex deployment (anonymous, no account needed)
cd app
$env:CONVEX_AGENT_MODE = 'anonymous'   # skip the interactive login prompt
npx convex dev

# 2. App
npx expo start          # then press a (Android), i (iOS), w (web)
```

`npx convex dev` writes `EXPO_PUBLIC_CONVEX_URL` into `.env.local` automatically. The anonymous deployment stores data under `~/.convex` — when you create a Convex account later, run `npx convex login` to link it and deploy to the cloud.

Note for phone testing: `EXPO_PUBLIC_CONVEX_URL=http://127.0.0.1:3210` only works in emulators/web. On a physical device, replace `127.0.0.1` with your machine's LAN IP.

## What's implemented (Phase 1 checklist)

- Sign in / Sign up — email + password (Convex Auth), pixel-styled screens, hero-name field on sign-up. Full feedback: loading labels ("FORGING YOUR HERO..." / "ENTERING THE DUNGEON..."), error panel with shake animation, inline blocker hints. Sign-up is gated by the **pixel padlock**: the lock forges piece by piece as password rules are met (8+ chars → letter → number → symbol or 12+); when the lock completes it turns gold, pulses "SECURE!", and registration unlocks
- Quest Board — users forge their own quests (no starter/default quests). XP is **rolled at creation** within the type's range: daily 5–15, extra 20–50, boss 80–200 (`convex/game.ts` → `XP_RANGES`). Quests recur by period whether completed or not — daily resets every day, extra every ISO week, boss every calendar month — and can be completed once per period. Streaks, level-ups, completion toast
- Loot Shop — wishlist only (title + price + link), OPEN LINK button; no progress bars or claim flow until Phase 2
- Quest Log (LOG tab) — completed-quest dashboard: stat cards, last-7-days pixel bar chart, recent victories list. Data from `quests.dashboard`
- Character — avatar, XP progress, name, stats, reward-tier selector (XP only / XP + stickers), level-gated cosmetic avatars
- Wallet waitlist CTA — measures Phase 2 deposit intent (surface outside the hidden vault screen when wired for launch)
- Business rules for conversion/ledger exist in Convex for Phase 2 reuse ([convex/game.ts](convex/game.ts), [convex/vault.ts](convex/vault.ts)) but are inactive while `FEATURES.vault` is off

## Phase 1: no money UI (by design)

`src/lib/features.ts` has `FEATURES.vault = false`: the Vault tab, gold pouch, R$ conversion lines on quests, progress bars, and the claim flow stay hidden. The Loot Shop is pure wishlist storage (title + price + link, with an OPEN LINK button).

**Why:** Play-gold was removed from Phase 1 — a fake economy would complicate the Pix launch and erode trust when real money arrives. Vault UI and ledger code remain in the repo for Phase 2; enable `FEATURES.vault` only when BaaS + Pix ship together, not before.

## Languages (i18n)

PT-BR and EN-US via i18next ([src/i18n/](src/i18n/)). Device language is auto-detected (expo-localization); users switch in HERO → LANGUAGE / IDIOMA, persisted in AsyncStorage. To add a language: copy `en.ts`, translate, register it in `src/i18n/index.ts` (`resources` + `SUPPORTED_LANGUAGES`). Note: never touch AsyncStorage at module top level — Expo Router's web server renders modules in Node and crashes (that's why `initStoredLanguage()` runs from a layout effect).

## Structure

```
convex/            backend: schema.ts, game.ts (balance constants), users.ts, quests.ts, vault.ts, shop.ts
src/app/           screens: index (Board), vault, shop, hero + _layout (tabs, fonts, Convex provider)
src/components/    pixel.tsx (PixelText/Button/Panel/SegBar/ConfirmModal), hud.tsx
src/lib/           palette.ts (Sweetie 16 + brl()), user-context.tsx (deviceId → Convex user)
assets/sprites/    pixel art exported from design/questvault.pen
```

- Identity: **Convex Auth** (email + password via `@convex-dev/auth`). Sign-in/sign-up screens match the Pencil designs; sessions persist via expo-secure-store on native (localStorage on web). Every backend function derives the user from the auth token (`requireUser`) — no client-supplied user ids. `users.ensureGameUser` seeds starter quests on first sign-in. Sign out lives on the Hero screen.
- Money values are integer cents everywhere; rendered with `brl()` in a clean sans font, never pixel fonts (design rule D2.1).
- Wishlist images: Convex file storage backend is ready (`shop.generateUploadUrl` / `shop.setImage` / URLs resolved in `shop.list`) — the image-picker UI is not wired yet.

## Not in Phase 1 (deliberately)

Real money, Pix, KYC, subscriptions billing (tier choice is a free toggle for now), push notifications, social. See the roadmap for gates.
