import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Body, Chip } from "@/components/ui";
import { formatMinutes, T } from "@/lib/theme";
import type { RunView } from "../../../convex/missions";
import type { ChosenReward } from "../../../convex/rules";

export type Run = RunView;

/** "30 moedas" / "20 min" / item title — a concrete reward in words. */
export function rewardText(t: TFunction, run: Pick<Run, "coins" | "minutes" | "itemTitle">, kind: ChosenReward): string {
  if (kind === "coins") return t("reward.coins", { count: run.coins });
  if (kind === "time") return formatMinutes(run.minutes);
  return run.itemTitle ?? "";
}

/** What a mission pays: "40 ou 20 min +30 XP" (choice) or the single reward, always with sprites. */
export function RewardOffer({ run }: { run: Pick<Run, "rewardType" | "coins" | "minutes" | "itemTitle" | "xp"> }) {
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
      {run.rewardType === "coins" || run.rewardType === "choice" ? (
        <Chip kind="coin" label={t("reward.coinsShort", { count: run.coins })} />
      ) : null}
      {run.rewardType === "choice" ? (
        <Body size={13} color={T.faint}>
          {t("reward.or")}
        </Body>
      ) : null}
      {run.rewardType === "time" || run.rewardType === "choice" ? (
        <Chip kind="time" label={formatMinutes(run.minutes)} />
      ) : null}
      {run.rewardType === "item" ? <Chip kind="item" label={run.itemTitle ?? ""} /> : null}
      <Chip kind="xp" label={t("reward.xp", { count: run.xp })} />
    </View>
  );
}

/** What an approved mission paid out: "+30 min +40 XP". */
export function RewardReceived({ run }: { run: Pick<Run, "chosenReward" | "coins" | "minutes" | "itemTitle" | "xp"> }) {
  const { t } = useTranslation();
  const kind = run.chosenReward;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {kind === "coins" ? <Chip kind="coin" label={`+${run.coins}`} /> : null}
      {kind === "time" ? <Chip kind="time" label={`+${formatMinutes(run.minutes)}`} /> : null}
      {kind === "item" ? <Chip kind="item" label={run.itemTitle ?? ""} /> : null}
      <Chip kind="xp" label={t("reward.xp", { count: run.xp })} />
    </View>
  );
}
