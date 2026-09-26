// Pure game and family rules — no Convex imports, so they are unit-testable in plain Node.
// See docs/11-family-mode.md for the product rules these encode.

export type Frequency = "once" | "daily" | "weekly";
export type RewardType = "coins" | "time" | "item" | "choice";
export type Difficulty = "easy" | "medium" | "hard";
export type ChosenReward = "coins" | "time" | "item";

/** XP granted on approval, by difficulty (always on top of the chosen reward). */
export const DIFFICULTY_XP: Record<Difficulty, number> = {
  easy: 15,
  medium: 40,
  hard: 80,
};

/** XP required to go from `level` to `level + 1` (RPG exponential, ~1.15x per level). */
export function xpToNext(level: number): number {
  return Math.round(100 * Math.pow(1.15, level - 1));
}

/** Apply an XP gain, rolling over as many levels as it covers. */
export function applyXp(level: number, xp: number, gain: number): { level: number; xp: number; leveledUp: boolean } {
  let lv = level;
  let cur = xp + gain;
  while (cur >= xpToNext(lv)) {
    cur -= xpToNext(lv);
    lv += 1;
  }
  return { level: lv, xp: cur, leveledUp: lv > level };
}

/** Adventurer rank title by level — shown as "Nível 7 · Escudeiro". */
export type Rank = "apprentice" | "squire" | "knight" | "paladin" | "legend";
export function rankFor(level: number): Rank {
  if (level >= 20) return "legend";
  if (level >= 15) return "paladin";
  if (level >= 10) return "knight";
  if (level >= 5) return "squire";
  return "apprentice";
}

// ─── Local time ────────────────────────────────────────────────────────────
// Families store a fixed UTC offset (minutes, e.g. -180 for Brasília). Simple and
// deterministic inside Convex; Brazil has no DST today.

export const DEFAULT_TZ_OFFSET_MIN = -180;
const MIN = 60_000;
const DAY = 86_400_000;

export type LocalParts = { date: string; minutes: number; weekday: number };

/** Local calendar date (YYYY-MM-DD), minutes since local midnight, weekday (0 = Sunday). */
export function localParts(ms: number, tzOffsetMin: number): LocalParts {
  const shifted = new Date(ms + tzOffsetMin * MIN);
  return {
    date: shifted.toISOString().slice(0, 10),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
  };
}

/** "HH:MM" → minutes since midnight. Invalid input falls back to `fallback`. */
export function hhmmToMinutes(hhmm: string | undefined, fallback = 0): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? "");
  if (!m) return fallback;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return fallback;
  return h * 60 + min;
}

/** UTC ms for a local date + "HH:MM". */
export function localTimeToMs(date: string, hhmm: string, tzOffsetMin: number): number {
  const base = Date.parse(date + "T00:00:00Z");
  return base + hhmmToMinutes(hhmm) * MIN - tzOffsetMin * MIN;
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(date + "T00:00:00Z") + days * DAY).toISOString().slice(0, 10);
}

