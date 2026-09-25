import type { TFunction } from "i18next";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { RewardOffer, RewardReceived, rewardText, type Run } from "@/components/adventurer/rewards";
import { Body, Button, Card, Frame, Seal, Sprite, Title, type SealKind } from "@/components/ui";
import { hhmm, T } from "@/lib/theme";
import { daysUntil } from "@/lib/time";

const SEAL_KIND: Record<Run["status"], SealKind> = {
  todo: "todo",
  submitted: "pend",
  approved: "ok",
  rejected: "bad",
};

function sameDay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/** "Prazo hoje às 21:00" / "Faltam 2 dias" / "Prazo 27/09 às 18:00". */
export function dueLabel(t: TFunction, run: Pick<Run, "dueAt" | "frequency">, now = Date.now()): string {
  if (run.frequency === "weekly") return t("time.daysLeft", { count: daysUntil(run.dueAt, now) });
  if (sameDay(run.dueAt, now)) return t("time.dueToday", { time: hhmm(run.dueAt) });
  const d = new Date(run.dueAt);
  const date = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  return t("adventurer.missions.dueOn", { date, time: hhmm(run.dueAt) });
}

function subtitle(t: TFunction, run: Run): string {
  if (run.status === "submitted" && run.submittedAt) {
    const at = t("adventurer.missions.deliveredAt", { time: hhmm(run.submittedAt) });
    return run.chosenReward
      ? `${at} · ${t("adventurer.missions.youChose", { reward: rewardText(t, run, run.chosenReward) })}`
      : at;
  }
  if (run.status === "approved" && run.decidedAt) return t("adventurer.missions.approvedAt", { time: hhmm(run.decidedAt) });
  return dueLabel(t, run);
}

/** One mission on the board, styled by its status (A fazer / Refazer / Em análise / Aprovada). */
export function MissionCard({ run, weekly = false }: { run: Run; weekly?: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();
  const finish = () => router.push(`/aventureiro/finalizar/${run._id}` as never);

  const header = (
    <View style={styles.header}>
      {weekly ? <Sprite name="chest" width={54} /> : null}
      <View style={{ flex: 1, gap: 3 }}>
        <Title size={17}>{run.title}</Title>
        <Body size={13} color={T.muted}>
          {subtitle(t, run)}
        </Body>
      </View>
      <Seal kind={SEAL_KIND[run.status]} label={t(`status.${run.status}`)} icon={run.status === "approved" ? "check" : undefined} />
    </View>
  );

  let body: ReactNode = null;
  if (run.status === "todo") {
    body = (
      <>
        {run.description ? (
          <Body size={14} color={T.soft}>
            {run.description}
          </Body>
        ) : null}
        <RewardOffer run={run} />
        <Button label={t("adventurer.missions.finish")} variant={weekly ? "ghost" : "primary"} onPress={finish} />
      </>
    );
  } else if (run.status === "rejected") {
    body = (
      <>
        <View style={styles.redo}>
          <Sprite name="helm" width={22} />
          <Body size={14} style={{ flex: 1 }}>
            {run.guardianMessage ? (
              <>
                <Body size={14} weight="bold">
                  {t("adventurer.missions.guardianSays")}
                </Body>{" "}
                “{run.guardianMessage}”
              </>
            ) : (
              t("adventurer.missions.redoNoMessage")
            )}
          </Body>
        </View>
        <Button label={t("adventurer.missions.finishAgain")} variant="ghost" onPress={finish} />
      </>
    );
  } else if (run.status === "submitted") {
    body = (
      <View style={styles.waiting}>
        <Sprite name="scroll" width={22} />
        <Body size={14} color={T.pend}>
          {t("adventurer.missions.waiting")}
        </Body>
      </View>
    );
  } else {
    body = <RewardReceived run={run} />;
  }

  const content = (
    <>
      {header}
      {body}
    </>
  );

  if (weekly) return <Frame style={[styles.stack, run.status === "approved" && { opacity: 0.8 }]}>{content}</Frame>;
  return (
    <Card
      highlight={run.status === "todo" ? T.line : run.status === "rejected" ? T.badLine : undefined}
      style={[styles.stack, styles.card, run.status === "rejected" && { backgroundColor: T.card }, run.status === "approved" && { opacity: 0.8 }]}
    >
      {content}
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 10 },
  card: { padding: 14 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  redo: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(198,91,79,0.08)",
    borderRadius: 4,
  },
  waiting: { flexDirection: "row", alignItems: "center", gap: 8 },
});
