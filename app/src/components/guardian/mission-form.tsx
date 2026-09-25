import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { Icon } from "@/components/icons";
import { Body, Button, Card, Choice, Field, Label, Ornament, Segmented, Sprite, Toggle } from "@/components/ui";
import { CREST_SPRITE, type SpriteName } from "@/lib/art";
import { useProfile } from "@/lib/family";
import { T } from "@/lib/theme";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { DIFFICULTY_XP, type Difficulty, type Frequency } from "../../../convex/rules";
import { ErrorText, formatTimeInput, isValidTime, Note, Price, SettingRow, toInt, useBusy } from "./kit";
import type { RewardType } from "./reward";

type Form = {
  title: string;
  description: string;
  assignees: Id<"adventurers">[];
  frequency: Frequency;
  appearTime: string;
  dueTime: string;
  requirePhoto: boolean;
  requireReport: boolean;
  rewardType: RewardType;
  coins: string;
  minutes: string;
  itemId: Id<"shopItems"> | undefined;
  difficulty: Difficulty;
};

function initialForm(m: Doc<"missions"> | null, adventurerIds: Id<"adventurers">[]): Form {
  if (m) {
    return {
      title: m.title,
      description: m.description ?? "",
      assignees: m.assignees,
      frequency: m.frequency,
      appearTime: m.appearTime,
      dueTime: m.dueTime,
      requirePhoto: m.requirePhoto,
      requireReport: m.requireReport,
      rewardType: m.rewardType,
      coins: m.coins ? String(m.coins) : "",
      minutes: m.minutes ? String(m.minutes) : "",
      itemId: m.itemId,
      difficulty: m.difficulty,
    };
  }
  return {
    title: "",
    description: "",
    assignees: adventurerIds.length === 1 ? adventurerIds : [],
    frequency: "daily",
    appearTime: "17:00",
    dueTime: "20:00",
    requirePhoto: true,
    requireReport: true,
    rewardType: "choice",
    coins: "50",
    minutes: "30",
    itemId: undefined,
    difficulty: "medium",
  };
}

/** Daily runs spawn (and announce) at the appear time — or right away if it already passed today. */
function isLaterToday(hhmm: string): boolean {
  if (!isValidTime(hhmm)) return false;
  const now = new Date();
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m > now.getHours() * 60 + now.getMinutes();
}

const REWARD_TYPES: { value: RewardType; sprites: SpriteName[]; key: string }[] = [
  { value: "coins", sprites: ["coin"], key: "coins" },
  { value: "time", sprites: ["hourglass"], key: "time" },
  { value: "item", sprites: ["chest"], key: "item" },
  { value: "choice", sprites: ["coin", "hourglass"], key: "choice" },
];

