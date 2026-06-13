# Design workspace (Pencil)

The QuestVault screens live in `questvault.pen` — open it in the Pencil desktop app. Final PNGs (2×) are in [exports/](exports/), ready for decks.

## Screens

| Export | Screen |
|---|---|
| `01-quest-board.png` | Quest Board — HUD, streak, daily/boss quest cards |
| `02-vault.png` | The Vault — sealed balance, gold pouch, stash button, ledger |
| `03-loot-shop.png` | Loot Shop — wishlist items with gold progress bars, claim flow |
| `04-character.png` | Character — avatar, boss trophies, sticker book, cosmetics |
| `05-redeem-confirm.png` | Redeem confirm modal — rule R4/D2.1 (amounts in clean sans) |
| `06-tier-choice.png` | Onboarding — XP only / XP + stickers / Real loot |
| `07-wallet-settings.png` | Settings — tier, verification, Hero's License, withdrawal |
| `08-dungeon-theme.png` | Dungeon theme screen — brick wall, torches, gate, open chest on pedestal, the four heroes |
| `09-sign-in.png` / `10-sign-up.png` | Auth screens — implemented with Convex Auth |
| `11-quest-log.png` | Quest Log dashboard — stat cards, 7-day pixel bar chart, recent victories (implemented as the LOG tab) |
| `12-quest-pool.png` | Quest Pool — task library by type (DAILY / SIDE QUEST / BOSS), add-to-pool form, Nav Bar App (5 tabs) |
| `13-loot-shop-icons.png` | Loot Shop — wishlist cards with pixel loot icons + icon picker on add form |
| `14-landing-web.png` | Marketing landing page — hero, steps, download, future tease (see `website/`) |

Sprite variants (4×) live in [exports/sprites/](exports/sprites/): `hero-knight`, `hero-mage`, `hero-rogue`, `chest-iron`, `chest-mythic`, `chest-open`.

**Loot icons** (wishlist picker, 4×): `headset`, `pizza`, `gamepad`, `sneaker`, `book`, `phone`, `coffee`, `gift`. Source script: [b4-loot-icons.js](b4-loot-icons.js). App PNGs: `app/assets/sprites/loot/`. Regenerate with `node render-loot-icons.mjs`.

## How this was built (and how to edit it)

Pencil's MCP server (bundled with the desktop app) is driven through [pencil-mcp.mjs](pencil-mcp.mjs), a small stdio JSON-RPC bridge:

```powershell
node pencil-mcp.mjs list                                  # list design tools
node pencil-mcp.mjs call get_editor_state '{}'            # inspect active document
node pencil-mcp.mjs call batch_design '@s1-questboard.js' # run a design script
node pencil-mcp.mjs call get_screenshot '{"nodeId": "..."}'
```

Requirements: Pencil desktop app running with `questvault.pen` as the active editor tab.

The `b2/b3/s1…s7` files are the design source scripts (Pencil `batch_design` JS). Node IDs inside them are bound to this document instance — if you regenerate the file from scratch, re-run them in order and update the IDs each script references (component IDs are printed by each run).

## Design system in the file

- Variables: full Sweetie 16 palette (`$night`, `$gold`, `$navy`…) + `$font-head` (Press Start 2P), `$font-body` (VT323), `$font-money` (Inter).
- Reusable components: Sprite Coin / Chest / Flame / Hero, character variants (Knight, Mage, Rogue), chest variants (Iron, Mythic, Open), Pixel Button, Quest Card, **Pool Row**, HUD, Nav Bar, **Nav Bar App** (BOARD · POOL · SHOP · LOG · HERO), Ledger Row.
- Source of truth for the rules: [docs/08-design-direction.md](../docs/08-design-direction.md).
