import { useMutation } from "convex/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, Card, Field, Toggle } from "@/components/ui";
import type { Me } from "@/lib/family";
import { api } from "../../../convex/_generated/api";
import { ErrorText, formatTimeInput, isValidTime, OptionSheet, SettingRow, Sheet, useBusy, ValueButton } from "./kit";

type Prefs = NonNullable<NonNullable<Me["family"]>["guardianPrefs"]>;

const REMINDER_HOURS = [0, 1, 2, 4];
const DEADLINE_MIN = [0, 15, 30, 60];

/** Sheet with one or two "HH:MM" fields, plus an "off" action that clears them. */
function TimeSheet({
  title,
  labels,
  initial,
  onSave,
  onClose,
}: {
  title: string;
  labels: string[];
  initial: string[];
  onSave: (values: string[]) => Promise<unknown>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState(initial.map((v) => v || ""));
  const { busy, error, setError, run } = useBusy();

  async function save(next: string[]) {
    if (next.some((v) => v !== "" && !isValidTime(v)) || (next.some((v) => v === "") && next.some((v) => v !== ""))) {
      setError(t("guardian.form.errors.time"));
      return;
    }
    const ok = await run(() => onSave(next));
    if (ok) onClose();
  }

  return (
    <Sheet visible onClose={onClose} title={title}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {labels.map((label, i) => (
          <View key={label} style={{ flex: 1 }}>
            <Field
              label={label}
              value={values[i]}
              placeholder="21:00"
              onChangeText={(v) => setValues((prev) => prev.map((p, j) => (j === i ? formatTimeInput(v) : p)))}
              keyboardType="number-pad"
              maxLength={5}
            />
          </View>
        ))}
      </View>
      <ErrorText>{error}</ErrorText>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button
          label={t("guardian.notices.turnOff")}
          variant="ghost"
          disabled={busy}
          onPress={() => void save(labels.map(() => ""))}
          style={{ flex: 1 }}
        />
        <Button label={t("actions.save")} busy={busy} onPress={() => void save(values)} style={{ flex: 1 }} />
      </View>
    </Sheet>
  );
}

/** "Quando me avisar": what the guardian gets pushed, and when to stay quiet. */
export function NoticePrefs({ prefs }: { prefs: Prefs }) {
  const { t } = useTranslation();
  const update = useMutation(api.family.updateGuardianPrefs);
  const [open, setOpen] = useState<"reminder" | "deadline" | "summary" | "quiet" | null>(null);
  const off = t("guardian.notices.off");
  const change = (what: string) => t("guardian.notices.change", { what });

  const hours = (h: number) => (h ? t("guardian.notices.hours", { count: h }) : off);
  const mins = (m: number) => (m ? t("guardian.notices.minutes", { count: m }) : off);
  const quiet = prefs.quietStart && prefs.quietEnd ? `${prefs.quietStart}–${prefs.quietEnd}` : off;

  return (
    <Card style={{ paddingVertical: 0, paddingHorizontal: 14 }}>
      <SettingRow
        title={t("guardian.notices.newSubmission")}
        desc={t("guardian.notices.newSubmissionDesc")}
        right={<Toggle value={prefs.newSubmission} onChange={(v) => void update({ newSubmission: v })} label={t("guardian.notices.newSubmission")} />}
      />
      <SettingRow
        title={t("guardian.notices.pendingReminder")}
        desc={t("guardian.notices.pendingReminderDesc")}
        right={<ValueButton label={hours(prefs.pendingReminderHours)} onPress={() => setOpen("reminder")} accessibilityLabel={change(t("guardian.notices.pendingReminder"))} />}
      />
      <SettingRow
        title={t("guardian.notices.deadlineWarn")}
        desc={t("guardian.notices.deadlineWarnDesc")}
        right={<ValueButton label={mins(prefs.deadlineWarnMin)} onPress={() => setOpen("deadline")} accessibilityLabel={change(t("guardian.notices.deadlineWarn"))} />}
      />
      <SettingRow
        title={t("guardian.notices.shopPurchase")}
        desc={t("guardian.notices.shopPurchaseDesc")}
        right={<Toggle value={prefs.shopPurchase} onChange={(v) => void update({ shopPurchase: v })} label={t("guardian.notices.shopPurchase")} />}
      />
      <SettingRow
        title={t("guardian.notices.dailySummary")}
        desc={t("guardian.notices.dailySummaryDesc")}
        right={<ValueButton label={prefs.dailySummary || off} onPress={() => setOpen("summary")} accessibilityLabel={change(t("guardian.notices.dailySummary"))} />}
      />
      <SettingRow
        last
        title={t("guardian.notices.quiet")}
        desc={t("guardian.notices.quietDesc")}
        right={<ValueButton label={quiet} onPress={() => setOpen("quiet")} accessibilityLabel={change(t("guardian.notices.quiet"))} />}
      />

      <OptionSheet
        visible={open === "reminder"}
        title={t("guardian.notices.pendingReminder")}
        value={prefs.pendingReminderHours}
        options={REMINDER_HOURS.map((h) => ({ value: h, label: hours(h) }))}
        onPick={(v) => void update({ pendingReminderHours: v })}
        onClose={() => setOpen(null)}
      />
      <OptionSheet
        visible={open === "deadline"}
        title={t("guardian.notices.deadlineWarn")}
        value={prefs.deadlineWarnMin}
        options={DEADLINE_MIN.map((m) => ({ value: m, label: mins(m) }))}
        onPick={(v) => void update({ deadlineWarnMin: v })}
        onClose={() => setOpen(null)}
      />
      {open === "summary" ? (
        <TimeSheet
          title={t("guardian.notices.dailySummary")}
          labels={[t("guardian.notices.at")]}
          initial={[prefs.dailySummary]}
          onSave={([v]) => update({ dailySummary: v })}
          onClose={() => setOpen(null)}
        />
      ) : null}
      {open === "quiet" ? (
        <TimeSheet
          title={t("guardian.notices.quiet")}
          labels={[t("guardian.notices.quietStart"), t("guardian.notices.quietEnd")]}
          initial={[prefs.quietStart, prefs.quietEnd]}
          onSave={([s, e]) => update({ quietStart: s, quietEnd: e })}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </Card>
  );
}
