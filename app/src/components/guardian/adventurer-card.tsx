import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { Bar, Body, Button, Card, CrestBadge, Frame, Num, Seal, Sprite, Title } from "@/components/ui";
import type { SpriteName } from "@/lib/art";
import type { AdventurerSummary } from "@/lib/family";
import { formatMinutes, T } from "@/lib/theme";

/** "11 anos · Nível 7 · Escudeiro". */
export function useAdventurerLine() {
  const { t } = useTranslation();
  return (a: Pick<AdventurerSummary, "age" | "level" | "rank">) => {
    const level = t("levelRank", { level: a.level, rank: t(`rank.${a.rank}`) });
    return a.age ? `${t("guardian.age", { count: a.age })} · ${level}` : level;
  };
}

/** Lock / live-session seal shown next to an adventurer's name. */
export function LockSeal({ a }: { a: AdventurerSummary }) {
  const { t } = useTranslation();
  if (a.sessionEndsAt && a.sessionEndsAt > Date.now()) {
    const left = Math.max(1, Math.ceil((a.sessionEndsAt - Date.now()) / 60_000));
    return <Seal kind="time" icon="hourglass" label={t("guardian.seal.inUse", { time: formatMinutes(left) })} />;
  }
  return a.lockEnabled ? (
    <Seal kind="bad" icon="lock" label={t("guardian.seal.locked")} />
  ) : (
    <Seal kind="ok" label={t("guardian.seal.unlocked")} />
  );
}

function Tile({ sprite, width, value, color, caption }: { sprite: SpriteName; width: number; value: string; color: string; caption: string }) {
  return (
    <Card style={styles.tile}>
      <Sprite name={sprite} width={width} />
      <Num size={18} color={color}>
        {value}
      </Num>
      <Body size={12} color={T.muted} center numberOfLines={1}>
        {caption}
      </Body>
    </Card>
  );
}

/** Painel card: crest, level, XP, coins / time / today tiles and quick actions. */
export function AdventurerCard({
  a,
  onGiveTime,
  onApps,
}: {
  a: AdventurerSummary;
  onGiveTime: () => void;
  onApps: () => void;
}) {
  const { t } = useTranslation();
  const line = useAdventurerLine();
  return (
    <Frame style={{ gap: 12 }}>
      <View style={styles.head}>
        <CrestBadge crest={a.crest} size={46} />
        <View style={{ flex: 1, gap: 2 }}>
          <Title size={18}>{a.name}</Title>
          <Body size={14} color={T.muted}>
            {line(a)}
          </Body>
        </View>
        <LockSeal a={a} />
      </View>
      <View style={{ gap: 5 }}>
        <View style={styles.xpRow}>
          <Body size={13} color={T.muted}>
            {t("guardian.painel.xp")}
          </Body>
          <Body size={13} color={T.muted} style={{ fontVariant: ["tabular-nums"] }}>
            {t("guardian.painel.xpValue", { xp: a.xp, next: a.xpToNext })}
          </Body>
        </View>
        <Bar ratio={a.xpToNext ? a.xp / a.xpToNext : 0} />
      </View>
      <View style={styles.grid3}>
        <Tile sprite="coin" width={24} value={String(a.coins)} color={T.coin} caption={t("guardian.painel.coins")} />
        <Tile sprite="hourglass" width={22} value={formatMinutes(a.timeBankMin)} color={T.time} caption={t("guardian.painel.screen")} />
        <Tile
          sprite="board"
          width={26}
          value={`${a.todayDone} / ${a.todayTotal}`}
          color={T.text}
          caption={t("guardian.painel.todayMissions")}
        />
      </View>
      <View style={styles.grid2}>
        <Button label={t("guardian.painel.giveTime")} variant="ghost" onPress={onGiveTime} style={{ flex: 1 }} />
        <Button label={t("guardian.painel.appsOf", { name: a.name })} variant="ghost" onPress={onApps} style={{ flex: 1 }} />
      </View>
    </Frame>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  xpRow: { flexDirection: "row", justifyContent: "space-between" },
  grid3: { flexDirection: "row", gap: 8 },
  tile: { flex: 1, alignItems: "center", gap: 4, paddingVertical: 10, paddingHorizontal: 6 },
  grid2: { flexDirection: "row", gap: 8 },
});
