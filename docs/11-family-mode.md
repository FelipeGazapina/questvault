# 11 — Family mode: guardians and adventurers

QuestVault is now a family app. A parent (the **Guardião**) runs the family: they forge missions, judge deliveries, stock the market and decide which of each child's apps are free, timed or blocked. Each child (an **Aventureiro**) plays on their own phone (or on the parent's phone via profile switching): they finish missions with proof, choose their reward, and spend it.

Design source: the "QuestVault — Redesign RPG" design canvas (dark leather + brass UI, pixel-art props and scenes). Art generators live in [design/family/](../design/family/README.md).

## Roles and devices

| Who | Signs in with | Sees |
|---|---|---|
| Guardian | Email + password | `/guardiao`: Painel, Aprovações, Missões, Recompensas, Apps (+ Revisar, Nova missão, Avisos, Ajustes) |
| Adventurer on their own phone | Anonymous sign-in + a 6-digit pairing code from the guardian (valid 30 min) | `/aventureiro`: Missões, Loja, Meu tempo |
| Adventurer on the parent's phone | The guardian's session, via "Quem está jogando" | Same child screens; leaving the profile asks for the guardian PIN (if set) |

Every backend function derives identity from the auth token. A paired child device can only act as its own adventurer; a guardian can act as any adventurer of their family (`convex/access.ts`).

## The loop

1. **Guardian forges a mission** (`missions.createMission`): assignees, frequency (once / daily / weekly), appear time and deadline, required proof (photo, written-or-audio report), reward type and difficulty (XP 15 / 40 / 80).
2. **Runs spawn per period** (`missionRuns`): daily runs appear at the mission's appear time; weekly runs are due Sunday at the deadline; once-missions spawn a single run. The cron (`tick.run`, every 5 min) spawns and announces them.
3. **Adventurer finishes** (`missions.submitRun`) in the *Finalizar missão* dialog: photos (camera or library), a text **or** audio report, and — when the mission offers "moedas ou tempo" — the reward they want.
4. **Guardian judges** (`missions.decide`) from *Aprovações* / *Revisar entrega*: approve (with an optional message) or ask for a redo (with the reason).
5. **Approval grants** the chosen reward and XP (levels roll over, streak updates). The adventurer is notified, and the **decision dialog** opens the next time they open the app (`unseenDecisions` → `markSeen`). A redo sends the run back with the guardian's note; resubmitting replaces the old proof.

## Rewards

| Reward | What happens on approval |
|---|---|
| Moedas | Added to the adventurer's coins — spent in the market |
| Tempo de tela | A time grant that expires after `timeExpiryDays` (default 7) |
| Item | A pending purchase the guardian delivers in real life |
| Moedas ou tempo | The adventurer picks when finishing |

- **Market** (`rewards.*`): items and time packs priced in coins. Buying an item notifies the guardian ("Marcar como entregue").
- **Screen time** (`rewards.startScreenTime`): spends banked minutes, oldest-expiring first, capped by the family's daily maximum; a "5 min left" push is scheduled.
- **Allowance (mesada)**: optional exchange of 100-coin blocks into the adventurer's cofre (default R$ 5,00 per 100 coins). Money is shown with `brl()` in a clean sans.

## Apps

Each adventurer has an app list (`appRules`) where every app is **Livre** (always open), **Tempo** (opens while screen time is running) or **Bloqueado**. Telefone and Mensagens are essential and always free. "Bloqueio ativo" toggles the whole policy.

> **Enforcement needs a native companion.** Blocking other apps is not possible from a PWA or an Expo managed app. It requires a native build using Apple's Screen Time API (Family Controls entitlement) on iOS and Device Admin / Accessibility / UsageStats on Android. The backend already stores the policy and the running session (`screenSessions`) for that companion to read.

## Notifications

Every notice is stored in `notifications` (kind + params) and mirrored to Web Push. Copy is rendered per locale by `convex/pushMessages.ts`, shared by the push action and the in-app inbox.

| When | Who | Kind |
|---|---|---|
| A run spawns (cron or new mission) | Adventurer | `mission_new` / `missions_new` |
| 30 min before a deadline | Adventurer | `deadline_child` |
| Before a deadline (pref, default 30 min) | Guardian | `deadline_guardian` |
| A delivery arrives (pref) | Guardian | `submission` |
| A delivery waits too long (pref, default 2 h) | Guardian | `pending_reminder` |
| Approved / redo | Adventurer | `approved` / `rejected` |
| Market purchase (pref) | Guardian | `purchase` |
| Guardian gives time | Adventurer | `time_gift` |
| 5 min of screen time left | Adventurer | `time_low` |
| Daily summary (pref, default 21:00) | Guardian | `daily_summary` |

Quiet hours: pushes to adventurers wait until the family bedtime ends (default 21:30–07:00); pushes to the guardian wait out their own silence window (default 22:00–07:00). The inbox entry is written immediately either way. Each push is tagged per mission run, so a newer update replaces an older one on the lock screen.

## Data model (Convex)

`families` (settings + guardian prefs + PIN hash) · `adventurers` · `pairingCodes` · `missions` (templates) · `missionRuns` (one per adventurer per period, holds proof and decision) · `shopItems` · `timePacks` · `purchases` · `timeGrants` · `screenSessions` · `appRules` · `notifications` · `pushSubscriptions`. The old single-player tables (`questPool`, `questInstances`, `wishlist`, `ledger`, `pushPeriodDispatches`) stay in the schema, unused, so existing deployments keep validating.

Pure rules (XP, levels, ranks, local time with a fixed family UTC offset, quiet windows, time-bank spending, streaks) live in `convex/rules.ts` and are unit-tested (`npm test`).