/** Create or edit a mission template ("Forjar nova missão"). */
export function MissionForm({ mission, onSaved }: { mission: Doc<"missions"> | null; onSaved: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { me } = useProfile();
  const catalog = useQuery(api.rewards.catalog, {});
  const create = useMutation(api.missions.createMission);
  const update = useMutation(api.missions.updateMission);
  const adventurers = me?.adventurers ?? [];
  const [f, setF] = useState<Form>(() => initialForm(mission, adventurers.map((a) => a._id)));
  const { busy, error, setError, run } = useBusy();
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setF((prev) => ({ ...prev, [key]: value }));

  const needsCoins = f.rewardType === "coins" || f.rewardType === "choice";
  const needsMinutes = f.rewardType === "time" || f.rewardType === "choice";
  const items = catalog?.items ?? [];

  function toggleAssignee(id: Id<"adventurers">) {
    set("assignees", f.assignees.includes(id) ? f.assignees.filter((x) => x !== id) : [...f.assignees, id]);
  }

  function validate(): string | null {
    if (!f.title.trim()) return t("guardian.form.errors.title");
    if (f.assignees.length === 0) return t("guardian.form.errors.assignees");
    if (!isValidTime(f.dueTime) || (f.frequency === "daily" && !isValidTime(f.appearTime))) return t("guardian.form.errors.time");
    if (needsCoins && toInt(f.coins) <= 0) return t("guardian.form.errors.coins");
    if (needsMinutes && toInt(f.minutes) <= 0) return t("guardian.form.errors.minutes");
    if (f.rewardType === "item" && !f.itemId) return t("guardian.form.errors.item");
    return null;
  }

  async function submit() {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    const args = {
      title: f.title.trim(),
      description: f.description.trim() || undefined,
      assignees: f.assignees,
      frequency: f.frequency,
      appearTime: isValidTime(f.appearTime) ? f.appearTime : "00:00",
      dueTime: f.dueTime,
      requirePhoto: f.requirePhoto,
      requireReport: f.requireReport,
      rewardType: f.rewardType,
      coins: needsCoins ? toInt(f.coins) : 0,
      minutes: needsMinutes ? toInt(f.minutes) : 0,
      itemId: f.rewardType === "item" ? f.itemId : undefined,
      difficulty: f.difficulty,
    };
    const ok = await run(() => (mission ? update({ missionId: mission._id, ...args }) : create(args)));
    if (ok) onSaved();
  }

  const names = adventurers.filter((a) => f.assignees.includes(a._id)).map((a) => a.name);
  const joined = names.length > 1 ? `${names.slice(0, -1).join(", ")}${t("guardian.form.and")}${names[names.length - 1]}` : names[0];

  return (
    <>
      <Ornament title={t("guardian.form.mission").toUpperCase()} />
      <Field
        label={t("guardian.form.name")}
        placeholder={t("guardian.form.namePlaceholder")}
        value={f.title}
        onChangeText={(v) => set("title", v)}
        maxLength={80}
      />
      <Field
        label={t("guardian.form.description")}
        placeholder={t("guardian.form.descriptionPlaceholder")}
        value={f.description}
        onChangeText={(v) => set("description", v)}
        multiline
        maxLength={400}
      />

      <View style={{ gap: 8 }}>
        <Label>{t("guardian.form.forWho")}</Label>
        <View style={styles.grid2}>
          {adventurers.map((a) => {
            const on = f.assignees.includes(a._id);
            return (
              <Choice
                key={a._id}
                role="checkbox"
                selected={on}
                label={a.name}
                onPress={() => toggleAssignee(a._id)}
                style={[styles.half, styles.whoChoice]}
              >
                <Sprite name={CREST_SPRITE[a.crest]} width={19} />
                <Body weight="bold" style={{ flex: 1 }} numberOfLines={1}>
                  {a.name}
                </Body>
                {on ? <Icon name="check" size={20} color={T.brassHi} /> : null}
              </Choice>
            );
          })}
        </View>
      </View>

      <Ornament title={t("guardian.form.when").toUpperCase()} />
      <Segmented<Frequency>
        label={t("guardian.form.frequency")}
        value={f.frequency}
        onChange={(v) => set("frequency", v)}
        options={(["once", "daily", "weekly"] as const).map((v) => ({ value: v, label: t(`guardian.freq.${v}`) }))}
      />
      <View style={styles.grid2}>
        {f.frequency === "daily" ? (
          <View style={styles.half}>
            <Field
              label={t("guardian.form.appearAt")}
              value={f.appearTime}
              onChangeText={(v) => set("appearTime", formatTimeInput(v))}
              keyboardType="number-pad"
              placeholder="17:00"
              maxLength={5}
            />
          </View>
        ) : null}
        <View style={styles.half}>
          <Field
            label={t("guardian.form.dueAt")}
            value={f.dueTime}
            onChangeText={(v) => set("dueTime", formatTimeInput(v))}
            keyboardType="number-pad"
            placeholder="20:00"
            maxLength={5}
          />
        </View>
      </View>
      {f.frequency !== "daily" ? (
        <Body size={13} color={T.muted}>
          {t(f.frequency === "weekly" ? "guardian.form.weeklyHint" : "guardian.form.onceHint")}
        </Body>
      ) : null}

      <Ornament title={t("guardian.form.proof").toUpperCase()} />
      <Card style={{ paddingVertical: 0, paddingHorizontal: 14 }}>
        <SettingRow
          icon={<Icon name="camera" size={22} color={T.brassHi} />}
          title={t("guardian.form.photoRequired")}
          desc={t("guardian.form.photoRequiredDesc")}
          right={<Toggle value={f.requirePhoto} onChange={(v) => set("requirePhoto", v)} label={t("guardian.form.photoRequired")} />}
        />
        <SettingRow
          last
          icon={<Icon name="quill" size={22} color={T.brassHi} />}
          title={t("guardian.form.reportRequired")}
          desc={t("guardian.form.reportRequiredDesc")}
          right={<Toggle value={f.requireReport} onChange={(v) => set("requireReport", v)} label={t("guardian.form.reportRequired")} />}
        />
      </Card>

      <Ornament title={t("guardian.form.reward").toUpperCase()} />
      <View accessibilityRole="radiogroup" accessibilityLabel={t("guardian.form.rewardType")} style={styles.grid2}>
        {REWARD_TYPES.map((r) => (
          <Choice
            key={r.value}
            selected={f.rewardType === r.value}
            label={t(`guardian.form.${r.key}`)}
            onPress={() => set("rewardType", r.value)}
            style={styles.half}
          >
            <View style={{ flexDirection: "row", gap: 4, height: 24, alignItems: "center" }}>
              {r.sprites.map((s) => (
                <Sprite key={s} name={s} width={s === "chest" ? 33 : s === "coin" ? 26 : 23} />
              ))}
            </View>
            <Body size={15} weight="bold">
              {t(`guardian.form.${r.key}`)}
            </Body>
            <Body size={13} color={T.muted}>
              {t(`guardian.form.${r.key}Desc`)}
            </Body>
          </Choice>
        ))}
      </View>

      {needsCoins || needsMinutes ? (
        <View style={styles.grid2}>
          {needsCoins ? (
            <View style={[styles.half, { gap: 6 }]}>
              <Label color={T.coin}>{t("guardian.form.coinsAmount")}</Label>
              <Field
                accessibilityLabel={t("guardian.form.coinsAmount")}
                value={f.coins}
                onChangeText={(v) => set("coins", v.replace(/\D/g, ""))}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
          ) : null}
          {needsMinutes ? (
            <View style={[styles.half, { gap: 6 }]}>
              <Label color={T.time}>{t("guardian.form.minutesAmount")}</Label>
              <Field
                accessibilityLabel={t("guardian.form.minutesAmount")}
                value={f.minutes}
                onChangeText={(v) => set("minutes", v.replace(/\D/g, ""))}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {f.rewardType === "item" ? (
        <View style={{ gap: 8 }}>
          <Label>{t("guardian.form.pickItem")}</Label>
          {items.length === 0 ? (
            <Card style={{ gap: 10 }}>
              <Body size={14} color={T.muted}>
                {t("guardian.form.noItems")}
              </Body>
              <Button label={t("guardian.form.goToRewards")} variant="ghost" onPress={() => router.push("/guardiao/recompensas" as never)} />
            </Card>
          ) : (
            items.map((it) => (
              <Choice
                key={it._id}
                selected={f.itemId === it._id}
                label={it.title}
                onPress={() => set("itemId", it._id)}
                style={styles.itemChoice}
              >
                <Sprite name="chest" width={30} />
                <Body weight="bold" style={{ flex: 1 }}>
                  {it.title}
                </Body>
                <Price coins={it.priceCoins} />
              </Choice>
            ))
          )}
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <Label>{t("guardian.form.difficulty")}</Label>
        <Segmented<Difficulty>
          label={t("guardian.form.difficulty")}
          value={f.difficulty}
          onChange={(v) => set("difficulty", v)}
          options={(["easy", "medium", "hard"] as const).map((v) => ({
            value: v,
            label: t(`guardian.form.${v}`, { xp: DIFFICULTY_XP[v] }),
          }))}
        />
      </View>

      <ErrorText>{error}</ErrorText>
      <Button
        label={mission ? t("guardian.form.submitEdit") : t("guardian.form.submitNew")}
        size="lg"
        busy={busy}
        onPress={() => void submit()}
        style={{ marginTop: 6 }}
      />
      {!mission && joined ? (
        <Note>
          {f.frequency === "daily" && isLaterToday(f.appearTime)
            ? t("guardian.form.notifyAt", { count: names.length, names: joined, time: f.appearTime })
            : t("guardian.form.notifyNow", { count: names.length, names: joined })}
        </Note>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  half: { flexBasis: "47%", flexGrow: 1 },
  whoChoice: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 56 },
  itemChoice: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56 },
});
