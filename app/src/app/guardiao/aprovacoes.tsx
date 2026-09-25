import { useQuery } from "convex/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PageHeader } from "@/components/guardian/kit";
import { dayBucket } from "@/components/guardian/notice";
import { DecidedRow, PendingRunCard, type ApprovalRun } from "@/components/guardian/run-card";
import { Empty, Loading, Ornament, Screen } from "@/components/ui";
import { useProfile } from "@/lib/family";
import { F, T } from "@/lib/theme";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type Tab = "submitted" | "approved" | "rejected";

const TABS: { value: Tab; key: string }[] = [
  { value: "submitted", key: "pending" },
  { value: "approved", key: "approved" },
  { value: "rejected", key: "rejected" },
];

/** Aprovações: judge deliveries, filter by adventurer, review what was decided. */
export default function Approvals() {
  const { t } = useTranslation();
  const { me } = useProfile();
  const [tab, setTab] = useState<Tab>("submitted");
  const [who, setWho] = useState<Id<"adventurers"> | undefined>(undefined);

  const pending = useQuery(api.missions.approvals, { status: "submitted", adventurerId: who });
  const approved = useQuery(api.missions.approvals, { status: "approved", adventurerId: who });
  const rejected = useQuery(api.missions.approvals, { status: "rejected", adventurerId: who });
  const count = useQuery(api.missions.pendingCount, {});

  const adventurers = me?.adventurers ?? [];
  const list = tab === "submitted" ? pending : tab === "approved" ? approved : rejected;
  const decidedToday: ApprovalRun[] =
    approved && rejected
      ? [...approved, ...rejected]
          .filter((r) => r.decidedAt && dayBucket(r.decidedAt) === "today")
          .sort((a, b) => (b.decidedAt ?? 0) - (a.decidedAt ?? 0))
      : [];

  return (
    <Screen scene="biblioteca">
      <PageHeader sprite="scroll" spriteWidth={44} title={t("guardian.approvals.title")} subtitle={t("guardian.approvals.subtitle")} />

      <View accessibilityRole="tablist" accessibilityLabel={t("guardian.approvals.tabs")} style={styles.tabs}>
        {TABS.map((o) => {
          const on = tab === o.value;
          const badge = o.value === "submitted" ? count?.count ?? 0 : 0;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setTab(o.value)}
              style={[styles.tab, on && styles.tabOn]}
            >
              <Text style={[styles.tabText, { color: on ? T.brassHi : T.muted }]}>{t(`guardian.approvals.${o.key}`)}</Text>
              {badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {adventurers.length > 1 ? (
        <View accessibilityRole="radiogroup" accessibilityLabel={t("guardian.approvals.filter")} style={styles.filters}>
          {[{ _id: undefined, name: t("guardian.approvals.all") }, ...adventurers].map((a) => {
            const on = who === a._id;
            return (
              <Pressable
                key={a._id ?? "all"}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setWho(a._id)}
                style={[styles.filter, on && styles.filterOn]}
              >
                <Text style={[styles.filterText, { color: on ? T.brassHi : T.muted }]}>{a.name}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {list === undefined ? (
        <View style={{ height: 120 }}>
          <Loading />
        </View>
      ) : tab === "submitted" ? (
        <>
          {list.length === 0 ? (
            <Empty sprite="scroll" text={t("guardian.approvals.emptyPending")} />
          ) : (
            list.map((run) => <PendingRunCard key={run._id} run={run} />)
          )}
          {decidedToday.length > 0 ? (
            <>
              <Ornament title={t("guardian.approvals.decidedToday").toUpperCase()} />
              <View style={{ gap: 8 }}>
                {decidedToday.map((run) => (
                  <DecidedRow key={run._id} run={run} />
                ))}
              </View>
            </>
          ) : null}
        </>
      ) : list.length === 0 ? (
        <Empty text={t(tab === "approved" ? "guardian.approvals.emptyApproved" : "guardian.approvals.emptyRejected")} />
      ) : (
        <View style={{ gap: 8 }}>
          {list.map((run) => (
            <DecidedRow key={run._id} run={run} />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: T.lineSoft },
  tab: { flex: 1, minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  tabOn: { borderBottomWidth: 2, borderBottomColor: T.brass, marginBottom: -1 },
  tabText: { fontFamily: F.bold, fontSize: 15 },
  badge: { paddingHorizontal: 7, borderRadius: 999, backgroundColor: T.badge },
  badgeText: { fontFamily: F.heavy, fontSize: 12, color: "#fff4e8", fontVariant: ["tabular-nums"] },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filter: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: T.lineSoft,
  },
  filterOn: { borderColor: T.brass, backgroundColor: "rgba(201,164,92,0.12)" },
  filterText: { fontFamily: F.bold, fontSize: 14 },
});
