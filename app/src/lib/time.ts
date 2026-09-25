import type { TFunction } from "i18next";

/** "agora" / "há 12 min" / "há 2 h" / "há 3 d". */
export function timeAgo(t: TFunction, ms: number, now = Date.now()): string {
  const min = Math.max(0, Math.round((now - ms) / 60_000));
  if (min < 1) return t("time.now");
  if (min < 60) return t("time.minutesAgo", { count: min });
  const h = Math.round(min / 60);
  if (h < 24) return t("time.hoursAgo", { count: h });
  return t("time.daysAgo", { count: Math.round(h / 24) });
}

/** Whole days until a timestamp (for weekly missions: "Faltam 2 dias"). */
export function daysUntil(ms: number, now = Date.now()): number {
  return Math.max(0, Math.ceil((ms - now) / 86_400_000));
}

export function greetingKey(now = new Date()): "morning" | "afternoon" | "evening" {
  const h = now.getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
