import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { Bar, Body, Card, CrestBadge, Frame, Num, Sprite, Title } from "@/components/ui";
import type { SpriteName } from "@/lib/art";
import type { AdventurerSummary } from "@/lib/family";
import { formatCoins, formatMinutes, T } from "@/lib/theme";

function Tile({ sprite, width, value, color, label }: { sprite: SpriteName; width: number; value: string; color: string; label: string }) {
  return (
    <Card style={styles.tile}>
      <View accessible accessibilityLabel={label} style={styles.tileInner}>
        <Sprite name={sprite} width={width} />
        <Num size={17} color={color}>
          {value}
        </Num>
      </View>
    </Card>
  );
}

/** Adventurer HUD: crest, name, level · rank, XP bar and coin / time / streak tiles. */
export function AdventurerHud({ adventurer: a }: { adventurer: AdventurerSummary }) {
  const { t } = useTranslation();
  const ratio = a.xpToNext > 0 ? a.xp / a.xpToNext : 0;
  const time = formatMinutes(a.timeBankMin);
  return (
    <Frame style={{ gap: 12, paddingVertical: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <CrestBadge crest={a.crest} size={46} />
        <View style={{ flex: 1, gap: 5 }}>
          <View style={styles.nameRow}>
            <Title size={19} numberOfLines={1} style={{ flexShrink: 1 }}>
              {a.name}
            </Title>
            <Body size={13} color={T.muted}>
              {t("levelRank", { level: a.level, rank: t(`rank.${a.rank}`) })}
            </Body>
          </View>
          <View accessible accessibilityLabel={t("adventurer.hud.xpA11y", { xp: a.xp, next: a.xpToNext })}>
            <Bar ratio={ratio} />
          </View>
          <Num size={12} color={T.xp}>
            {t("adventurer.hud.xp", { xp: a.xp, next: a.xpToNext })}
          </Num>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Tile sprite="coin" width={20} value={formatCoins(a.coins)} color={a.coins < 0 ? T.bad : T.coin} label={t("adventurer.hud.coinsA11y", { count: a.coins })} />
        <Tile sprite="hourglass" width={19} value={time} color={a.timeBankMin < 0 ? T.bad : T.time} label={t("adventurer.hud.timeA11y", { time })} />
        <Tile
          sprite="torch"
          width={10}
          value={t("adventurer.hud.streak", { count: a.streak })}
          color={T.streak}
          label={t("adventurer.hud.streakA11y", { count: a.streak })}
        />
      </View>
    </Frame>
  );
}

const styles = StyleSheet.create({
  nameRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
  tile: { flex: 1, paddingVertical: 8, paddingHorizontal: 4 },
  tileInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
});
