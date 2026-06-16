# PWA mobile tab bar fix

## Problem
On iOS PWA: tab labels invisible, white strip below tab bar.

## Root cause (from analysis)
- Fixed `height: 64` on tab bar conflicted with `viewport-fit=cover` safe-area inset.
- Missing `lineHeight` on Press Start 2P tab labels.
- No dark `body` background in `+html.tsx`.

## Fix
- `_layout.tsx`: `GameTabs` uses `useSafeAreaInsets()` — `height: 64 + insets.bottom`, `paddingBottom: insets.bottom`, `lineHeight: size * 1.7`.
- `+html.tsx`: dark background on `html, body, #root`.

## Date
Applied after subagent investigation (read-only); code committed separately.
