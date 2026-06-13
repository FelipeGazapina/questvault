# 05 — Flows (drawn)

All diagrams are Mermaid: they render on GitHub and in VS Code. For slides, export from [mermaid.live](https://mermaid.live).

## 1. Credit lifecycle (the spine of the product)

```mermaid
stateDiagram-v2
    [*] --> Locked: Pix deposit (cash-in)
    Locked --> Spendable: verified quest completion / level-up bonus
    Locked --> Withdrawn: user abandons (7-day cooldown, free)
    Spendable --> Spent: wishlist redemption (explicit confirm)
    Spendable --> Withdrawn: user withdraws (no cooldown, free)
    Spent --> [*]
    Withdrawn --> [*]
```

Rules in play: R1 (always the user's money), R6 (only effort converts), R10 (withdrawal friction, never fees).

## 2. Deposit — "Stash gold" (Phase 2+)

```mermaid
sequenceDiagram
    actor U as User
    participant App
    participant BE as Backend
    participant BaaS as BaaS partner (licensed)
    U->>App: Stash R$100
    App->>BE: create deposit intent
    BE->>BaaS: create Pix charge
    BaaS-->>App: Pix QR / copy-paste code
    U->>BaaS: pays from their own bank
    BaaS-->>BE: webhook payment confirmed
    BE->>BE: ledger entry +100 locked
    BE-->>App: vault animation (chest fills)
```

## 3. Quest completion → conversion

```mermaid
flowchart TD
    A[Quest marked complete] --> B{Verification passes?}
    B -- no --> X[Retry / stays open]
    B -- yes --> C[Grant XP, update streak]
    C --> D{Wallet active and funded?}
    D -- no --> E[Virtual rewards only]
    D -- yes --> F{Daily conversion cap reached? R7}
    F -- yes --> E
    F -- no --> G["Convert min(quest value, locked balance) R8"]
    G --> H[Ledger: locked → spendable]
    H --> I[Gold pouch animation + running total]
```

## 4. Redemption — Phase 2 (payout model)

```mermaid
sequenceDiagram
    actor U as User
    participant App
    participant BE as Backend
    participant BaaS as BaaS partner
    U->>App: Redeem "Headset R$180" from Loot Shop
    App->>U: confirm screen — amount, destination, R4
    U->>App: confirm
    BE->>BE: ledger: spendable −180 → pending payout
    BE->>BaaS: Pix payout to user's own bank account
    BaaS-->>BE: webhook payout settled
    BE-->>App: "Loot claimed!" + opens item link
    U->>U: buys the item themselves with the money
```

## 5. Redemption — Phase 3a (Pix QR scan at any checkout)

```mermaid
sequenceDiagram
    actor U as User
    participant App
    participant BE as Backend
    participant BaaS as BaaS partner
    participant M as Merchant (iFood, store)
    M-->>U: shows Pix QR at checkout
    U->>App: scans QR inside QuestVault
    App->>BE: decode BR Code (EMV)
    BE->>BaaS: decode + DICT lookup
    BaaS-->>BE: merchant name + amount
    BE-->>App: confirm screen — "Pay R$54,90 to iFood?" (R4)
    U->>App: confirm
    BE->>BE: check spendable ≥ amount
    BE->>BaaS: Pix cash-out from user's account
    BaaS-->>BE: settled
    BE-->>App: paid — ledger: spendable → spent
```

## 6. Redemption — Phase 3b (app card, JIT authorization)

The killer mechanism: the quest-gate is enforced at the point of sale, at any merchant on earth, with zero merchant integration.

```mermaid
sequenceDiagram
    actor U as User
    participant M as Merchant
    participant Net as Card network
    participant Iss as Issuer processor (BaaS)
    participant BE as Backend
    U->>M: pays with QuestVault card
    M->>Net: authorization request
    Net->>Iss: forward
    Iss->>BE: real-time authorization webhook
    BE->>BE: spendable ≥ amount? user toggled card on?
    BE-->>Iss: approve / decline
    Iss-->>Net: response
    Net-->>M: approved
    BE->>BE: ledger: spendable → spent
    BE-->>U: push — "Loot claimed: R$54,90 🪙"
```

## 7. Withdrawal — "Leaving the dungeon"

```mermaid
flowchart TD
    A[User requests withdrawal] --> B{Which balance?}
    B -- spendable --> C[No cooldown — it was earned]
    B -- locked --> D[Honest impact screen: streaks, open boss quests]
    D --> E{Confirm?}
    E -- no --> Z[Vault stays sealed]
    E -- yes --> F[7-day cooldown R10 — cancellable anytime]
    F --> G[Pix payout to user's own bank]
    C --> G
    G --> H[Ledger: → withdrawn. Always 100%, always free R2]
```

## 8. Subscription lapse (rule R12)

```mermaid
flowchart LR
    A[Hero subscription lapses] --> B[Wallet → withdraw-only mode]
    B --> C[No new deposits or conversions]
    B --> D[Spendable stays redeemable]
    B --> E[Full withdrawal always available]
    A --> F{Re-subscribes ≤ 30 days?}
    F -- yes --> G[Everything restored, streaks intact]
    F -- no --> H[Streaks reset, balances untouched]
```

## 9. Onboarding & tier choice

```mermaid
flowchart TD
    A[Install] --> B[Create character - pixel avatar]
    B --> C[Pick 3 starter quests from templates]
    C --> D[First quest completed → first XP + sticker]
    D --> E{Reward tier choice}
    E -- XP only --> F[Purist mode]
    E -- XP + stickers --> G[Free default]
    E -- Real loot --> H{18+, KYC, Hero subscription?}
    H -- yes --> I[Vault opens — first deposit]
    H -- not yet --> J[Wallet waitlist + Hero trial]
```
