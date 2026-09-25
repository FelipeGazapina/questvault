import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Body, Chip, type ChipKind } from "@/components/ui";
import { T } from "@/lib/theme";

export type RewardKind = "coins" | "time" | "item";
export type RewardType = RewardKind | "choice";

type Amounts = { coins: number; minutes: number; itemTitle: string | null };

/** Chip spec for one concrete reward (every reward chip keeps its sprite). */
export function useRewardChip() {
  const { t } = useTranslation();
  return (kind: RewardKind, a: Amounts): { kind: ChipKind; label: string } => {
    if (kind === "coins") return { kind: "coin", label: t("reward.coins", { count: a.coins }) };
    if (kind === "time") return { kind: "time", label: t("reward.minutesLong", { count: a.minutes }) };
    return { kind: "item", label: a.itemTitle ?? "" };
  };
}

/** What the adventurer picked (falls back to the mission's single reward). */
export function chosenKind(rewardType: RewardType, chosen: RewardKind | null): RewardKind {
  return chosen ?? (rewardType === "choice" ? "coins" : rewardType);
}

/** Reward chips of a mission template or run: "50 moedas ou 30 min" + "+40 XP". */
export function RewardChips({
  rewardType,
  coins,
  minutes,
  itemTitle,
  xp,
}: Amounts & { rewardType: RewardType; xp?: number }) {
  const { t } = useTranslation();
  const chip = useRewardChip();
  const a = { coins, minutes, itemTitle };
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
      {rewardType === "choice" ? (
        <>
          <Chip {...chip("coins", a)} />
          <Body size={13} color={T.muted}>
            {t("reward.or")}
          </Body>
          <Chip kind="time" label={t("reward.minutes", { count: minutes })} />
        </>
      ) : (
        <Chip {...chip(rewardType, a)} />
      )}
      {xp ? <Chip kind="xp" label={t("reward.xp", { count: xp })} /> : null}
    </View>
  );
}
