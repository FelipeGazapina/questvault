import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/guardian/kit";
import { RewardChips } from "@/components/guardian/reward";
import { Body, Button, Card, Empty, Loading, Ornament, Screen, Sprite, Title, Toggle } from "@/components/ui";
import { CREST_SPRITE } from "@/lib/art";
import { useProfile } from "@/lib/family";
import { T } from "@/lib/theme";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";

/** Missões: every mission template, active first; toggle, edit or forge a new one. */
export default function Missions() {
  const { t } = useTranslation();
  const router = useRouter();
  const missions = useQuery(api.missions.listMissions, {});
  const catalog = useQuery(api.rewards.catalog, {});

  const itemTitle = (m: Doc<"missions">) => catalog?.items.find((i) => i._id === m.itemId)?.title ?? null;
  const active = missions?.filter((m) => m.active) ?? [];
  const paused = missions?.filter((m) => !m.active) ?? [];

  return (
    <Screen scene="taverna">
      <PageHeader sprite="board" spriteWidth={52} title={t("guardian.missions.title")} subtitle={t("guardian.missions.subtitle")} />
      <Button label={t("guardian.missions.forge")} sprite="anvil" size="lg" onPress={() => router.push("/guardiao/nova-missao" as never)} />

      {missions === undefined ? (
        <View style={{ height: 120 }}>
          <Loading />
        </View>
      ) : missions.length === 0 ? (
        <Empty sprite="board" text={t("guardian.missions.empty")} />
      ) : (
        <>
          {active.length > 0 ? <Ornament title={t("guardian.missions.active").toUpperCase()} /> : null}
          {active.map((m) => (
            <MissionCard key={m._id} m={m} itemTitle={itemTitle(m)} />
          ))}
          {paused.length > 0 ? <Ornament title={t("guardian.missions.paused").toUpperCase()} /> : null}
          {paused.map((m) => (
            <MissionCard key={m._id} m={m} itemTitle={itemTitle(m)} />
          ))}
        </>
      )}
    </Screen>
  );
}

function MissionCard({ m, itemTitle }: { m: Doc<"missions">; itemTitle: string | null }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { me } = useProfile();
  const setActive = useMutation(api.missions.setMissionActive);
  const assignees = (me?.adventurers ?? []).filter((a) => m.assignees.includes(a._id));

  const when = [
    t(`guardian.freq.${m.frequency}`),
    m.frequency === "daily" ? t("guardian.missions.appears", { time: m.appearTime }) : null,
    m.frequency === "weekly" ? t("guardian.missions.dueSunday", { time: m.dueTime }) : t("guardian.missions.due", { time: m.dueTime }),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card style={[styles.card, !m.active && { opacity: 0.7 }]}>
      <View style={styles.head}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("guardian.missions.edit", { title: m.title })}
          onPress={() => router.push(`/guardiao/nova-missao?id=${m._id}` as never)}
          style={{ flex: 1, gap: 3, minHeight: 44, justifyContent: "center" }}
        >
          <Title size={16}>{m.title}</Title>
          <Body size={13} color={T.muted}>
            {when}
          </Body>
        </Pressable>
        <Toggle
          value={m.active}
          onChange={(v) => void setActive({ missionId: m._id, active: v })}
          label={t("guardian.missions.activeToggle", { title: m.title })}
        />
      </View>

      <View style={styles.meta}>
        {assignees.map((a) => (
          <View key={a._id} style={styles.who}>
            <Sprite name={CREST_SPRITE[a.crest]} width={12} />
            <Body size={14} weight="bold" color={T.soft}>
              {a.name}
            </Body>
          </View>
        ))}
        {m.requirePhoto ? (
          <View style={styles.who}>
            <Icon name="camera" size={16} color={T.muted} />
            <Body size={13} color={T.muted}>
              {t("guardian.missions.photo")}
            </Body>
          </View>
        ) : null}
        {m.requireReport ? (
          <View style={styles.who}>
            <Icon name="quill" size={16} color={T.muted} />
            <Body size={13} color={T.muted}>
              {t("guardian.missions.report")}
            </Body>
          </View>
        ) : null}
      </View>

      <RewardChips rewardType={m.rewardType} coins={m.coins} minutes={m.minutes} itemTitle={itemTitle} xp={m.xp} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, padding: 14 },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 },
  who: { flexDirection: "row", alignItems: "center", gap: 6 },
});
