# 08 — Design direction: pixel-art game

The app should feel like opening a cozy RPG, not a to-do list. Reference points: Stardew Valley's UI warmth, classic SNES menu chrome, Habitica's avatar charm — but executed as a *real* game UI, not a productivity app with pixel clipart.

## D1 — Palette

Base palette: **Sweetie 16** (a beloved 16-color pixel-art palette — constraint is the aesthetic):

| Role | Hex | Use |
|---|---|---|
| Night | `#1a1c2c` | App background |
| Deep purple | `#5d275d` | Panels, shadows |
| Blood | `#b13e53` | Danger, streak-loss warnings |
| Ember | `#ef7d57` | Streak flame, energy |
| **Gold** | `#ffcd75` | **Money. Reserved exclusively for credits/coins** |
| Mint | `#a7f070` | Success, quest complete |
| Leaf | `#38b764` | Confirm buttons |
| Teal dark | `#257179` | Secondary panels |
| Navy | `#29366f` | Cards |
| Blue | `#3b5dc9` | Info, links |
| Sky | `#41a6f6` | XP bar |
| Ice | `#73eff7` | Highlights |
| White | `#f4f4f4` | Primary text |
| Fog | `#94b0c2` | Secondary text |
| Slate | `#566c86` | Disabled, borders |
| Ink | `#333c57` | Panel borders |

Rule: **gold (`#ffcd75`) is sacred** — it appears only where real credits appear. The user's eye learns that gold = my money.

## D2 — Typography

- **Headings / numbers that celebrate:** Press Start 2P (Google Fonts) — the 8-bit voice. Minimum 12px, generous line-height (1.8); it's dense.
- **Body / quest text:** VT323 or Pixelify Sans — pixel flavor at readable sizes (≥ 18px).
- **D2.1 — Financial legibility exception (non-negotiable):** every confirmation screen, ledger row, and withdrawal flow shows amounts in a clean sans (Inter/system) alongside the pixel chrome — `R$ 54,90` must never be ambiguous. Charm everywhere, clarity where money moves (pairs with rule R4).

## D3 — Components as game UI

| App concept | Game rendering |
|---|---|
| Locked credits | **The Vault** — a chest with a padlock; deposit animation drops coins in |
| Spendable credits | **Gold Pouch** — coin counter in the HUD, coins fly in on conversion |
| Quest list | **Quest Board** — wooden board with pinned notes |
| Progress | HP-bar style segmented bars (XP = sky blue, item progress = gold) |
| Wishlist | **Loot Shop** — shop shelf; items show "X quests away" |
| Subscription | **Hero's License** — a badge, not a paywall screen |
| Withdrawal | **Leaving the dungeon** — honest, non-shaming door scene |
| Buttons | Chunky 4px borders, hard offset shadows (4px 4px 0), pressed = shadow collapses |
| Panels | 9-slice pixel frames, no rounded corners, no gradients except 2-stop sky |

## D4 — Motion & feel

- Animations stepped at 8–12 fps (`steps()` easing) — smooth tweens break the fiction.
- Level-up: full-screen fanfare, pixel confetti, shareable card auto-generated (organic marketing).
- Conversion moment: coins arc from quest card into the pouch with a count-up. This 1.5s animation IS the product — invest in it.
- Chiptune SFX (coin clink, quest-complete jingle), master mute prominent, off by default in public (respect the adult user).

## D5 — Avatar & character

Pixel avatar (16×16 grid upscaled, nearest-neighbor) with unlockable cosmetics per level. Avatar appears on the Quest Board and in shareable cards. Cosmetics are the free tier's reward economy — keep them genuinely desirable.

## D6 — Voice & writing

- Game vocabulary everywhere: "Stash gold", "Boss quest", "Claim loot", "Streak flame".
- Never game-ify the scary parts dishonestly: withdrawal, KYC and subscription cancellation use plain language with pixel *styling* only (pairs with R16).
- PT-BR first; keep terms like "quest", "boss", "loot" untranslated — Brazilian gamers use them natively.

## D7 — Accessibility

- Every pixel font has a "readable mode" toggle swapping to Inter at equal sizes.
- Contrast: all text pairs from the palette table must pass WCAG AA on `#1a1c2c` / `#29366f` (white and fog pass; never slate-on-navy for body text).
- `prefers-reduced-motion`: stepped animations become instant state changes; confetti becomes a static badge.
- Touch targets ≥ 44px regardless of how small the pixel art renders.

## D8 — Money display rules (recap, enforced in design review)

1. Amounts in clean sans on any screen where money moves (D2.1).
2. Gold color only for money (D1).
3. Every confirm screen shows: amount, destination, balance after (R4).
4. The ledger is always one tap from the Vault (R14).

## Mockup

[mockup/mockup.html](../mockup/mockup.html) renders the Quest Board, Vault and Loot Shop in this system — open in a browser, present full-screen. It's the visual north star for Figma work in Phase 0.
