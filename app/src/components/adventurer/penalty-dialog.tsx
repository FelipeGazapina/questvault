import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { GuardianNote } from "@/components/adventurer/decision-dialog";
import { ModalFrame } from "@/components/adventurer/modal-frame";
import { AudioReport } from "@/components/guardian/audio-report";
import { Body, Button, Label, Num, Ornament, Sprite, Title } from "@/components/ui";
import { useAdventurer, useProfile } from "@/lib/family";
import { formatCoins, formatMinutes, T } from "@/lib/theme";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export type UnseenPenalty = {
  _id: Id<"penalties">;
  coins: number;
  minutes: number;
  reason: string | null;
  audioUrl: string | null;
  audioSeconds: number | null;
};

/**
 * Penalties applied by the guardian pop up one at a time, with what was taken and the reason
 * (text, or an audio message to play). Each is acknowledged with penalties.markSeen.
 */
export function PenaltyDialog({ penalties }: { penalties: UnseenPenalty[] | undefined }) {
  const { t } = useTranslation();
  const adventurer = useAdventurer();
  const guardianName = useProfile().me?.family?.guardianName ?? "";
  const markSeen = useMutation(api.penalties.markSeen);
  const [acknowledged, setAcknowledged] = useState(0);
  const [busy, setBusy] = useState(false);

  const pending = penalties?.length ?? 0;
  useEffect(() => {
    if (penalties && penalties.length === 0) setAcknowledged(0);
  }, [penalties]);

  const p = penalties?.[0];
  if (!p) return null;
  const total = acknowledged + pending;

  const dismiss = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await markSeen({ penaltyId: p._id });
      setAcknowledged((n) => n + 1);
    } catch {
      // Leave the dialog up; the child can try again.
    } finally {
      setBusy(false);
    }
  };

  const inDebt = !!adventurer && (adventurer.coins < 0 || adventurer.timeBankMin < 0);

  return (
    <ModalFrame visible onDismiss={() => void dismiss()}>
      <View style={styles.art}>
        <Sprite name="helm" width={64} />
      </View>

      <View style={{ alignItems: "center", gap: 4 }}>
        <Label color={T.bad} style={{ textAlign: "center" }}>
          {t("adventurer.penalty.kicker")}
        </Label>
        <Title size={24} color={T.brassHi} center>
          {t("adventurer.penalty.title")}
        </Title>
      </View>

      <View style={styles.amounts}>
        {p.coins > 0 ? (
          <View style={styles.amount}>
            <Sprite name="coin" width={34} />
            <Num size={24} color={T.bad}>
              {t("adventurer.penalty.coins", { count: p.coins })}
            </Num>
          </View>
        ) : null}
        {p.minutes > 0 ? (
          <View style={styles.amount}>
            <Sprite name="hourglass" width={30} />
            <Num size={24} color={T.bad}>
              {t("adventurer.penalty.minutes", { time: formatMinutes(p.minutes) })}
            </Num>
          </View>
        ) : null}
      </View>

      <Ornament />

      {p.reason ? <GuardianNote message={p.reason} /> : null}
      {p.audioUrl ? (
        <View style={{ gap: 6 }}>
          <Body size={14} color={T.muted}>
            {t("adventurer.penalty.listen")}
          </Body>
          <AudioReport
            url={p.audioUrl}
            seconds={p.audioSeconds}
            name={guardianName}
            playLabel={t("guardian.audio.playReason")}
          />
        </View>
      ) : null}

      {adventurer ? (
        <View style={{ gap: 2 }}>
          <Body size={14} color={T.soft} center>
            {t("adventurer.penalty.balance", { coins: formatCoins(adventurer.coins), time: formatMinutes(adventurer.timeBankMin) })}
          </Body>
          {inDebt ? (
            <Body size={13} color={T.bad} center>
              {t("adventurer.penalty.debt")}
            </Body>
          ) : null}
        </View>
      ) : null}

      <Button size="lg" label={t("adventurer.penalty.ok")} busy={busy} onPress={() => void dismiss()} />

      {total > 1 ? (
        <Body size={13} color={T.faint} center>
          {t("adventurer.penalty.counter", { n: acknowledged + 1, total })}
        </Body>
      ) : null}
    </ModalFrame>
  );
}

const styles = StyleSheet.create({
  art: { alignItems: "center" },
  amounts: { alignItems: "center", gap: 10 },
  amount: { flexDirection: "row", alignItems: "center", gap: 10 },
});
