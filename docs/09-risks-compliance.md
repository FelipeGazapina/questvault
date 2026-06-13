# 09 — Risks & compliance

Plain-language map of the serious stuff. Get a fintech-specialized lawyer before Phase 2 contracts — this doc frames the conversation, it doesn't replace it.

## Regulatory (Brazil)

| Topic | Reality | Our posture |
|---|---|---|
| Holding user balances | Prepaid payment accounts are regulated by the Central Bank (BCB) — "instituição de pagamento" territory | We never hold funds directly: accounts live at a licensed BaaS partner; we are the interface (Phases 2–3) |
| BaaS tightening | BCB Joint Resolution 16/2025 raises compliance bars for BaaS arrangements (existing ones must comply by end of 2026) | Treat it as a vendor filter: contract only partners that are clearly compliant; ask for their 16/2025 adequacy plan in the RFP |
| Withdrawal rights | Prepaid balances must be redeemable by the holder | Already constitutional in our rules (R2) — friction allowed, refusal and fees are not |
| KYC/AML | Required for payment accounts | Performed by the BaaS partner; we gate the wallet to 18+ KYC-passed users (R5) |
| Card issuing | Issuer licensing + PCI DSS | Via issuer-processor partner (Pomelo/Dock model); card data never touches our servers |

## "Is this gambling?" — no, and keep it that way

No chance, no stakes, no loss: the user's money never depends on randomness, can always be withdrawn in full, and the platform never takes the other side of any outcome. **Guardrails that keep it true:** no random rewards tied to money (loot boxes with real credits would change the legal analysis — cosmetics-only randomness, if ever), no betting against other users, no platform-funded prizes contingent on outcomes.

## LGPD

- Quest history, wishlist and health-integration data are intimate behavioral data: minimal collection, no resale, no ad targeting (R15). DPIA before Phase 2.
- KYC documents: held by the BaaS partner as controller for that purpose — keep it out of our scope explicitly in the contract.
- Health integrations (Strava/Apple Health/Google Fit): store derived facts ("quest verified"), not raw activity streams, where possible.

## Product risks (honest list)

| Risk | Mitigation |
|---|---|
| The loop isn't fun without real money, and fintech is far away | Phase 1 gate exists precisely for this; waitlist + priced wishlist measure deposit intent without play-gold (avoids trust/migration risk at Pix launch) |
| Users deposit, lose motivation, feel trapped → reputational damage | R2 + R10: always-free withdrawal with honest screens; "we never keep your money" in marketing |
| Average vault too small for float/interchange to matter | Acceptable — subscription carries the model; fintech revenue is upside, not load-bearing |
| BaaS partner outage at a checkout moment (Phase 3) | Payout model (Phase 2) remains as fallback path; card and QR are additive, not replacements |
| Self-set conversion values feel meaningless ("I'll just set everything to max") | Caps (R7) + the social meaning layer later; remember R13 — money integrity is not at risk, only personal meaning |
| App-store rules on real-money features | The wallet is fintech, not in-app purchase of digital goods — same category as Nubank/PicPay; subscriptions stay in-store billing. Confirm store policy review before Phase 2 launch |

## Support & operations (Phase 2 prerequisites)

- Human support path for money issues with SLA (money questions can't wait 5 days).
- Reconciliation: daily automated ledger-vs-partner statement check; divergence pages a human (see [06-architecture.md](06-architecture.md)).
- Incident runbook: deposit-not-credited, payout-not-arrived, card-declined-wrongly — each with user-facing status messaging.
