import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { AdventurerCard } from "@/components/guardian/adventurer-card";
import { GiveTimeSheet, type GiveTimeTarget } from "@/components/guardian/give-time";
import { ActivityRow } from "@/components/guardian/notice";
import { Body, Button, Empty, Frame, IconButton, Label, Loading, Ornament, Screen, Slot, Sprite, Title } from "@/components/ui";
import { useProfile } from "@/lib/family";
import { T } from "@/lib/theme";
import { greetingKey, timeAgo } from "@/lib/time";
import { api } from "../../../convex/_generated/api";

/** Salão do Guardião: pending deliveries, each adventurer at a glance, recent activity. */
export default function GuardianHome() {
  const { t } = useTranslation();
  const router = useRouter();
  const { me } = useProfile();
  const pending = useQuery(api.missions.pendingCount, {});
  const inbox = useQuery(api.notify.guardianInbox, { limit: 30 });
  const [giveTo, setGiveTo] = useState<GiveTimeTarget>(null);

  if (!me) return <Loading />;
  const adventurers = me.adventurers;
  const unread = inbox?.unread ?? 0;

  return (
    <Screen scene="castelo" gap={18}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Slot size={46} style={{ height: 56 }}>
          <Sprite name="helm" width={36} />
        </Slot>
        <View style={{ flex: 1, gap: 2 }}>
          <Label>{t("guardian.painel.hall")}</Label>
          <Title size={22} numberOfLines={1}>
            {t(`guardian.greeting.${greetingKey()}`, { name: me.user.name })}
          </Title>
        </View>
        <IconButton
          sprite="bell"
          badge={unread || undefined}
          label={unread ? t("guardian.painel.noticesUnread", { count: unread }) : t("guardian.painel.notices")}
          onPress={() => router.push("/guardiao/avisos" as never)}
        />
        <IconButton icon="gear" label={t("guardian.painel.settings")} onPress={() => router.push("/guardiao/ajustes" as never)} />
      </View>

      {pending && pending.count > 0 ? (
        <Frame style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Sprite name="scroll" width={66} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ gap: 2 }}>
              <Title size={17} color={T.brassHi}>
                {t("guardian.painel.pending", { count: pending.count })}
              </Title>
              {pending.oldestAt ? (
                <Body size={14} color={T.muted}>
                  {t("guardian.painel.oldest", { ago: timeAgo(t, pending.oldestAt) })}
                </Body>
              ) : null}
            </View>
            <Button
              label={t("guardian.painel.review")}
              onPress={() => router.push("/guardiao/aprovacoes" as never)}
              style={{ alignSelf: "flex-start", minHeight: 44 }}
            />
          </View>
        </Frame>
      ) : pending ? (
        <Frame style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Sprite name="chestOpen" width={52} />
          <View style={{ flex: 1, gap: 2 }}>
            <Title size={16} color={T.brassHi}>
              {t("guardian.painel.calmTitle")}
            </Title>
            <Body size={14} color={T.muted}>
              {t("guardian.painel.calmBody")}
            </Body>
          </View>
        </Frame>
      ) : null}

      <Ornament title={t("guardian.painel.adventurers").toUpperCase()} />
      {adventurers.length === 0 ? (
        <View style={{ gap: 10 }}>
          <Empty sprite="helm" text={t("guardian.painel.noAdventurers")} />
          <Button label={t("guardian.painel.addAdventurer")} icon="plus" onPress={() => router.push("/guardiao/ajustes" as never)} />
        </View>
      ) : (
        adventurers.map((a) => (
          <AdventurerCard
            key={a._id}
            a={a}
            onGiveTime={() => setGiveTo({ _id: a._id, name: a.name })}
            onApps={() => router.push(`/guardiao/apps?a=${a._id}` as never)}
          />
        ))
      )}

      <Ornament title={t("guardian.painel.recent").toUpperCase()} />
      {inbox === undefined ? null : inbox.items.length === 0 ? (
        <Empty text={t("guardian.painel.noActivity")} />
      ) : (
        <View style={{ gap: 8 }}>
          {inbox.items.slice(0, 4).map((n) => (
            <ActivityRow key={n._id} kind={n.kind} params={n.params} createdAt={n.createdAt} />
          ))}
        </View>
      )}

      <GiveTimeSheet target={giveTo} onClose={() => setGiveTo(null)} />
    </Screen>
  );
}
