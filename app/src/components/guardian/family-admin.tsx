import { useMutation } from "convex/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { Body, Button, Card, Choice, CrestBadge, Field, Frame, Label, Seal, Sprite, Title } from "@/components/ui";
import { CREST_SPRITE } from "@/lib/art";
import type { AdventurerSummary } from "@/lib/family";
import { F, hhmm, T, type Crest } from "@/lib/theme";
import { api } from "../../../convex/_generated/api";
import { useAdventurerLine } from "./adventurer-card";
import { ErrorText, toInt, useBusy } from "./kit";

const CRESTS: Crest[] = ["teal", "violet", "red"];

type Draft = { name: string; age: string; crest: Crest };

/** Name, age and banner — used to add an adventurer and to edit one. */
function AdventurerFields({ draft, onChange }: { draft: Draft; onChange: (d: Draft) => void }) {
  const { t } = useTranslation();
  return (
    <>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 2 }}>
          <Field
            label={t("guardian.settings.name")}
            placeholder={t("guardian.settings.namePlaceholder")}
            value={draft.name}
            onChangeText={(name) => onChange({ ...draft, name })}
            maxLength={20}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label={t("guardian.settings.age")}
            value={draft.age}
            onChangeText={(age) => onChange({ ...draft, age: age.replace(/\D/g, "") })}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
      </View>
      <View style={{ gap: 6 }}>
        <Label>{t("guardian.settings.crest")}</Label>
        <View accessibilityRole="radiogroup" accessibilityLabel={t("guardian.settings.crest")} style={{ flexDirection: "row", gap: 8 }}>
          {CRESTS.map((c) => (
            <Choice
              key={c}
              selected={draft.crest === c}
              onPress={() => onChange({ ...draft, crest: c })}
              label={t(`guardian.settings.crests.${c}`)}
              style={styles.crest}
            >
              <Sprite name={CREST_SPRITE[c]} width={22} />
              <Body size={13} center color={draft.crest === c ? T.brassHi : T.muted}>
                {t(`guardian.settings.crests.${c}`)}
              </Body>
            </Choice>
          ))}
        </View>
      </View>
    </>
  );
}

export function AddAdventurer() {
  const { t } = useTranslation();
  const add = useMutation(api.family.addAdventurer);
  const [draft, setDraft] = useState<Draft>({ name: "", age: "", crest: "teal" });
  const { busy, error, setError, run } = useBusy();

  async function submit() {
    if (!draft.name.trim()) {
      setError(t("guardian.settings.nameRequired"));
      return;
    }
    const age = toInt(draft.age);
    const ok = await run(() => add({ name: draft.name.trim(), age: age || undefined, crest: draft.crest }));
    if (ok) setDraft({ name: "", age: "", crest: "teal" });
  }

  return (
    <Card style={{ gap: 12 }}>
      <Title size={16} color={T.brassHi}>
        {t("guardian.settings.add")}
      </Title>
      <AdventurerFields draft={draft} onChange={setDraft} />
      <ErrorText>{error}</ErrorText>
      <Button label={t("guardian.settings.addButton")} icon="plus" busy={busy} onPress={() => void submit()} />
    </Card>
  );
}

