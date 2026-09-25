import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import type { Run } from "@/components/adventurer/rewards";
import { Body, Choice, Num, Sprite } from "@/components/ui";
import type { SpriteName } from "@/lib/art";
import { formatMinutes, T } from "@/lib/theme";
import { allowedChoices, type ChosenReward } from "../../../convex/rules";

type Option = { kind: ChosenReward; sprite: SpriteName; spriteW: number; title: string; sub: string; color: string };

/** Reward cards for a mission: coins vs screen time for "choice", otherwise the single fixed reward. */
export function RewardPicker({
  run,
  value,
  onChange,
}: {
  run: Pick<Run, "rewardType" | "coins" | "minutes" | "itemTitle" | "xp">;
  value: ChosenReward | null;
  onChange: (k: ChosenReward) => void;
}) {
  const { t } = useTranslation();
  const options: Option[] = allowedChoices(run.rewardType).map((kind) => {
    if (kind === "coins") {
      return { kind, sprite: "coin", spriteW: 34, title: t("adventurer.finish.coinsTitle", { count: run.coins }), sub: t("adventurer.finish.coinsSub"), color: T.coin };
    }
    if (kind === "time") {
      return { kind, sprite: "hourglass", spriteW: 32, title: formatMinutes(run.minutes), sub: t("adventurer.finish.timeSub"), color: T.time };
    }
    return { kind, sprite: "chest", spriteW: 40, title: run.itemTitle ?? "", sub: t("adventurer.finish.itemSub"), color: T.brassHi };
  });

  return (
    <View style={{ gap: 8 }}>
      <View accessibilityRole="radiogroup" accessibilityLabel={t("adventurer.finish.rewardLabel")} style={styles.grid}>
        {options.map((o) => (
          <Choice
            key={o.kind}
            label={`${o.title} ${o.sub}`}
            selected={value === o.kind}
            onPress={() => onChange(o.kind)}
            color={o.color}
            style={styles.card}
          >
            <Sprite name={o.sprite} width={o.spriteW} />
            <Num size={20} color={o.color} style={{ textAlign: "center" }}>
              {o.title}
            </Num>
            <Body size={13} color={T.muted} center>
              {o.sub}
            </Body>
          </Choice>
        ))}
      </View>
      <Body size={13} color={T.xp} center>
        {t("adventurer.finish.alwaysXp", { count: run.xp })}
      </Body>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", gap: 10 },
  card: { flex: 1, alignItems: "center", paddingVertical: 14 },
});
