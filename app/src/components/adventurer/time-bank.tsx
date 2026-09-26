import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { ModalFrame } from "@/components/adventurer/modal-frame";
import { Bar, Body, Button, Frame, Num, Sprite, Title } from "@/components/ui";
import type { AdventurerSummary } from "@/lib/family";
import { formatMinutes, hhmm, T } from "@/lib/theme";

const PRESETS = [15, 30, 60];

/** Current time, ticking every `ms` while `active`. */
export function useNow(active: boolean, ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [active, ms]);
  return now;
}

function countdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

/** Minutes that can be started right now: limited by the bank and by today's cap. */
export function availableMinutes(a: AdventurerSummary, dailyCapMin: number): { capLeft: number; available: number } {
  const capLeft = Math.max(0, dailyCapMin - a.usedTodayMin);
  return { capLeft, available: Math.max(0, Math.min(a.timeBankMin, capLeft)) };
}

/** Time-bank frame: balance and "Usar tempo", or a live countdown while a session is running. */
export function TimeBankCard({
  adventurer: a,
  dailyCapMin,
  sessionEndsAt,
  now,
  onUse,
}: {
  adventurer: AdventurerSummary;
  dailyCapMin: number;
  sessionEndsAt: number | null;
  now: number;
  onUse: () => void;
}) {
  const { t } = useTranslation();
  const { capLeft, available } = availableMinutes(a, dailyCapMin);

  if (sessionEndsAt) {
    const leftMs = sessionEndsAt - now;
    return (
      <Frame accent={T.timeLine} style={{ gap: 12 }}>
        <View style={styles.row}>
          <Sprite name="hourglass" width={40} />
          <View style={{ flex: 1 }}>
            <Num size={30} color={T.time}>
              {countdown(leftMs)}
            </Num>
            <Body size={14} color={T.muted}>
              {t("adventurer.lock.sessionLeft")}
            </Body>
          </View>
        </View>
        <Bar ratio={dailyCapMin > 0 ? a.usedTodayMin / dailyCapMin : 1} color={T.timeFill} />
        <Body size={13} center color={T.soft}>
          {t("adventurer.lock.sessionEnds", { time: hhmm(sessionEndsAt) })}
        </Body>
        <Body size={13} center color={T.faint}>
          {`${formatMinutes(a.timeBankMin)} ${t("adventurer.lock.bank")}`}
        </Body>
      </Frame>
    );
  }

  const caption =
    a.timeBankMin < 0
      ? t("adventurer.lock.debt", { time: formatMinutes(-a.timeBankMin) })
      : capLeft <= 0
      ? t("adventurer.lock.capReached")
      : a.timeBankMin <= 0
        ? t("adventurer.lock.noBalance")
        : t("adventurer.lock.capLeft", { time: formatMinutes(capLeft) });

  return (
    <Frame style={{ gap: 12 }}>
      <View style={styles.row}>
        <Sprite name="hourglass" width={40} />
        <View style={{ flex: 1 }}>
          <Num size={26} color={a.timeBankMin < 0 ? T.bad : T.time}>
            {formatMinutes(a.timeBankMin)}
          </Num>
          <Body size={14} color={T.muted}>
            {t("adventurer.lock.bank")}
          </Body>
        </View>
      </View>
      <Button size="lg" label={t("adventurer.lock.useTime")} onPress={onUse} disabled={available <= 0} />
      <Body size={13} center color={T.faint}>
        {caption}
      </Body>
    </Frame>
  );
}

/** "Quanto tempo usar agora?" — 15 / 30 / 60 (whatever fits), or the whole remainder when less. */
export function UseTimeDialog({
  visible,
  available,
  busy,
  error,
  onPick,
  onCancel,
}: {
  visible: boolean;
  available: number;
  busy: boolean;
  error: string | null;
  onPick: (minutes: number) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const fits = PRESETS.filter((m) => m <= available);
  const options = fits.length ? fits : available > 0 ? [available] : [];
  return (
    <ModalFrame visible={visible} onDismiss={busy ? undefined : onCancel}>
      <View style={{ alignItems: "center", gap: 6 }}>
        <Sprite name="gate" width={56} />
        <Title size={20} center>
          {t("adventurer.lock.chooseTitle")}
        </Title>
        <Body center color={T.muted}>
          {t("adventurer.lock.chooseBody")}
        </Body>
      </View>
      <View style={{ gap: 8 }}>
        {options.map((m) => (
          <Button key={m} size="lg" sprite="hourglass" label={formatMinutes(m)} onPress={() => onPick(m)} disabled={busy} />
        ))}
      </View>
      {error ? (
        <Body center color={T.bad}>
          {error}
        </Body>
      ) : null}
      <Button variant="ghost" label={t("actions.cancel")} onPress={onCancel} disabled={busy} />
    </ModalFrame>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
});
