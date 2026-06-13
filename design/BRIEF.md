# Pencil design brief — QuestVault screens

Source of truth: [docs/08-design-direction.md](../docs/08-design-direction.md) and [mockup/mockup.html](../mockup/mockup.html). Target file: `design/questvault.pen`.

## Design tokens (set as .pen variables first)

- Palette: Sweetie 16 — night `#1a1c2c` (bg), navy `#29366f` (cards), ink `#333c57` (borders), gold `#ffcd75` (MONEY ONLY), sky `#41a6f6` (XP), mint `#a7f070` / leaf `#38b764` (success/confirm), ember `#ef7d57` (streak/energy), blood `#b13e53` (danger), white `#f4f4f4` / fog `#94b0c2` (text), slate `#566c86` (disabled).
- Fonts: Press Start 2P (headings, celebratory numbers, min 12px), VT323 (body, ≥18px), Inter (all monetary amounts on transactional surfaces — rule D2.1).
- Chrome: no rounded corners, 3–4px solid ink borders, hard offset shadows (4px/4px, no blur), segmented progress bars, 9-slice-style panels.
- Frame size: 390 × 844 (mobile).

## Screens to design (one frame each, shared HUD + bottom nav)

1. **Quest Board** — HUD (pixel avatar, LV, XP bar, gold pouch counter); streak flame banner; quest cards (done/open/boss variants) with `+XP` (sky) and `+R$` (gold) reward lines; bottom nav BOARD/VAULT/SHOP.
2. **Vault** — chest sprite; "SEALED" locked balance (gold, Press Start); "GOLD POUCH" spendable balance; STASH GOLD (PIX) button (leaf); ledger panel with Inter amounts (+deposit mint, unlock gold, −spend ember); "Leave the dungeon" footer link (plain language).
3. **Loot Shop** — wishlist item cards: title (VT323), price (Inter, gold), gold segmented progress bar, hint line ("78 km of running to go"); ready item variant with gold border + CLAIM LOOT button; ADD TO WISHLIST ghost button.
4. **Character** — large avatar, level + XP, badge grid (boss trophies), sticker book preview, cosmetics shelf (locked items slate).
5. **Redeem confirm modal** — over dimmed Loot Shop: item, amount in Inter (large, unambiguous), balance after, CONFIRM (gold) / CANCEL; per rule R4.
6. **Onboarding — tier choice** — three cards: XP only / XP + stickers / Real loot (18+, KYC, Hero badge), per flow §9.
7. **Settings — wallet** — reward tier toggle, verification connections (Strava/Health), subscription status (Hero's License badge), withdrawal entry point.

## Component set (make reusable)

QuestCard (variants: open/done/boss), PixelButton (primary leaf / money gold / ghost), HUD bar, SegmentedProgressBar (sky XP / gold money), NavBar, PixelPanel (9-slice), LedgerRow, Modal frame.

## Hard rules for the design

- Gold color appears ONLY where real credits appear (D1).
- Money amounts on confirm/ledger/withdraw surfaces in Inter, never pixel fonts (D2.1).
- Withdrawal and KYC screens: pixel styling, plain honest language (R16, D6).
- Touch targets ≥ 44px (D7).
