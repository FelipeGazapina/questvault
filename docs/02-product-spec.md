# 02 — Product spec

## The core loop

1. **Stash gold** — user deposits their own money via Pix. It lands in the **Vault** as *locked credits* (1 credit = R$1).
2. **Take quests** — user creates or accepts quests (run 2 km, read 20 pages, no sugar today).
3. **Complete & verify** — completion grants **XP** (always) and, for funded users, **converts** a slice of locked credits into *spendable credits* (the **Gold Pouch**).
4. **Claim loot** — when the pouch covers a wishlist item, the user redeems it with an explicit confirmation. The treat was always theirs; the effort made it legitimate.

The two-balance design (locked vs. spendable) is the product's spine: it makes "the user wants and agreed to buy this" explicit, auditable, and impossible to trigger accidentally.

## Quest system

| Type | Cadence (resets, done or not) | Examples | XP (rolled at creation) | Conversion |
|---|---|---|---|---|
| Daily quest | Every day | Drink 2L water, 30-min walk | 5–15 | Small (e.g. R$2) |
| Extra quest (side quest) | Every ISO week | Clean the garage, finish a course module | 20–50 | Medium |
| Boss quest | Every calendar month | Run a 10K, finish the book | 80–200 | Large (e.g. R$25) |
| Streak bonus | Automatic | 7/30/100-day streaks | Multiplier | Multiplier (e.g. +10%) |

v1 rules (implemented): no default quests — every quest is created by the user; XP is a random roll within the type's range at creation; each quest can be completed once per period and returns when the period rolls over.

- Users set their own quests and their own conversion values, within the per-quest and daily caps defined in [03-business-rules.md](03-business-rules.md) (rules R6–R8).
- Quest templates ship in-app (fitness, study, chores, finance) so day-1 users don't face a blank page.
- **Difficulty self-rating** drives XP, not money — money conversion is capped independently so users can't inflate difficulty to unlock faster.

## Verification levels

| Level | Mechanism | Allowed conversion |
|---|---|---|
| Honor | Self check-off | Capped lower (it's their money — cheating only cheats themselves, but caps keep the ritual meaningful) |
| Evidence | Photo / timer in app | Standard caps |
| Integrated | Strava, Google Fit / Apple Health, Screen Time | Highest caps; required for streak multipliers on fitness quests |

## XP, levels and virtual rewards (all tiers, forever free)

- XP curve: standard RPG exponential (level N requires ~1.15× the XP of N−1).
- Levels unlock **cosmetics**: avatar gear, vault skins, quest-board themes, sticker-book pages. Pure pixel-art joy, no money involved.
- Level-ups are celebrated loudly (fanfare, confetti, shareable card) — they are also conversion *events*: a level-up converts a small bonus slice (rule R7).

## Reward tiers (user choice, switchable anytime)

1. **XP only** — no wallet, no stickers. The purist mode.
2. **XP + stickers** — virtual collectibles. Default for free users.
3. **XP + real loot** — the vault. Requires: 18+, KYC (via BaaS partner), active Hero subscription.

## Wishlist ("Loot Shop")

- **Phase 1:** items are `title + link + price + image (optional)`. No vault, no progress bars, no redeem — clicking opens the link; the user buys it themselves. Priced wishlist + wallet waitlist measure loot intent before Pix exists.
- **Phase 2:** vault opens (first time users see money UI). Redemption triggers a Pix payout of the item's price back to the user's bank account; progress bars show `pouch / price`.
- **Phase 3:** redemption pays directly — Pix QR scan at checkout or the QuestVault prepaid card (auto-approved only up to the spendable balance).

## Screens (MVP — Phase 1)

1. **Quest Board** — today's quests, streak flame, XP bar.
2. **Loot Shop** — wishlist (title, price, link); no money progress or redeem until Phase 2.
3. **Character** — avatar, level, badges, sticker book.
4. **Quest Log** — stats and recent victories (implemented as LOG tab).
5. **Settings / Hero** — reward tier, language, subscription, wallet waitlist.

**Phase 2 adds:** Vault screen — locked balance (chest, sealed), spendable balance (gold pouch), ledger history, stash via Pix, redeem flow.

See [mockup/mockup.html](../mockup/mockup.html) for the pixel-art rendering of screens 1–3.

## Explicitly out of scope (v1)

- Social feeds, guilds, PvP (Phase 4 candidates — streaks and badges are shareable as images instead).
- Marketplace integrations beyond link-out (no iFood/Amazon API dependency before Phase 3).
- Android/iOS native widgets, wearables (post-MVP).
