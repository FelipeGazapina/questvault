import { useMutation, useQuery } from "convex/react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { AudioRecorder, type LocalAudio } from "@/components/adventurer/audio-recorder";
import { DialogScreen } from "@/components/adventurer/dialog-screen";
import { PhotoPicker, type LocalPhoto } from "@/components/adventurer/photo-picker";
import { RewardPicker } from "@/components/adventurer/reward-picker";
import { Icon } from "@/components/icons";
import { Body, Button, Empty, Field, Label, Loading, Parchment, Segmented, Sprite, Step, Title } from "@/components/ui";
import { errorKey } from "@/lib/family";
import { T } from "@/lib/theme";
import { useUpload } from "@/lib/upload";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { allowedChoices, type ChosenReward } from "../../../../convex/rules";

const MAX_PHOTOS = 4;

type ReportMode = "write" | "audio";

/**
 * Tab screens stay mounted, so the form is keyed by mission and reset every time the
 * screen loses focus — each visit starts clean.
 */
export default function FinishMissionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [visit, setVisit] = useState(0);
  useFocusEffect(useCallback(() => () => setVisit((n) => n + 1), []));
  if (!id) return <Loading />;
  return <FinishMission key={`${id}:${visit}`} runId={id as Id<"missionRuns">} />;
}

function StepHeader({ n, title, required }: { n: number; title: string; required?: boolean }) {
  const { t } = useTranslation();
  return (
    <View style={styles.stepRow}>
      <Step n={n} title={title} />
      {required !== undefined ? (
        <Label color={required ? T.brass : T.faint} style={{ fontSize: 11 }}>
          {required ? t("adventurer.finish.required") : t("adventurer.finish.optional")}
        </Label>
      ) : null}
    </View>
  );
}

function FinishMission({ runId }: { runId: Id<"missionRuns"> }) {
  const { t } = useTranslation();
  const router = useRouter();
  const run = useQuery(api.missions.getRun, { runId });
  const submitRun = useMutation(api.missions.submitRun);
  const upload = useUpload();

  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [mode, setMode] = useState<ReportMode>("write");
  const [text, setText] = useState("");
  const [audio, setAudio] = useState<LocalAudio | null>(null);
  const [picked, setPicked] = useState<ChosenReward | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/aventureiro"));

  const header = (title: string) => (
    <View style={styles.header}>
      <Sprite name="scroll" width={44} />
      <View style={{ flex: 1, gap: 2 }}>
        <Label>{t("adventurer.finish.kicker")}</Label>
        <Title size={21}>{title}</Title>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={t("actions.close")} onPress={close} style={styles.close}>
        <Icon name="close" color={T.muted} />
      </Pressable>
    </View>
  );

  if (run === undefined || sent) return <Loading />;
  if (run === null || (run.status !== "todo" && run.status !== "rejected")) {
    return (
      <DialogScreen scene="ruinas">
        {header(run?.title ?? "")}
        <Empty sprite="board" text={run ? t("adventurer.finish.alreadySent") : t("adventurer.finish.notFound")} />
        <Button label={t("actions.back")} variant="ghost" onPress={close} />
      </DialogScreen>
    );
  }

  const choices = allowedChoices(run.rewardType);
  // A single fixed reward needs no choice; a redo keeps the previous pick.
  const chosen = picked ?? (choices.length === 1 ? choices[0] : run.chosenReward && choices.includes(run.chosenReward) ? run.chosenReward : null);

  const submit = async () => {
    if (busy) return;
    const reportText = mode === "write" ? text.trim() : "";
    const audioProof = mode === "audio" ? audio : null;
    if (run.requirePhoto && photos.length === 0) return setError(t("errors.PHOTO_REQUIRED"));
    if (run.requireReport && !reportText && !audioProof) return setError(t("errors.REPORT_REQUIRED"));
    if (!chosen) return setError(t("adventurer.finish.pickReward"));

    setBusy(true);
    setError(null);
    try {
      const photoIds = await Promise.all(photos.map((p) => upload(p.uri, p.mimeType)));
      const audioId = audioProof ? await upload(audioProof.uri) : undefined;
      await submitRun({
        runId,
        photoIds,
        reportText: reportText || undefined,
        audioId,
        audioSeconds: audioProof?.seconds,
        chosenReward: chosen,
      });
      setSent(true);
      close();
    } catch (e) {
      setError(t(errorKey(e)));
      setBusy(false);
    }
  };

  return (
    <DialogScreen scene="ruinas">
      {header(run.title)}

      {run.status === "rejected" && run.guardianMessage ? (
        <Parchment style={styles.message}>
          <Sprite name="helm" width={24} />
          <View style={{ flex: 1 }}>
            <Body size={13} color={T.inkMuted}>
              {t("adventurer.finish.previousMessage")}
            </Body>
            <Body size={15} color={T.ink} weight="italic">
              “{run.guardianMessage}”
            </Body>
          </View>
        </Parchment>
      ) : null}

      {run.description ? <Body color={T.soft}>{run.description}</Body> : null}

      <View style={styles.section}>
        <StepHeader n={1} title={t("adventurer.finish.stepPhoto")} required={run.requirePhoto} />
        <PhotoPicker photos={photos} onChange={setPhotos} max={MAX_PHOTOS} />
      </View>

      <View style={styles.section}>
        <StepHeader n={2} title={t("adventurer.finish.stepReport")} required={run.requireReport} />
        <Segmented
          label={t("adventurer.finish.reportMode")}
          value={mode}
          onChange={setMode}
          options={[
            { value: "write", label: t("adventurer.finish.write") },
            { value: "audio", label: t("adventurer.finish.record") },
          ]}
        />
        {mode === "write" ? (
          <Field
            accessibilityLabel={t("adventurer.finish.reportLabel")}
            placeholder={t("adventurer.finish.reportPlaceholder")}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
        ) : (
          <AudioRecorder value={audio} onChange={setAudio} />
        )}
      </View>

      <View style={styles.section}>
        <StepHeader n={3} title={t("adventurer.finish.stepReward")} />
        <RewardPicker run={run} value={chosen} onChange={setPicked} />
      </View>

      <View style={{ gap: 8 }}>
        {error ? (
          <Body color={T.bad} center>
            {error}
          </Body>
        ) : null}
        <Button size="lg" label={t("adventurer.finish.submit")} onPress={submit} busy={busy} />
        <View style={styles.notify}>
          <Sprite name="bell" width={16} />
          <Body size={13} color={T.muted}>
            {t("adventurer.finish.notifies")}
          </Body>
        </View>
      </View>
    </DialogScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  close: { width: 44, height: 44, marginTop: -8, marginRight: -8, alignItems: "center", justifyContent: "center" },
  section: { gap: 10 },
  stepRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  message: { flexDirection: "row", gap: 10, paddingVertical: 12 },
  notify: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
});