/** One adventurer: summary, phone pairing, edit and archive. */
export function AdventurerAdmin({ a }: { a: AdventurerSummary }) {
  const { t } = useTranslation();
  const line = useAdventurerLine();
  const update = useMutation(api.family.updateAdventurer);
  const archive = useMutation(api.family.archiveAdventurer);
  const pair = useMutation(api.family.createPairingCode);
  const [mode, setMode] = useState<"view" | "edit" | "archive">("view");
  const [draft, setDraft] = useState<Draft>({ name: a.name, age: a.age ? String(a.age) : "", crest: a.crest });
  const [code, setCode] = useState<{ code: string; expiresAt: number } | null>(null);
  const { busy, error, setError, run } = useBusy();

  async function save() {
    if (!draft.name.trim()) {
      setError(t("guardian.settings.nameRequired"));
      return;
    }
    const ok = await run(() => update({ adventurerId: a._id, name: draft.name.trim(), age: toInt(draft.age), crest: draft.crest }));
    if (ok) setMode("view");
  }

  async function makeCode() {
    await run(async () => setCode(await pair({ adventurerId: a._id })));
  }

  return (
    <Frame style={{ gap: 12 }}>
      <View style={styles.head}>
        <CrestBadge crest={a.crest} size={40} />
        <View style={{ flex: 1, gap: 2 }}>
          <Title size={17}>{a.name}</Title>
          <Body size={13} color={T.muted}>
            {line(a)}
          </Body>
        </View>
        {a.paired ? (
          <Seal kind="ok" icon="phone" label={t("guardian.settings.paired")} />
        ) : (
          <Seal kind="todo" icon="phone" label={t("guardian.settings.notPaired")} />
        )}
      </View>

      {mode === "edit" ? (
        <>
          <AdventurerFields draft={draft} onChange={setDraft} />
          <ErrorText>{error}</ErrorText>
          <View style={styles.pair}>
            <Button label={t("actions.cancel")} variant="ghost" onPress={() => setMode("view")} style={{ flex: 1 }} />
            <Button label={t("actions.save")} busy={busy} onPress={() => void save()} style={{ flex: 1 }} />
          </View>
        </>
      ) : mode === "archive" ? (
        <>
          <Body size={15}>{t("guardian.settings.archiveConfirm", { name: a.name })}</Body>
          <ErrorText>{error}</ErrorText>
          <View style={styles.pair}>
            <Button label={t("actions.cancel")} variant="ghost" onPress={() => setMode("view")} style={{ flex: 1 }} />
            <Button
              label={t("guardian.settings.archive")}
              variant="danger"
              busy={busy}
              onPress={() => void run(() => archive({ adventurerId: a._id }))}
              style={{ flex: 1 }}
            />
          </View>
        </>
      ) : (
        <>
          {code ? (
            <Card style={{ alignItems: "center", gap: 8, paddingVertical: 16 }}>
              <Label>{t("guardian.settings.codeTitle", { name: a.name })}</Label>
              <Text style={styles.code} accessibilityLabel={code.code.split("").join(" ")}>
                {code.code}
              </Text>
              <Body size={13} color={T.muted}>
                {t("guardian.settings.codeExpires", { time: hhmm(code.expiresAt) })}
              </Body>
              <Body size={14} center color={T.soft}>
                {t("guardian.settings.codeSteps")}
              </Body>
            </Card>
          ) : null}
          <ErrorText>{error}</ErrorText>
          <Button
            label={code ? t("guardian.settings.newCode") : t("guardian.settings.pair")}
            icon="phone"
            variant={a.paired || code ? "ghost" : "primary"}
            busy={busy}
            onPress={() => void makeCode()}
          />
          <View style={styles.pair}>
            <Button label={t("guardian.settings.edit")} variant="ghost" icon="quill" onPress={() => setMode("edit")} style={{ flex: 1 }} />
            <Button
              label={t("guardian.settings.archive")}
              variant="danger"
              icon="trash"
              onPress={() => setMode("archive")}
              style={{ flex: 1 }}
            />
          </View>
        </>
      )}
    </Frame>
  );
}

/** PIN that guards leaving a child profile on this phone. */
export function PinCard({ hasPin }: { hasPin: boolean }) {
  const { t } = useTranslation();
  const setPin = useMutation(api.family.setPin);
  const [pin, setPinValue] = useState("");
  const [saved, setSaved] = useState(false);
  const { busy, error, setError, run } = useBusy();

  async function save(value: string) {
    setSaved(false);
    if (value !== "" && !/^\d{4,6}$/.test(value)) {
      setError(t("guardian.settings.pinInvalid"));
      return;
    }
    const ok = await run(() => setPin({ pin: value }));
    if (ok) {
      setPinValue("");
      setSaved(value !== "");
    }
  }

  return (
    <Card style={{ gap: 12 }}>
      <View style={styles.head}>
        <Sprite name="padlock" width={30} />
        <Body size={14} color={T.soft} style={{ flex: 1 }}>
          {t("guardian.settings.pinDesc")}
        </Body>
      </View>
      <Seal kind={hasPin ? "ok" : "todo"} icon="lock" label={hasPin ? t("guardian.settings.pinOn") : t("guardian.settings.pinOff")} />
      <Field
        label={t("guardian.settings.pinLabel")}
        value={pin}
        onChangeText={(v) => setPinValue(v.replace(/\D/g, ""))}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
      />
      <ErrorText>{error}</ErrorText>
      {saved ? (
        <Body size={14} color={T.ok}>
          {t("guardian.settings.pinSaved")}
        </Body>
      ) : null}
      <View style={styles.pair}>
        {hasPin ? (
          <Button label={t("guardian.settings.pinClear")} variant="danger" disabled={busy} onPress={() => void save("")} style={{ flex: 1 }} />
        ) : null}
        <Button label={t("guardian.settings.pinSave")} busy={busy} disabled={pin.length < 4} onPress={() => void save(pin)} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  pair: { flexDirection: "row", gap: 10 },
  crest: { flex: 1, alignItems: "center", minHeight: 76, justifyContent: "center" },
  code: { fontFamily: F.heavy, fontSize: 40, letterSpacing: 8, color: T.brassHi, fontVariant: ["tabular-nums"] },
});