/** ISO week key (e.g. 2026-W39) for a local date. */
export function isoWeekKey(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / DAY + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** The period a mission run belongs to. Once-missions have a single period. */
export function periodKeyFor(frequency: Frequency, date: string): string {
  if (frequency === "daily") return date;
  if (frequency === "weekly") return isoWeekKey(date);
  return "once";
}

/** Due timestamp for a run spawned on local `date`: daily → that day; weekly → that week's Sunday. */
export function dueAtFor(frequency: Frequency, date: string, weekday: number, dueTime: string, tzOffsetMin: number): number {
  if (frequency === "weekly") {
    const daysToSunday = (7 - weekday) % 7;
    return localTimeToMs(addDays(date, daysToSunday), dueTime, tzOffsetMin);
  }
  return localTimeToMs(date, dueTime, tzOffsetMin);
}

/**
 * Whether a run should be spawned now. Daily runs wait for the mission's appear time;
 * weekly and once runs spawn as soon as the period starts.
 */
export function shouldSpawn(frequency: Frequency, localMinutes: number, appearTime: string | undefined): boolean {
  if (frequency !== "daily") return true;
  return localMinutes >= hhmmToMinutes(appearTime, 0);
}

/** Is `minutes` inside a window that may wrap midnight (e.g. 21:30–07:00)? */
export function inWindow(minutes: number, start: string | undefined, end: string | undefined): boolean {
  if (!start || !end) return false;
  const s = hhmmToMinutes(start, -1);
  const e = hhmmToMinutes(end, -1);
  if (s < 0 || e < 0 || s === e) return false;
  return s < e ? minutes >= s && minutes < e : minutes >= s || minutes < e;
}

/** Milliseconds to wait before delivering a push so it lands after a quiet window. 0 if not quiet. */
export function quietDelayMs(nowMs: number, tzOffsetMin: number, start: string | undefined, end: string | undefined): number {
  const { minutes } = localParts(nowMs, tzOffsetMin);
  if (!inWindow(minutes, start, end)) return 0;
  const e = hhmmToMinutes(end, 0);
  const wait = (e - minutes + 1440) % 1440;
  return wait * MIN;
}

// ─── Coins, time and allowance ────────────────────────────────────────────

/** Allowance exchange happens in blocks of 100 coins. */
export const COIN_BLOCK = 100;

export function coinsToCents(coins: number, centsPer100: number): number {
  return Math.floor(coins / COIN_BLOCK) * centsPer100;
}

export type TimeGrant = { remaining: number; expiresAt: number };

/** Minutes still spendable: unexpired grants only. */
export function timeBalance(grants: TimeGrant[], now: number): number {
  return grants.filter((g) => g.expiresAt > now).reduce((sum, g) => sum + g.remaining, 0);
}

/** Spend minutes oldest-expiring first. Returns the new `remaining` per grant index, or null if short. */
export function spendTime(grants: TimeGrant[], minutes: number, now: number): number[] | null {
  if (timeBalance(grants, now) < minutes) return null;
  const order = grants
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => g.expiresAt > now && g.remaining > 0)
    .sort((a, b) => a.g.expiresAt - b.g.expiresAt);
  const out = grants.map((g) => g.remaining);
  let left = minutes;
  for (const { g, i } of order) {
    if (left <= 0) break;
    const take = Math.min(g.remaining, left);
    out[i] = g.remaining - take;
    left -= take;
  }
  return out;
}

/**
 * A penalty takes minutes from the bank, oldest-expiring grants first. Whatever the bank
 * can't cover becomes debt, so the balance goes negative until new time pays it off.
 */
export function penalizeTime(grants: TimeGrant[], minutes: number, now: number): { remaining: number[]; debt: number } {
  const remaining = grants.map((g) => g.remaining);
  let left = Math.max(0, minutes);
  const order = grants
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => g.expiresAt > now && g.remaining > 0)
    .sort((a, b) => a.g.expiresAt - b.g.expiresAt);
  for (const { g, i } of order) {
    if (left <= 0) break;
    const take = Math.min(g.remaining, left);
    remaining[i] = g.remaining - take;
    left -= take;
  }
  return { remaining, debt: left };
}

/** New minutes pay time debt first (oldest debt first). `debts` are amounts owed (positive). */
export function settleTimeDebt(debts: number[], incoming: number): { debts: number[]; left: number } {
  let left = Math.max(0, incoming);
  const out = debts.map((owed) => {
    const pay = Math.min(owed, left);
    left -= pay;
    return owed - pay;
  });
  return { debts: out, left };
}

/** Which reward the adventurer may pick for a mission's reward type. */
export function allowedChoices(rewardType: RewardType): ChosenReward[] {
  if (rewardType === "choice") return ["coins", "time"];
  return [rewardType];
}

/** Streak after a mission is approved on local `today`. */
export function nextStreak(streak: number, lastDay: string | undefined, today: string): number {
  if (lastDay === today) return Math.max(1, streak);
  if (lastDay === addDays(today, -1)) return streak + 1;
  return 1;
}
