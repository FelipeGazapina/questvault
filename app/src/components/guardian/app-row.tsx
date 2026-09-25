import { useMutation } from "convex/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Body, Button, Card } from "@/components/ui";
import { F, T } from "@/lib/theme";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { ErrorText, useBusy } from "./kit";

export type AppMode = Doc<"appRules">["mode"];

export const MODE_COLOR: Record<AppMode, string> = { free: T.okFill, time: T.timeFill, blocked: T.badFill };
const MODE_KEY: Record<AppMode, string> = { free: "free", time: "time", blocked: "blocked" };
const MODE_NOTE: Record<AppMode, string> = { free: "noteFree", time: "noteTime", blocked: "noteBlocked" };
const MODES: AppMode[] = ["free", "time", "blocked"];

const TILE = ["#3f6b4a", "#3f5a7a", "#2f5f59", "#4d6b2f", "#7d362e", "#4a4f5c", "#3a2e44", "#5a4630"];

function tileColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TILE[h % TILE.length];
}

/** One app: initial tile, name, Livre / Tempo / Bloq. Long press removes a non-essential app. */
export function AppRow({ rule }: { rule: Doc<"appRules"> }) {
  const { t } = useTranslation();
  const setMode = useMutation(api.apps.setAppMode).withOptimisticUpdate((store, { ruleId, mode }) => {
    const rows = store.getQuery(api.apps.listApps, { adventurerId: rule.adventurerId });
    if (rows) store.setQuery(api.apps.listApps, { adventurerId: rule.adventurerId }, rows.map((r) => (r._id === ruleId ? { ...r, mode } : r)));
  });
  const remove = useMutation(api.apps.removeApp);
  const [confirming, setConfirming] = useState(false);
  const { busy, error, run } = useBusy();

  if (confirming) {
    return (
      <Card highlight={T.badLine} style={{ gap: 10 }}>
        <Body weight="bold">{t("guardian.apps.removeConfirm", { name: rule.name })}</Body>
        <ErrorText>{error}</ErrorText>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button label={t("actions.cancel")} variant="ghost" onPress={() => setConfirming(false)} style={{ flex: 1 }} />
          <Button
            label={t("actions.remove")}
            variant="danger"
            icon="trash"
            busy={busy}
            onPress={() => void run(() => remove({ ruleId: rule._id }))}
            style={{ flex: 1 }}
          />
        </View>
      </Card>
    );
  }

  return (
    <Pressable
      onLongPress={rule.essential ? undefined : () => setConfirming(true)}
      delayLongPress={450}
      accessibilityHint={rule.essential ? undefined : t("guardian.apps.removeHint")}
    >
      <Card style={styles.row}>
        <View style={[styles.tile, { backgroundColor: tileColor(rule.name) }]}>
          <Text style={styles.initial}>{rule.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Body size={16} weight="bold" numberOfLines={1}>
            {rule.name}
          </Body>
          <Body size={12} color={T.muted} numberOfLines={1}>
            {rule.essential ? t("guardian.apps.essential") : t(`guardian.apps.${MODE_NOTE[rule.mode]}`)}
          </Body>
        </View>
        <View accessibilityRole="radiogroup" accessibilityLabel={rule.name} style={styles.seg}>
          {MODES.map((m, i) => {
            const on = rule.mode === m;
            const locked = rule.essential && m !== "free";
            const c = MODE_COLOR[m];
            return (
              <Pressable
                key={m}
                accessibilityRole="radio"
                accessibilityState={{ checked: on, disabled: locked }}
                disabled={locked}
                onPress={() => {
                  if (!on) void setMode({ ruleId: rule._id, mode: m });
                }}
                style={[
                  styles.segItem,
                  i > 0 && { borderLeftWidth: 1, borderLeftColor: T.lineSoft },
                  on && { backgroundColor: `${c}26`, borderBottomWidth: 2, borderBottomColor: c },
                  locked && { opacity: 0.35 },
                ]}
              >
                <Text style={[styles.segText, { color: on ? c : T.faint }]}>{t(`guardian.apps.${MODE_KEY[m]}`)}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingLeft: 10, paddingRight: 8 },
  tile: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.line,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontFamily: F.display, fontSize: 18, color: T.text },
  seg: { flexDirection: "row", borderWidth: 1, borderColor: T.lineSoft, borderRadius: 4, overflow: "hidden" },
  segItem: { minWidth: 50, minHeight: 44, paddingHorizontal: 6, alignItems: "center", justifyContent: "center" },
  segText: { fontFamily: F.bold, fontSize: 13 },
});
