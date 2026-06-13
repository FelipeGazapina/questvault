# Wishlist loot icons (pixel art picker)

## Done
- **Pencil:** `design/b4-loot-icons.js` — 8 reusable loot sprites (headset, pizza, gamepad, sneaker, book, phone, coffee, gift) in `questvault.pen`.
- **Export:** `design/render-loot-icons.mjs` writes `app/assets/sprites/loot/*.png` (64×64, 4× scale). Re-run after editing pixel grids in `b4-loot-icons.js`.
- **App:** `app/src/lib/loot-icons.ts` catalog; `shop.tsx` icon picker on add form; cards show chosen icon.
- **Backend:** `wishlist.iconId` in schema; `shop.add` requires validated `iconId` (`convex/lootIcons.ts`).
- **i18n:** `shop.pickIcon`, `shop.icon*` labels (EN + PT).
- **Design screen:** `design/s9-loot-shop-icons.js` — Loot Shop with icon picker mock.

## Pencil commands
```powershell
node design/pencil-mcp.mjs call batch_design "@b4-loot-icons.js"
node design/pencil-mcp.mjs call batch_design "@s9-loot-shop-icons.js"
node design/render-loot-icons.mjs
```

## Icons
| id | use case |
|---|---|
| headset | audio / gaming gear |
| pizza | food delivery |
| gamepad | games / console |
| sneaker | shoes / fitness gear |
| book | reading |
| phone | gadgets |
| coffee | café / treats |
| gift | generic (default) |
