import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { Icon } from "@/components/icons";
import { AudioReport } from "@/components/guardian/audio-report";
import { BackButton, ErrorText, formatDue, Note, useBusy, useGoBack } from "@/components/guardian/kit";
import { ProofPhotos } from "@/components/guardian/photo-viewer";
import { chosenKind, useRewardChip, type RewardKind } from "@/components/guardian/reward";
import {
  Body,
  Button,
  Card,
  Chip,
  CrestBadge,
  Empty,
  Field,
  Label,
  Loading,
  Num,
  Ornament,
  Parchment,
  Screen,
  Seal,
  Sprite,
  Title,
  type SealKind,
} from "@/components/ui";
import type { SpriteName } from "@/lib/art";
import { hhmm, T } from "@/lib/theme";
import { timeAgo } from "@/lib/time";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type Run = NonNullable<FunctionReturnType<typeof api.missions.getRun>>;

const STATUS_SEAL: Record<Run["status"], { kind: SealKind; key: string }> = {
  todo: { kind: "todo", key: "todo" },
  submitted: { kind: "pend", key: "pending" },
  approved: { kind: "ok", key: "approved" },
  rejected: { kind: "bad", key: "rejected" },
};

const REWARD_LOOK: Record<RewardKind, { sprite: SpriteName; width: number; color: string; line: string }> = {
  coins: { sprite: "coin", width: 32, color: T.coin, line: T.coin },
  time: { sprite: "hourglass", width: 30, color: T.time, line: T.timeFill },
  item: { sprite: "chest", width: 34, color: T.brassHi, line: T.brass },
};

/** Revisar entrega: full proof, the reward picked, a message and the decision. */
export default function ReviewRoute() {
  const { id, redo } = useLocalSearchParams<{ id: string; redo?: string }>();
  // Keyed so the message field resets when another delivery opens in this same tab screen.
  return <Review key={`${id}-${redo ?? ""}`} runId={id as Id<"missionRuns">} focusMessage={redo === "1"} />;
}

function Review({ runId, focusMessage }: { runId: Id<"missionRuns">; focusMessage: boolean }) {
  const { t } = useTranslation();
  const goBack = useGoBack("/guardiao/aprovacoes");
  const run = useQuery(api.missions.getRun, { runId });

  if (run === undefined) return <Loading />;
  if (run === null) {
    return (
      <Screen scene="biblioteca">
        <BackButton onPress={goBack} label={t("guardian.review.backToApprovals")} />
        <Empty sprite="scroll" text={t("guardian.notFound")} />
      </Screen>
    );
  }

  const seal = STATUS_SEAL[run.status];
  const meta = [
    t("guardian.review.meta", { freq: t(`guardian.freq.${run.frequency}`), due: formatDue(run.dueAt) }),
    run.submittedAt ? t("guardian.review.submittedAt", { time: hhmm(run.submittedAt) }) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const hasProof = run.photoUrls.length > 0 || !!run.reportText || !!run.audioUrl;

  return (
    <Screen scene="biblioteca">
      <View style={styles.topRow}>
        <BackButton onPress={goBack} label={t("guardian.review.backToApprovals")} />
        <Label style={{ flex: 1 }}>{t("guardian.review.deliveryOf", { name: run.adventurerName })}</Label>
        <Seal kind={seal.kind} label={t(`guardian.seal.${seal.key}`)} />
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <CrestBadge crest={run.crest} size={50} />
        <View style={{ flex: 1, gap: 3 }}>
          <Title size={23}>{run.title}</Title>
          <Body size={14} color={T.muted}>
            {meta}
          </Body>
        </View>
      </View>

      {run.status === "todo" ? (
        <Empty sprite="scroll" text={t("guardian.review.notDelivered")} />
      ) : (
        <>
          <Ornament title={t("guardian.review.proof").toUpperCase()} />
          {run.photoUrls.length > 0 ? <ProofPhotos urls={run.photoUrls} name={run.adventurerName} at={run.submittedAt} /> : null}
          {run.reportText ? (
            <Parchment style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16 }}>
              <Icon name="quill" size={20} color={T.inkMuted} />
              <View style={{ flex: 1, gap: 4 }}>
                <Body size={17} weight="italic" color={T.ink}>
                  “{run.reportText}”
                </Body>
                <Body size={13} color={T.inkMuted}>
                  {t("guardian.review.reportOf", { name: run.adventurerName })}
                </Body>
              </View>
            </Parchment>
          ) : null}
          {run.audioUrl ? (
            <View style={{ gap: 6 }}>
              <AudioReport url={run.audioUrl} seconds={run.audioSeconds} name={run.adventurerName} />
              <Body size={13} color={T.muted}>
                {t("guardian.review.audioOf", { name: run.adventurerName })}
              </Body>
            </View>
          ) : null}
          {!hasProof ? <Empty text={t("guardian.review.noProof")} /> : null}

          <Ornament title={t("guardian.review.reward").toUpperCase()} />
          <RewardCards run={run} />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Body size={14} color={T.muted}>
              {t("guardian.review.alwaysXp")}
            </Body>
            <Chip kind="xp" label={t("reward.xp", { count: run.xp })} />
          </View>

          {run.status === "submitted" ? <Decision run={run} focusMessage={focusMessage} onDone={goBack} /> : <Decided run={run} />}
        </>
      )}
    </Screen>
  );
}

