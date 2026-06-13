// Feature flags. Phase 1 ships the pure game — no money UI (no play-gold).
// Vault debuts in Phase 2 with real Pix only — see docs/07-roadmap.md.
export const FEATURES = {
  /** Vault, balances, conversions, claim/redeem — Phase 2 + BaaS only. */
  vault: false,
  /** Floating re-summon button on the quest board (dev / local only). */
  debugResummon: __DEV__,
} as const;
