import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Body, Card, Sprite } from "@/components/ui";
import type { SpriteName } from "@/lib/art";
import { hhmm, T } from "@/lib/theme";
import { timeAgo } from "@/lib/time";
import { renderNotice, type NoticeParams } from "../../../convex/pushMessages";

const SPRITE: Record<string, SpriteName> = {
  submission: "scroll",
  pending_reminder: "scroll",
  purchase: "stall",
  deadline_guardian: "torch",
  daily_summary: "board",
  approved: "chestOpen",
  time_gift: "hourglass",
};

export function noticeSprite(kind: string): SpriteName {
  return SPRITE[kind] ?? "bell";
}

/** Inbox copy in the UI language (same text as the push). */
export function useNoticeCopy() {
  const { i18n } = useTranslation();
  const locale = i18n.language === "en" ? "en" : "pt";
  return (kind: string, params: NoticeParams) => renderNotice(kind, params, locale);
}

function dayStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export type DayBucket = "today" | "yesterday" | "earlier";

export function dayBucket(ms: number, now = Date.now()): DayBucket {
  const today = dayStart(now);
  if (ms >= today) return "today";
  if (ms >= today - 86_400_000) return "yesterday";
  return "earlier";
}

/** "18:50" today, "há 2 d" before. */
export function useWhen() {
  const { t } = useTranslation();
  return (ms: number) => (dayBucket(ms) === "today" ? hhmm(ms) : timeAgo(t, ms));
}

/** Compact activity row for the Painel (latest inbox items). */
export function ActivityRow({ kind, params, createdAt }: { kind: string; params: NoticeParams; createdAt: number }) {
  const copy = useNoticeCopy()(kind, params);
  const when = useWhen()(createdAt);
  return (
    <Card style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 }}>
      <View style={{ width: 30, alignItems: "center" }}>
        <Sprite name={noticeSprite(kind)} width={kind === "deadline_guardian" ? 12 : 28} />
      </View>
      <Body size={15} style={{ flex: 1 }}>
        {copy.title}
      </Body>
      <Body size={13} color={T.faint}>
        {when}
      </Body>
    </Card>
  );
}
