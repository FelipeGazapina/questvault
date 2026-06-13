# 03 — Business rules (the company rules)

Numbered, enforceable, and ordered by importance. Every feature decision must be checked against these. R1–R5 are constitutional: changing them requires rewriting the pitch, the compliance doc, and the user promise.

## Money (constitutional)

- **R1 — The money is always the user's.** The platform never funds rewards, never lends, never invests user balances in anything beyond the BaaS partner's safeguarded accounts. 1 credit = R$1, always, in both directions.
- **R2 — Withdrawal is always possible and always free.** Locked or spendable, the user can withdraw their full balance to their own bank account at any time. Friction is allowed (rule R10); fees and refusal are not. *(This is also a regulatory requirement for prepaid balances — see [09-risks-compliance.md](09-risks-compliance.md).)*
- **R3 — No fees on the loop.** Deposits are free. Conversions are free. Redemptions are free. Revenue comes from subscriptions, float and interchange only ([04-monetization.md](04-monetization.md)).
- **R4 — Every spend is explicitly confirmed.** No redemption, payment or card activation happens without a per-transaction confirmation showing the exact amount in plain, legible currency formatting (design rule D8). No "auto-buy when affordable" — ever.
- **R5 — The wallet is adults-only and KYC'd.** Wallet activation requires 18+, identity verification through the BaaS partner, and an active paid subscription. Free and underage users get the full game with virtual rewards.

## Conversion mechanics

- **R6 — Only effort converts.** Locked → spendable happens exclusively through verified quest completions and level-up bonuses. Money cannot buy conversion (no "pay R$5 to unlock R$50" — that would be a fee in disguise and would kill the meaning of the product).
- **R7 — Conversion sources and caps.** Each quest defines its conversion value at creation time, bounded by: per-quest cap (default R$25 for boss, R$5 daily/side), daily cap (default R$30/day), and streak multipliers up to +25%. Level-ups convert a bonus equal to 1% of the locked balance (min R$1, max R$20). All caps are configurable per user *downward* (users may make their own game harder, never easier).
- **R8 — Conversion never exceeds the vault.** If locked balance < quest value, convert what exists. Conversion of money that isn't there is impossible by ledger design (see [06-architecture.md](06-architecture.md)).
- **R9 — Editing a quest resets its money.** Changing a quest's conversion value or verification level after creation requires a 24h cooldown before the new value applies (prevents "retroactive grading").

## Withdrawal & abandonment

- **R10 — Withdraw with honesty friction.** Withdrawal of *locked* credits starts a 7-day cooldown ("leaving the dungeon") with a clear, non-shaming screen showing what's lost (streak bonuses, in-progress boss quests). Spendable credits withdraw with no cooldown — they were already earned. Both are always free (R2).
- **R11 — Inactivity.** After 12 months of zero activity on a funded account, the user is contacted; after legally mandated dormancy procedures, funds follow the BaaS partner's escheatment rules. Funds never become platform revenue.

## Subscription interaction

- **R12 — Cancel ≠ confiscate.** If the subscription lapses, the wallet enters **withdraw-only mode**: no new deposits or conversions, but spendable credits remain redeemable and full withdrawal stays available (R2). Re-subscribing reactivates everything, streaks intact for 30 days.

## Integrity

- **R13 — Cheating is self-harm, not fraud.** A user who fakes quests only unlocks their own money — the platform's exposure is zero. Therefore: no invasive anti-cheat. Verification levels exist to protect *meaning* (and social features later), not money.
- **R14 — The ledger is the truth and the user sees all of it.** Every credit movement (deposit, conversion, redemption, withdrawal) is an immutable double-entry record, fully visible in-app with plain-language descriptions.

## Data & conduct

- **R15 — LGPD by design.** Wishlist contents, quest history and health-integration data are sensitive behavioral data: collected minimally, never sold, never used for ads. Financial KYC data lives at the BaaS partner, not on our servers.
- **R16 — Never exploit the mechanism.** No dark patterns: no countdown pressure to deposit, no "your friends deposited more", no interstitials pushing wallet activation to free users more than once per month. The product's moral position — *we make discipline fun, we don't monetize anxiety* — is a feature.
