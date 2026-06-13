# 07 — Roadmap

Each phase has an entry gate (don't start until), an exit gate (don't advance until), and kill criteria (stop and rethink if). Dates are placeholders — replace with your sprint reality.

## Phase 0 — Foundation (4–6 weeks)

Design system in Figma (pixel-art kit), ledger module + core entities, quest engine, character/XP system.

- **Exit gate:** internal build where one user can create quests, complete them, gain XP, level up.

## Phase 1 — MVP: the game (3–4 months)

**Scope:** Quest Board, Loot Shop as wishlist only (title + link + price — no vault, no balances, no conversion), Character screen, stickers, streaks, subscriptions (Hero tier), **wallet waitlist CTA**. No money UI of any kind — not real money, not play-gold.

**Why no play-gold in Phase 1:** A fake-money vault would train the wrong mental model, create migration debt (users who learned on play balances, ledger paths exercised without BaaS), and risk confusion or trust damage when Pix and real credits land in Phase 2. The vault debuts once, with real money and the full compliance stack — not as a reskin of a toy economy.

- **KPIs:** D1/D7/D30 retention, quests completed per user/week, free→Hero conversion, waitlist signup rate, wishlist items added per user.
- **Exit gate (all must hold):**
  - D30 retention ≥ 20% (gamer benchmark; below this no fintech will save the product)
  - ≥ 4% of MAU on Hero
  - ≥ 20% of MAU joined the wallet waitlist or added at least one priced wishlist item (deposit intent without fake money)
- **Kill criteria:** D7 < 15% after two iteration cycles → the loop itself isn't fun; fix the game, freeze fintech plans.

## Phase 2 — Proof of concept: real gold, payout model (2–3 months after gate)

**Scope:** **First public vault** — BaaS integration (KYC, Pix cash-in, Pix payout), locked vs spendable balances, quest conversion, redemption = Pix payout + open link, full ledger UI, reconciliation jobs, support runbook. Real money from the first vault interaction; no play-gold phase.

- **Vendor track (parallel, starts during Phase 1):** quote Celcoin + QI Tech (accounts/Pix) and Pomelo + Dock (cards, for Phase 3); legal review of the BaaS contract; LGPD DPIA.
- **KPIs:** waitlist→funded conversion, average vault size, deposits per funded user/month, withdrawal rate, support tickets per 100 deposits.
- **Exit gate:** ≥ 30% of waitlist funds a vault; average vault ≥ R$100; reconciliation divergence = 0 across 60 days; withdrawal rate < 20%/quarter.
- **Kill criteria:** funded conversion < 10% → demand for the money layer is weak; the product may be a great game with virtual rewards only — that's a fine business, descope fintech.

## Phase 3a — Pix at any checkout (2 months)

QR scan → decode → confirm → cash-out. The "the app paid for my lunch" moment.

- **Exit gate:** ≥ 40% of redemptions migrate from payout to direct Pix; payment failure rate < 1%.

## Phase 3b — The QuestVault card (3 months)

Prepaid card (virtual first, physical later) with JIT authorization against the spendable balance. Interchange revenue begins.

- **KPIs:** card activation rate, card spend per funded user, auth decline rate (should be mostly "insufficient spendable" — i.e., the mechanic working), interchange revenue.

## Phase 4 — Horizon (unscoped)

Guilds/duo quests (shared boss quests, both must complete), savings-goal vaults ("lock R$2.000 for a trip, unlock by training for it"), employer wellness (B2B sponsors fund employee vaults — first time third-party money appears, new rules needed), international (swap BaaS for Unit/Stripe stack, lose Pix, keep the card).

## Sequencing logic (why this order)

1. Phase 1 risks only development time — it validates fun, the thing money can't fix. Virtual rewards only; no money-shaped UI to unwind later.
2. Phase 2 ships the vault and Pix together — one honest money story from day one of the feature.
3. Phase 2's payout model keeps us out of merchant integration entirely while proving people will deposit.
4. Phase 3a/3b are pure UX upgrades on proven demand, and 3b makes the gate enforceable anywhere on earth with zero merchant work.
