import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";

import { AudioRecorder, type LocalAudio } from "@/components/adventurer/audio-recorder";
import { Body, Button, Choice, Field, Label, Num, Segmented, Sprite } from "@/components/ui";
import type { SpriteName } from "@/lib/art";
import { formatMinutes, T } from "@/lib/theme";
import { useUpload } from "@/lib/upload";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { penaltyLabel } from "../../../convex/pushMessages";
import { ErrorText, Sheet, useBusy } from "./kit";

const COINS = [0, 10, 25, 50, 100] as const;
const MINUTES = [0, 15, 30, 60, 120] as const;

export type PenaltyTarget = { _id: Id<"adventurers">; name: string } | null;

type ReasonMode = "text" | "audio";

function AmountRow({
  label,
  options,
  value,
  onChange,
  sprite,
  format,
  none,
}: {
  label: string;
  options: readonly number[];
  value: number;
  onChange: (n: number) => void;
  sprite: SpriteName;
  format: (n: number) => string;
  none: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Label>{label}</Label>
      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((n) => (
          <Choice
            key={n}
            selected={value === n}
            onPress={() => onChange(n)}
            label={n === 0 ? none : format(n)}
            color={T.badFill}
            style={styles.amount}
          >
            {n === 0 ? (
              <Body size={14} color={T.muted}>
                {none}
              </Body>
            ) : (
              <>
                <Sprite name={sprite} width={18} />
                <Num size={14} color={T.bad}>
                  {format(n)}
                </Num>
              </>
            )}
          </Choice>
        ))}
      </View>
    </View>
  );
}

/** The adventurer's last penalties, so the guardian sees what was already applied and whether it was seen. */
function RecentPenalties({ adventurerId }: { adventurerId: Id<"adventurers"> }) {
  const { t, i18n } = useTranslation();
  const rows = useQuery(api.penalties.recent, { adventurerId });
  if (!rows || rows.length === 0) return null;
  const locale = i18n.language.startsWith("en") ? "en" : "pt";
  return (
    <View style={{ gap: 6 }}>
      <Label>{t("guardian.penalty.recent")}</Label>
      {rows.slice(0, 3).map((p) => (
        <View key={p._id} style={styles.recent}>
          <Body size={14} color={T.bad}>
            {penaltyLabel({ coins: p.coins, minutes: p.minutes }, locale)}
          </Body>
          <Body size={13} color={T.muted} numberOfLines={1}>
            {`${p.reason ? `“${p.reason}”` : t("guardian.penalty.audioReason")} · ${
              p.seen ? t("guardian.penalty.seen") : t("guardian.penalty.notSeen")
            }`}
          </Body>
        </View>
      ))}
    </View>
  );
}

/**
 * "Aplicar penalidade": take coins and/or screen minutes, with the reason in text or audio.
 * The adventurer gets a push and a dialog the next time they open the app (penalties.apply).
 */
export function PenaltySheet({ target, onClose }: { target: PenaltyTarget; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { height } = useWindowDimensions();
  const apply = useMutation(api.penalties.apply);
  const upload = useUpload();
  const { busy, error, setError, run } = useBusy();
  const [coins, setCoins] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [mode, setMode] = useState<ReasonMode>("text");
  const [reason, setReason] = useState("");
  const [audio, setAudio] = useState<LocalAudio | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (target) {
      setCoins(0);
      setMinutes(0);
      setMode("text");
      setReason("");
      setAudio(null);
      setDone(null);
      setError(null);
    }
  }, [target, setError]);

  const locale = i18n.language.startsWith("en") ? "en" : "pt";
  const what = penaltyLabel({ coins, minutes }, locale);

  async function confirm() {
    if (!target) return;
    if (coins === 0 && minutes === 0) {
      setError(t("guardian.penalty.pickSomething"));
      return;
    }
    const text = reason.trim();
    if (mode === "text" ? !text : !audio) {
      setError(t("guardian.penalty.needReason"));
      return;
    }
    const ok = await run(async () => {
      const audioId = mode === "audio" && audio ? await upload(audio.uri) : undefined;
      await apply({
        adventurerId: target._id,
        coins,
        minutes,
        ...(mode === "text" ? { reason: text } : { audioId, audioSeconds: audio?.seconds }),
      });
    });
    if (ok) setDone(t("guardian.penalty.done", { name: target.name }));
  }

  return (
    <Sheet visible={!!target} onClose={onClose} title={t("guardian.penalty.title", { name: target?.name ?? "" })}>
      {done ? (
        <View style={{ alignItems: "center", gap: 12, paddingVertical: 8 }}>
          <Sprite name="helm" width={40} />
          <Body center>{done}</Body>
          <Button label={t("actions.close")} variant="ghost" onPress={onClose} style={{ alignSelf: "stretch" }} />
        </View>
      ) : (
        <ScrollView style={{ maxHeight: height * 0.72 }} contentContainerStyle={{ gap: 14 }} keyboardShouldPersistTaps="handled">
          <Body size={14} color={T.muted}>
            {t("guardian.penalty.body")}
          </Body>
          <AmountRow
            label={t("guardian.penalty.coins")}
            options={COINS}
            value={coins}
            onChange={setCoins}
            sprite="coin"
            format={(n) => `−${n}`}
            none={t("guardian.penalty.none")}
          />
          <AmountRow
            label={t("guardian.penalty.minutes")}
            options={MINUTES}
            value={minutes}
            onChange={setMinutes}
            sprite="hourglass"
            format={(n) => `−${formatMinutes(n)}`}
            none={t("guardian.penalty.none")}
          />
          <View style={{ gap: 6 }}>
            <Label>{t("guardian.penalty.reason")}</Label>
            <Segmented
              label={t("guardian.penalty.reason")}
              value={mode}
              onChange={(m) => {
                setMode(m);
                setError(null);
              }}
              options={[
                { value: "text", label: t("guardian.penalty.reasonText") },
                { value: "audio", label: t("guardian.penalty.reasonAudio") },
              ]}
            />
          </View>
          {mode === "text" ? (
            <Field
              placeholder={t("guardian.penalty.reasonPlaceholder")}
              value={reason}
              onChangeText={setReason}
              multiline
              maxLength={280}
            />
          ) : (
            <View style={{ gap: 6 }}>
              <Body size={13} color={T.muted}>
                {t("guardian.penalty.audioHint")}
              </Body>
              <AudioRecorder value={audio} onChange={setAudio} />
            </View>
          )}
          <ErrorText>{error}</ErrorText>
          <Button
            label={what ? t("guardian.penalty.confirm", { what }) : t("guardian.painel.penalty")}
            variant="danger"
            onPress={() => void confirm()}
            busy={busy}
            size="lg"
          />
          {target ? <RecentPenalties adventurerId={target._id} /> : null}
        </ScrollView>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  amount: {
    flexGrow: 1,
    flexBasis: "17%",
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 4,
  },
  recent: { gap: 1, paddingVertical: 6, borderTopWidth: 1, borderTopColor: T.lineSoft },
});
