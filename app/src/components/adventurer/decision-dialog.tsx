import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { ModalFrame } from "@/components/adventurer/modal-frame";
import type { Run } from "@/components/adventurer/rewards";
import { Body, Button, Label, Num, Ornament, Parchment, Sprite, Title } from "@/components/ui";
import type { SpriteName } from "@/lib/art";
import { useAdventurer, useProfile, type AdventurerSummary } from "@/lib/family";
import { formatMinutes, T } from "@/lib/theme";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

/** The big reward line: sprite + "+30 min" / "+50 moedas" / item title. */
function RewardHero({ run }: { run: Run }) {
  const { t } = useTranslation();
  const chose = run.rewardType === "choice" ? t("adventurer.decision.youChose") : "";
  const hero: { sprite: SpriteName; w: number; value: string; sub: string; color: string } =
    run.chosenReward === "time"
      ? { sprite: "hourglass", w: 46, value: `+${formatMinutes(run.minutes)}`, sub: t("adventurer.decision.minutesSub") + chose, color: T.time }
      : run.chosenReward === "coins"
        ? { sprite: "coin", w: 46, value: t("adventurer.decision.plusCoins", { count: run.coins }), sub: t("adventurer.decision.coinsSub") + chose, color: T.coin }
        : { sprite: "chest", w: 52, value: run.itemTitle ?? "", sub: t("adventurer.decision.itemSub"), color: T.brassHi };
  return (
    <View style={styles.hero}>
      <Sprite name={hero.sprite} width={hero.w} />
      <View style={{ flexShrink: 1 }}>
        <Num size={28} color={hero.color}>
          {hero.value}
        </Num>
        <Body size={14} color={T.muted}>
          {hero.sub}
        </Body>
      </View>
    </View>
  );
}

/** "+40 XP · Nível 7 · 360 / 500" with the gain highlighted at the end of the bar. */
function XpProgress({ run, adventurer }: { run: Run; adventurer: AdventurerSummary | null }) {
  const { t } = useTranslation();
  const next = adventurer?.xpToNext ?? 0;
  const xp = adventurer?.xp ?? 0;
  const gained = run.leveledUpTo ? 0 : Math.min(xp, run.xp);
  const pct = (n: number) => (next > 0 ? `${Math.max(0, Math.min(100, (n / next) * 100))}%` : "0%") as `${number}%`;
  return (
    <View style={{ alignSelf: "stretch", gap: 6 }}>
      <View style={styles.xpRow}>
        <Body size={13} weight="bold" color={T.xp}>
          {t("reward.xp", { count: run.xp })}
        </Body>
        {adventurer ? (
          <Num size={13} color={T.muted}>
            {t("adventurer.decision.levelProgress", { level: adventurer.level, xp, next })}
          </Num>
        ) : null}
      </View>
      <View style={styles.xpBar}>
        <View style={{ width: pct(xp - gained), backgroundColor: T.xpFill }} />
        <View style={{ width: pct(gained), backgroundColor: "#d7e6f7" }} />
      </View>
      {run.leveledUpTo ? (
        <Title size={16} color={T.xp} center>
          {t("adventurer.decision.levelUp", { level: run.leveledUpTo })}
        </Title>
      ) : null}
    </View>
  );
}

function GuardianNote({ message }: { message: string }) {
  const { t } = useTranslation();
  const guardianName = useProfile().me?.family?.guardianName;
  return (
    <Parchment style={styles.note}>
      <Sprite name="helm" width={26} />
      <View style={{ flex: 1, gap: 2 }}>
        <Body color={T.ink} weight="italic">
          “{message}”
        </Body>
        <Body size={13} color={T.inkMuted}>
          {guardianName
            ? t("adventurer.decision.signatureNamed", { name: guardianName })
            : t("adventurer.decision.signature")}
        </Body>
      </View>
    </Parchment>
  );
}

/**
 * Approvals and redos decided while the adventurer was away, one at a time, the next time
 * they open the app. Each is acknowledged with missions.markSeen.
 */
