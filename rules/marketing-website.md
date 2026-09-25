# Marketing website

## Location
`website/` — static landing page that follows the app's design system (dark wood + brass, Cinzel, Alegreya Sans, pixel props and scenes).

## Messaging rules
- **Show:** family mode: Guardião creates missions, market items and screen-time packs; the Aventureiro finishes missions with photo/text/audio; approvals, rewards (coins or screen time), allowed/blocked apps, notifications; web app + direct APK download.
- **Hide:** vault, Pix, money, subscriptions billing, roadmap phases, wallet waitlist.
- **Future section:** vague only — "big ideas forging ahead", no spoilers.

## Files
- `index.html`, `styles.css`, `main.js`
- `assets/rpg/` — scenes and sprites copied from `app/assets/rpg/`
- APK — published by `.github/workflows/android-apk.yml` (`android-latest` release); `config.js` points at it

## Pencil
`design/s10-landing.js` — landing screen mock in `questvault.pen`

## Preview
```powershell
cd website
npx --yes serve .
```
