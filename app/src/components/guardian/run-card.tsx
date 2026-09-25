import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { Body, Button, Card, Chip, CrestBadge, Frame, Seal, Title } from "@/components/ui";
import { T } from "@/lib/theme";
import { timeAgo } from "@/lib/time";
import { api } from "../../../convex/_generated/api";
import { AudioReport } from "./audio-report";
import { ErrorText, useBusy } from "./kit";
import { chosenKind, useRewardChip } from "./reward";

export type ApprovalRun = FunctionReturnType<typeof api.missions.approvals>[number];

export function reviewHref(runId: string, redo = false): never {
  return `/guardiao/revisar/${runId}${redo ? "?redo=1" : ""}` as never;
}

function Photo({ url, n, name, onPress, style }: { url: string; n: number; name: string; onPress: () => void; style: object }) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel={t("guardian.approvals.openPhoto", { n, name })}
      onPress={onPress}
      style={[styles.photo, style]}
    >
      <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
    </Pressable>
  );
}

/** A delivery waiting for judgement: proof preview, the chosen reward, redo / approve. */
export function PendingRunCard({ run }: { run: ApprovalRun }) {
  const { t } = useTranslation();
  const router = useRouter();
  const decide = useMutation(api.missions.decide);
  const chip = useRewardChip();
  const { busy, error, run: act } = useBusy();
  const open = () => router.push(reviewHref(run._id));
  const photos = run.photoUrls;
  const sideBySide = photos.length === 1 && !!run.reportText;
  const reward = chip(chosenKind(run.rewardType, run.chosenReward), run);

  return (
    <Frame style={{ gap: 12 }}>
      <View style={styles.head}>
        <CrestBadge crest={run.crest} size={34} />
        <Pressable onPress={open} accessibilityRole="link" style={{ flex: 1 }}>
          <Title size={17}>{run.title}</Title>
          <Body size={13} color={T.muted}>
            {t("guardian.approvals.deliveredAgo", { name: run.adventurerName, ago: timeAgo(t, run.submittedAt ?? Date.now()) })}
          </Body>
        </Pressable>
        <Seal kind="pend" label={t("guardian.seal.pending")} />
      </View>

      {sideBySide ? (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Photo url={photos[0]} n={1} name={run.adventurerName} onPress={open} style={{ width: 96, height: 96 }} />
          <Body size={15} weight="italic" color={T.soft} style={{ flex: 1 }} numberOfLines={5}>
            “{run.reportText}”
          </Body>
        </View>
      ) : (
        <>
          {photos.length > 0 ? (
            <View style={{ flexDirection: "row", gap: 8 }}>
              {photos.slice(0, 3).map((url, i) => (
                <Photo
                  key={url}
                  url={url}
                  n={i + 1}
                  name={run.adventurerName}
                  onPress={open}
                  style={photos.length === 1 ? { width: 120, height: 120 } : { flex: 1, height: 84 }}
                />
              ))}
            </View>
          ) : null}
          {run.reportText ? (
            <Body size={15} weight="italic" color={T.soft} numberOfLines={4}>
              “{run.reportText}”
            </Body>
          ) : null}
        </>
      )}
      {run.audioUrl ? <AudioReport url={run.audioUrl} seconds={run.audioSeconds} name={run.adventurerName} /> : null}

      <View style={styles.chips}>
        <Body size={13} color={T.muted}>
          {t("guardian.approvals.chose")}
        </Body>
        <Chip {...reward} />
        <Chip kind="xp" label={t("reward.xp", { count: run.xp })} />
      </View>

      <ErrorText>{error}</ErrorText>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button
          label={t("guardian.approvals.redo")}
          variant="danger"
          onPress={() => router.push(reviewHref(run._id, true))}
          style={{ flex: 1 }}
        />
        <Button
          label={t("guardian.approvals.approve")}
          busy={busy}
          onPress={() => void act(() => decide({ runId: run._id, approve: true }))}
          style={{ flex: 1 }}
        />
      </View>
    </Frame>
  );
}

/** Compact row for approved / redo runs. */
export function DecidedRow({ run }: { run: ApprovalRun }) {
  const { t } = useTranslation();
  const router = useRouter();
  const chip = useRewardChip();
  const ok = run.status === "approved";
  const detail = ok
    ? chip(chosenKind(run.rewardType, run.chosenReward), run).label
    : run.guardianMessage
      ? `“${run.guardianMessage}”`
      : timeAgo(t, run.decidedAt ?? Date.now());
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(reviewHref(run._id))}>
      <Card style={styles.decided}>
        <View style={{ flex: 1, gap: 1 }}>
          <Body size={15} weight="bold">
            {run.title}
          </Body>
          <Body size={13} color={T.muted} numberOfLines={2}>
            {run.adventurerName} · {detail}
          </Body>
        </View>
        {ok ? (
          <Seal kind="ok" icon="check" label={t("guardian.seal.approved")} />
        ) : (
          <Seal kind="bad" icon="close" label={t("guardian.seal.rejected")} />
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  photo: { overflow: "hidden", borderRadius: 4, borderWidth: 1, borderColor: T.lineSoft, backgroundColor: T.well },
  chips: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  decided: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
});