export function DecisionDialog({ adventurerId }: { adventurerId: Id<"adventurers"> }) {
  const { t } = useTranslation();
  const router = useRouter();
  const adventurer = useAdventurer();
  const decisions = useQuery(api.missions.unseenDecisions, { adventurerId });
  const markSeen = useMutation(api.missions.markSeen);
  const [acknowledged, setAcknowledged] = useState(0);
  const [busy, setBusy] = useState(false);

  const pending = decisions?.length ?? 0;
  useEffect(() => {
    if (decisions && decisions.length === 0) setAcknowledged(0);
  }, [decisions]);

  const run = decisions?.[0];
  if (!run) return null;
  const total = acknowledged + pending;

  const dismiss = async (then?: () => void) => {
    if (busy) return;
    setBusy(true);
    try {
      await markSeen({ runId: run._id });
      setAcknowledged((n) => n + 1);
      then?.();
    } catch {
      // Leave the dialog up; the child can try again.
    } finally {
      setBusy(false);
    }
  };

  const approved = run.status === "approved";

  return (
    <ModalFrame visible onDismiss={() => void dismiss()}>
      {approved ? (
        <View style={styles.art}>
          <Sprite name="torch" width={22} />
          <Sprite name="chestOpen" width={120} />
          <Sprite name="torch" width={22} />
        </View>
      ) : (
        <View style={styles.art}>
          <Sprite name="helm" width={64} />
        </View>
      )}

      <View style={{ alignItems: "center", gap: 4 }}>
        <Label color={approved ? T.ok : T.bad} style={{ textAlign: "center" }}>
          {approved ? t("adventurer.decision.approvedKicker") : t("adventurer.decision.rejectedKicker")}
        </Label>
        <Title size={26} color={T.brassHi} center>
          {approved ? t("adventurer.decision.approvedTitle") : t("adventurer.decision.rejectedTitle")}
        </Title>
        <Body color={T.muted} center>
          {run.title}
        </Body>
      </View>

      <Ornament />

      {approved ? (
        <>
          <RewardHero run={run} />
          <XpProgress run={run} adventurer={adventurer} />
        </>
      ) : (
        <Body center color={T.soft}>
          {t("adventurer.decision.rejectedBody")}
        </Body>
      )}

      {run.guardianMessage ? <GuardianNote message={run.guardianMessage} /> : null}

      <View style={{ gap: 8 }}>
        {approved && run.chosenReward === "time" ? (
          <>
            <Button
              size="lg"
              label={t("adventurer.decision.useTimeNow")}
              busy={busy}
              onPress={() => void dismiss(() => router.navigate("/aventureiro/tempo"))}
            />
            <Button variant="ghost" label={t("adventurer.decision.saveForLater")} disabled={busy} onPress={() => void dismiss()} />
          </>
        ) : approved ? (
          <Button size="lg" label={t("adventurer.decision.continue")} busy={busy} onPress={() => void dismiss()} />
        ) : (
          <>
            <Button
              size="lg"
              label={t("adventurer.decision.seeMission")}
              busy={busy}
              onPress={() => void dismiss(() => router.navigate(`/aventureiro/finalizar/${run._id}` as never))}
            />
            <Button variant="ghost" label={t("adventurer.decision.later")} disabled={busy} onPress={() => void dismiss()} />
          </>
        )}
      </View>

      {total > 1 ? (
        <Body size={13} color={T.faint} center>
          {t("adventurer.decision.counter", { n: acknowledged + 1, total })}
        </Body>
      ) : null}
    </ModalFrame>
  );
}

const styles = StyleSheet.create({
  art: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 16 },
  hero: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14 },
  xpRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  xpBar: {
    height: 8,
    flexDirection: "row",
    backgroundColor: "#110d0b",
    borderWidth: 1,
    borderColor: T.lineSoft,
    borderRadius: 999,
    overflow: "hidden",
  },
  note: { alignSelf: "stretch", flexDirection: "row", gap: 10, paddingVertical: 12 },
});
