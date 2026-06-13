// Game balance constants — see docs/03-business-rules.md (R6–R8).
// Phase 1: all gold is play-gold (and hidden behind FEATURES.vault client-side).

export const DAILY_CONVERSION_CAP_CENTS = 3000; // R7: max unlocked per day
export const LEVEL_BONUS_RATE = 0.01; // R7: level-up converts 1% of locked
export const LEVEL_BONUS_MIN_CENTS = 100;
export const LEVEL_BONUS_MAX_CENTS = 2000;

export type QuestType = "daily" | "side" | "boss";

/** How many instances to summon from the pool each period (min with pool size). */
export const SPAWN_SLOTS: Record<QuestType, number> = {
  daily: 3,
  side: 2,
  boss: 1,
};

/** Pick up to `count` random items without replacement. */
export function pickRandom<T>(items: T[], count: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

// XP is ROLLED at spawn — a random integer in the type's range.
// daily = small habits, side ("extra") = weekly efforts, boss = monthly milestones.
export const XP_RANGES: Record<QuestType, { min: number; max: number }> = {
  daily: { min: 5, max: 15 },
  side: { min: 20, max: 50 },
  boss: { min: 80, max: 200 },
};

/** Random integer in the type's XP range, inclusive. (Convex mutations have seeded Math.random.) */
export function rollXp(type: QuestType): number {
  const { min, max } = XP_RANGES[type];
  return min + Math.floor(Math.random() * (max - min + 1));
}

// Phase 2 placeholders: play-gold conversion value by type (unused while FEATURES.vault is off).
export const CONVERSION_DEFAULTS: Record<QuestType, number> = {
  daily: 200,
  side: 300,
  boss: 2500,
};

// R7: per-quest conversion caps by type
export const QUEST_CONVERSION_CAP_CENTS: Record<QuestType, number> = {
  daily: 500,
  side: 500,
  boss: 2500,
};

/** XP required to go from `level` to `level + 1` (RPG exponential, ~1.15x per level). */
export function xpToNext(level: number): number {
  return Math.round(100 * Math.pow(1.15, level - 1));
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function yesterdayStr(day: string): string {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * The completion period for a quest type. Quests reset when the period rolls over,
 * done or not: daily → each day, side ("extra") → each ISO week, boss → each month.
 */
export function periodKeyFor(type: QuestType, now: Date = new Date()): string {
  const day = now.toISOString().slice(0, 10);
  if (type === "daily") return day;
  if (type === "boss") return day.slice(0, 7); // YYYY-MM
  // ISO week, e.g. 2026-W24
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