function RewardCard({ kind, run, chosen, caption }: { kind: RewardKind; run: Run; chosen: boolean; caption: string }) {
  const chip = useRewardChip();
  const look = REWARD_LOOK[kind];
  return (
    <Card
      style={[
        styles.reward,
        chosen ? { borderColor: look.line, borderWidth: 2, backgroundColor: T.cardHi } : { opacity: 0.55 },
      ]}
    >
      <Sprite name={look.sprite} width={look.width} />
      <Num size={17} color={look.color} style={{ textAlign: "center" }}>
        {chip(kind, run).label}
      </Num>
      <Body size={12} weight={chosen ? "bold" : "regular"} color={chosen ? look.color : T.muted} center>
        {caption}
      </Body>
    </Card>
  );
}

function RewardCards({ run }: { run: Run }) {
  const { t } = useTranslation();
  if (run.rewardType !== "choice") {
    return (
      <View style={{ flexDirection: "row" }}>
        <RewardCard kind={run.rewardType} run={run} chosen caption={t("guardian.review.missionReward")} />
      </View>
    );
  }
  const picked = chosenKind(run.rewardType, run.chosenReward);
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      {(["coins", "time"] as const).map((k) => (
        <RewardCard
          key={k}
          kind={k}
          run={run}
          chosen={picked === k}
          caption={picked === k ? t("guardian.review.choiceOf", { name: run.adventurerName }) : t("guardian.review.notChosen")}
        />
      ))}
    </View>
  );
}

function Decision({ run, focusMessage, onDone }: { run: Run; focusMessage: boolean; onDone: () => void }) {
  const { t } = useTranslation();
  const decide = useMutation(api.missions.decide);
  const [message, setMessage] = useState("");
  const [choice, setChoice] = useState<"approve" | "redo" | null>(null);
  const { busy, error, run: act } = useBusy();

  async function submit(approve: boolean) {
    setChoice(approve ? "approve" : "redo");
    const ok = await act(() => decide({ runId: run._id, approve, message: message.trim() || undefined }));
    if (ok) onDone();
  }

  return (
    <>
      <Field
        label={t("guardian.review.messageLabel", { name: run.adventurerName })}
        placeholder={t("guardian.review.messagePlaceholder")}
        value={message}
        onChangeText={setMessage}
        multiline
        maxLength={300}
        autoFocus={focusMessage}
      />
      <ErrorText>{error}</ErrorText>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button
          label={t("guardian.review.redo")}
          variant="danger"
          size="lg"
          busy={busy && choice === "redo"}
          disabled={busy}
          onPress={() => void submit(false)}
          style={{ flex: 1 }}
        />
        <Button
          label={t("guardian.review.approve")}
          size="lg"
          busy={busy && choice === "approve"}
          disabled={busy}
          onPress={() => void submit(true)}
          style={{ flex: 1 }}
        />
      </View>
      <Note>{t("guardian.review.notifyNow", { name: run.adventurerName })}</Note>
    </>
  );
}

function Decided({ run }: { run: Run }) {
  const { t } = useTranslation();
  return (
    <View style={{ gap: 10 }}>
      {run.guardianMessage ? (
        <Parchment>
          <Body size={16} weight="italic" color={T.ink}>
            “{run.guardianMessage}”
          </Body>
          <Body size={13} color={T.inkMuted}>
            {t("guardian.review.yourMessage")}
          </Body>
        </Parchment>
      ) : null}
      {run.decidedAt ? (
        <Body size={14} color={T.muted} center>
          {t("guardian.review.decidedAt", { ago: timeAgo(t, run.decidedAt) })}
        </Body>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reward: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 14, paddingHorizontal: 8 },
});
