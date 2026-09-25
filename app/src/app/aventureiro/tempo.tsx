import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { PinPrompt } from "@/components/access/pin-prompt";
import { AppGrid } from "@/components/adventurer/app-tile";
import { GateScreen } from "@/components/adventurer/gate-screen";
import { TimeBankCard, UseTimeDialog, availableMinutes, useNow } from "@/components/adventurer/time-bank";
import { Body, Button, Card, Loading, Ornament, Sprite } from "@/components/ui";
import { errorKey, useAdventurer, useProfile } from "@/lib/family";
import { hhmm, T } from "@/lib/theme";
import { timeAgo } from "@/lib/time";
import { api } from "../../../convex/_generated/api";
import { normalizePushLocale, renderNotice } from "../../../convex/pushMessages";

const RECENT_NOTICES = 5;

/** "Meu tempo": the lock screen — time bank, what stays open, what opens with time, recent notices. */
export default function AdventurerTime() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { me, leaveProfile } = useProfile();
  const adventurer = useAdventurer();
  const adventurerId = adventurer?._id;
  const apps = useQuery(api.apps.listApps, adventurerId ? { adventurerId } : "skip");
  const inbox = useQuery(api.notify.adventurerInbox, adventurerId ? { adventurerId } : "skip");
  const startScreenTime = useMutation(api.rewards.startScreenTime);

  const [choosing, setChoosing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [askPin, setAskPin] = useState(false);

  const endsAt = adventurer?.sessionEndsAt ?? null;
  const now = useNow(!!endsAt);

  if (!adventurer || !me?.family) return <Loading />;

  const cap = me.family.settings.maxDailyScreenMin;
  const sessionEndsAt = endsAt && endsAt > now ? endsAt : null;
  const { available } = availableMinutes(adventurer, cap);
  const isGuardianPhone = me.user.role === "guardian";
  const locale = normalizePushLocale(i18n.language);

  const start = async (minutes: number) => {
    setBusy(true);
    setError(null);
    try {
      const { endsAt: until } = await startScreenTime({ adventurerId: adventurer._id, minutes });
      setChoosing(false);
      setNotice(t("adventurer.lock.started", { time: hhmm(until) }));
    } catch (e) {
      setError(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  const switchProfile = () => {
    leaveProfile();
    router.replace("/");
  };

  const free = (apps ?? []).filter((a) => a.mode === "free");
  const timed = (apps ?? []).filter((a) => a.mode === "time");

  return (
    <GateScreen
      title={sessionEndsAt ? t("adventurer.lock.openTitle") : t("adventurer.lock.closedTitle")}
      body={
        sessionEndsAt
          ? t("adventurer.lock.openBody", { time: hhmm(sessionEndsAt) })
          : t("adventurer.lock.closedBody", { name: adventurer.name })
      }
    >
      <TimeBankCard
        adventurer={adventurer}
        dailyCapMin={cap}
        sessionEndsAt={sessionEndsAt}
        now={now}
        onUse={() => {
          setError(null);
          setChoosing(true);
        }}
      />
      {notice && sessionEndsAt ? (
        <Body center color={T.time} weight="bold">
          {notice}
        </Body>
      ) : null}

      {apps === undefined ? null : (
        <>
          <Ornament title={t("adventurer.lock.alwaysOpen")} />
          {free.length ? <AppGrid apps={free} /> : <Body center color={T.faint}>{t("adventurer.lock.noApps")}</Body>}
          <Ornament title={t("adventurer.lock.withTime")} />
          {timed.length ? <AppGrid apps={timed} timed /> : <Body center color={T.faint}>{t("adventurer.lock.noApps")}</Body>}
        </>
      )}

      <Button variant="ghost" size="lg" sprite="board" label={t("adventurer.lock.seeMissions")} onPress={() => router.navigate("/aventureiro")} />

      {inbox && inbox.length ? (
        <>
          <Ornament title={t("adventurer.lock.notices")} />
          <View style={{ gap: 8 }}>
            {inbox.slice(0, RECENT_NOTICES).map((n) => {
              const copy = renderNotice(n.kind, n.params, locale);
              return (
                <Card key={n._id} style={styles.notice}>
                  <Sprite name="bell" width={20} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Body weight="bold" size={15}>
                      {copy.title}
                    </Body>
                    {copy.body ? (
                      <Body size={14} color={T.soft}>
                        {copy.body}
                      </Body>
                    ) : null}
                  </View>
                  <Body size={12} color={T.faint}>
                    {timeAgo(t, n.createdAt)}
                  </Body>
                </Card>
              );
            })}
          </View>
        </>
      ) : null}

      <Body size={13} center color={T.faint}>
        {t("adventurer.lock.companionNote")}
      </Body>

      {isGuardianPhone ? (
        askPin ? (
          <Card>
            <PinPrompt onSuccess={switchProfile} onCancel={() => setAskPin(false)} />
          </Card>
        ) : (
          <Button
            variant="ghost"
            icon="logout"
            label={t("adventurer.lock.switchProfile")}
            onPress={() => (me.family?.hasPin ? setAskPin(true) : switchProfile())}
          />
        )
      ) : null}

      <UseTimeDialog
        visible={choosing}
        available={available}
        busy={busy}
        error={error}
        onPick={start}
        onCancel={() => setChoosing(false)}
      />
    </GateScreen>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
});
