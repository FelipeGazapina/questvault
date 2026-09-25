import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppRow, MODE_COLOR } from "@/components/guardian/app-row";
import { GiveTimeSheet, type GiveTimeTarget } from "@/components/guardian/give-time";
import { ErrorText, PageHeader, useBusy } from "@/components/guardian/kit";
import { LockSeal } from "@/components/guardian/adventurer-card";
import { Bar, Body, Button, Card, Empty, Field, Frame, Loading, Num, Ornament, Screen, Sprite, Toggle } from "@/components/ui";
import { CREST_SPRITE } from "@/lib/art";
import { useProfile, type AdventurerSummary } from "@/lib/family";
import { F, formatMinutes, T } from "@/lib/theme";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

/** Portões do celular: per-adventurer lock, time bank and app policy (Livre / Tempo / Bloq.). */
export default function Apps() {
  const { t } = useTranslation();
  const { me } = useProfile();
  const { a } = useLocalSearchParams<{ a?: string }>();
  const adventurers = me?.adventurers ?? [];
  const [picked, setPicked] = useState<string | undefined>(a);

  // Honour "Apps de X" from the Painel even though this tab screen stays mounted.
  useEffect(() => {
    if (a) setPicked(a);
  }, [a]);

  if (!me) return <Loading />;
  const current = adventurers.find((x) => x._id === picked) ?? adventurers[0];

  return (
    <Screen scene="portaoFaixa">
      <PageHeader sprite="gate" spriteWidth={48} title={t("guardian.apps.title")} subtitle={t("guardian.apps.subtitle")} />
      {!current ? (
        <Empty sprite="gate" text={t("guardian.apps.noAdventurers")} />
      ) : (
        <>
          <View accessibilityRole="radiogroup" accessibilityLabel={t("guardian.apps.who")} style={styles.whoRow}>
            {adventurers.map((x) => {
              const on = x._id === current._id;
              return (
                <Pressable
                  key={x._id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={x.name}
                  onPress={() => setPicked(x._id)}
                  style={[styles.who, on && styles.whoOn]}
                >
                  <Sprite name={CREST_SPRITE[x.crest]} width={19} />
                  <Text style={[styles.whoText, { color: on ? T.brassHi : T.muted }]} numberOfLines={1}>
                    {x.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <AdventurerApps key={current._id} adv={current} maxDaily={me.family?.settings.maxDailyScreenMin ?? 120} />
        </>
      )}
    </Screen>
  );
}

function AdventurerApps({ adv, maxDaily }: { adv: AdventurerSummary; maxDaily: number }) {
  const { t } = useTranslation();
  const apps = useQuery(api.apps.listApps, { adventurerId: adv._id });
  const updateAdventurer = useMutation(api.family.updateAdventurer);
  const [giveTo, setGiveTo] = useState<GiveTimeTarget>(null);

  return (
    <>
      <Frame style={{ gap: 14 }}>
        <View style={styles.rowCenter}>
          <Sprite name="padlock" width={34} />
          <View style={{ flex: 1, gap: 2 }}>
            <Body size={17} weight="bold">
              {t("guardian.apps.lock")}
            </Body>
            <Body size={13} color={T.muted}>
              {t("guardian.apps.lockDesc")}
            </Body>
          </View>
          <Toggle
            value={adv.lockEnabled}
            onChange={(v) => void updateAdventurer({ adventurerId: adv._id, lockEnabled: v })}
            label={t("guardian.apps.lockLabel", { name: adv.name })}
          />
        </View>
        {adv.sessionEndsAt ? <LockSeal a={adv} /> : null}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Card style={[styles.rowCenter, styles.stat]}>
            <Sprite name="hourglass" width={24} />
            <View style={{ flex: 1 }}>
              <Num size={18} color={T.time}>
                {formatMinutes(adv.timeBankMin)}
              </Num>
              <Body size={12} color={T.muted}>
                {t("guardian.apps.bank")}
              </Body>
            </View>
          </Card>
          <Card style={[styles.rowCenter, styles.stat]}>
            <Sprite name="torch" width={12} />
            <View style={{ flex: 1 }}>
              <Num size={18}>{formatMinutes(adv.usedTodayMin)}</Num>
              <Body size={12} color={T.muted}>
                {t("guardian.apps.usedOf", { max: formatMinutes(maxDaily) })}
              </Body>
            </View>
          </Card>
        </View>
        <Bar ratio={maxDaily ? adv.usedTodayMin / maxDaily : 0} color={T.timeFill} />
        <Button
          label={t("guardian.apps.giveExtra")}
          variant="ghost"
          icon="hourglass"
          onPress={() => setGiveTo({ _id: adv._id, name: adv.name })}
        />
      </Frame>

      <Ornament title={t("guardian.apps.list").toUpperCase()} />
      <View style={styles.legend}>
        {(["free", "time", "blocked"] as const).map((m) => (
          <View key={m} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: MODE_COLOR[m] }]} />
            <Text style={styles.legendText}>
              <Text style={{ color: T.text, fontFamily: F.bold }}>{t(`guardian.apps.${m}`)}</Text> {t(`guardian.apps.${m}Desc`)}
            </Text>
          </View>
        ))}
      </View>

      {apps === undefined ? (
        <View style={{ height: 80 }}>
          <Loading />
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {apps.map((rule) => (
            <AppRow key={rule._id} rule={rule} />
          ))}
        </View>
      )}
      <AddApp adventurerId={adv._id} />

      <Body size={13} color={T.faint}>
        {t("guardian.apps.essentialNote")}
      </Body>
      <Body size={13} color={T.faint}>
        {t("guardian.apps.removeHint")} {t("guardian.apps.companionNote")}
      </Body>
      <GiveTimeSheet target={giveTo} onClose={() => setGiveTo(null)} />
    </>
  );
}

function AddApp({ adventurerId }: { adventurerId: Id<"adventurers"> }) {
  const { t } = useTranslation();
  const addApp = useMutation(api.apps.addApp);
  const [name, setName] = useState("");
  const { busy, error, run } = useBusy();

  async function submit() {
    if (!name.trim()) return;
    const ok = await run(() => addApp({ adventurerId, name: name.trim(), mode: "time" }));
    if (ok) setName("");
  }

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Field
            accessibilityLabel={t("guardian.apps.addLabel")}
            placeholder={t("guardian.apps.addPlaceholder")}
            value={name}
            onChangeText={setName}
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={() => void submit()}
          />
        </View>
        <Button label={t("guardian.apps.add")} icon="plus" variant="ghost" busy={busy} disabled={!name.trim()} onPress={() => void submit()} />
      </View>
      <ErrorText>{error}</ErrorText>
    </View>
  );
}

const styles = StyleSheet.create({
  rowCenter: { flexDirection: "row", alignItems: "center", gap: 12 },
  whoRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  who: {
    flexGrow: 1,
    flexBasis: "30%",
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: T.lineSoft,
    borderRadius: 6,
    backgroundColor: T.surface,
  },
  whoOn: { borderColor: T.brass, borderWidth: 2, backgroundColor: T.cardHi },
  whoText: { fontFamily: F.bold, fontSize: 16, flexShrink: 1 },
  stat: { flex: 1, padding: 10, gap: 10 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontFamily: F.body, fontSize: 13, color: T.muted },
});
