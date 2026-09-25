# QuestVault

> Working title. A life-gamification app where completing real-life quests unlocks your own money to spend on things you already wanted.

> **Now a family app:** parents (Guardião) forge missions and approve their children's deliveries; children (Aventureiro) earn coins, screen time and items. See [docs/11-family-mode.md](docs/11-family-mode.md). The docs below describe the original single-player concept.

**One-liner:** Other habit apps pay you in XP. Real games pay you in loot. QuestVault locks your own money in a vault — and your real-life quests are the key.

## The core insight

Every successful game pairs XP with a tangible reward (Fortnite: skins and V-Bucks). Life-gamification apps copied the XP and forgot the loot. QuestVault fixes that — without the app ever spending its own money: the user deposits their own funds, and effort (not payment) converts them into spendable rewards from their wishlist.

It is a **reward-framed commitment device**: Beeminder and stickK punish failure (you lose money); QuestVault celebrates success (you unlock a treat that was always yours).

## Repository map

| Doc | Contents |
|---|---|
| [01-vision.md](docs/01-vision.md) | Problem, insight, positioning, target audience |
| [02-product-spec.md](docs/02-product-spec.md) | Core loop, quests, XP, reward tiers, wishlist, verification |
| [03-business-rules.md](docs/03-business-rules.md) | The company rules — numbered, enforceable policies |
| [04-monetization.md](docs/04-monetization.md) | Subscription tiers, float, interchange, what we never charge |
| [05-flows.md](docs/05-flows.md) | All money and product flows, drawn (Mermaid) |
| [06-architecture.md](docs/06-architecture.md) | Entities/ERD, ledger design, stack, BaaS integration |
| [07-roadmap.md](docs/07-roadmap.md) | Phases 0–3 with gates, KPIs and kill criteria |
| [08-design-direction.md](docs/08-design-direction.md) | Pixel-art design system: palette, fonts, components, game vocabulary |
| [09-risks-compliance.md](docs/09-risks-compliance.md) | BCB/BaaS regulation, LGPD, withdrawal rights, not-gambling |
| [10-pitch-outline.md](docs/10-pitch-outline.md) | 12-slide presentation skeleton |
| [11-family-mode.md](docs/11-family-mode.md) | **Family mode** — guardian/adventurer roles, missions with proof, approvals, rewards, screen time, apps, notifications |
| [mockup/mockup.html](mockup/mockup.html) | Pixel-art app mockup — open in a browser, use in presentations |
| [website/](website/README.md) | **Marketing landing page** — download APK, store badges coming soon, PT/EN |
| [docs/DEPLOY.md](docs/DEPLOY.md) | **Netlify + Railway + Convex** deployment guide |
| [design/family/](design/family/README.md) | Pixel-art props and scene generators for the family redesign |
| [design/](design/README.md) | Pencil design file (`questvault.pen`) — 8 screens, design-system variables, reusable components; PNG exports in `design/exports/` |
| [app/](app/README.md) | **Family app** — React Native (Expo) + Convex; guardian and adventurer areas, missions with photo/audio proof, approvals, market, screen time, app policy, Web Push |

## The three phases at a glance

1. **Phase 1 — MVP (no money UI).** Paid app (freemium subscription): quests, XP, stickers, wishlist as title + link + price, wallet waitlist. No play-gold — validates the gamification loop alone without a fake economy to migrate later.
2. **Phase 2 — Proof of concept (credits + payouts).** Users deposit via Pix; quests unlock credits; redemption = Pix payout back to the user, who buys the item themselves through the link.
3. **Phase 3 — Platform.** The app pays directly: scan a Pix QR code at any checkout, or pay with the app-issued prepaid card whose authorizations are approved in real time against the user's converted balance.

## How the money works (never forget this)

- It is **always the user's money**. The app never funds rewards and never blocks withdrawal.
- The deposit is free. The redemption is free. Revenue comes from subscriptions, float yield on held balances, and card interchange — never from taxing the loop.

## Viewing the diagrams

All flows in [docs/05-flows.md](docs/05-flows.md) are Mermaid — they render natively on GitHub and in VS Code (with the Mermaid extension). For slides, screenshot the rendered diagrams or export via [mermaid.live](https://mermaid.live).
