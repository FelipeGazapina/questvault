import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatDue, PageHeader, useBusy, useGoBack } from "@/components/guardian/kit";
import { dayBucket, noticeSprite, useNoticeCopy, type DayBucket } from "@/components/guardian/notice";
import { NoticePrefs } from "@/components/guardian/notice-prefs";
import { reviewHref } from "@/components/guardian/run-card";
import { PushNotificationsToggle } from "@/components/push-notifications-toggle";
import { Body, Button, Card, Empty, Loading, Ornament, Screen, Seal, Sprite } from "@/components/ui";
import { useProfile } from "@/lib/family";
import { F, T } from "@/lib/theme";
import { timeAgo } from "@/lib/time";
import { api } from "../../../convex/_generated/api";

type Notice = FunctionReturnType<typeof api.notify.guardianInbox>["items"][number];

const BUCKETS: DayBucket[] = ["today", "yesterday", "earlier"];
const BUCKET_KEY: Record<DayBucket, string> = { today: "today", yesterday: "yesterday", earlier: "earlier" };

/** Avisos: the guardian's inbox (grouped by day) and "Quando me avisar" preferences. */
export default function Notices() {
  const { t } = useTranslation();
  const goBack = useGoBack("/guardiao");
  const { me } = useProfile();
  const inbox = useQuery(api.notify.guardianInbox, { limit: 60 });
  const pendingRuns = useQuery(api.missions.approvals, { status: "submitted" });
  const purchases = useQuery(api.rewards.pendingPurchases, {});
  const markRead = useMutation(api.notify.markGuardianInboxRead);

  // Unread rows stay highlighted while the screen is open; they are marked read on leaving.
  const unread = useRef(0);
  useEffect(() => {
    unread.current = inbox?.unread ?? 0;
  }, [inbox?.unread]);
  useFocusEffect(
    useCallback(
      () => () => {
        if (unread.current > 0) void markRead({}).catch(() => {});
      },
      [markRead],
    ),
  );

  if (inbox === undefined || !me) return <Loading />;
  const pendingRunIds = new Set(pendingRuns?.map((r) => r._id) ?? []);
  const pendingPurchaseIds = new Set(purchases?.map((p) => p._id) ?? []);
  const groups = BUCKETS.map((b) => ({ b, items: inbox.items.filter((n) => dayBucket(n.createdAt) === b) })).filter(
    (g) => g.items.length > 0,
  );

  return (
    <Screen scene="biblioteca">
      <PageHeader
        onBack={goBack}
        sprite="bell"
        spriteWidth={36}
        title={t("guardian.notices.title")}
        right={
          inbox.unread > 0 ? (
            <Pressable accessibilityRole="button" onPress={() => void markRead({})} hitSlop={6} style={styles.markRead}>
              <Text style={styles.markReadText}>{t("guardian.notices.markRead")}</Text>
            </Pressable>
          ) : null
        }
      />

      {groups.length === 0 ? <Empty sprite="bell" text={t("guardian.notices.empty")} /> : null}
      {groups.map((g) => (
        <View key={g.b} style={{ gap: 8 }}>
          <Ornament title={t(`guardian.notices.${BUCKET_KEY[g.b]}`).toUpperCase()} />
          {g.items.map((n) => (
            <NoticeCard
              key={n._id}
              n={n}
              runPending={!!n.runId && pendingRunIds.has(n.runId)}
              purchasePending={!!n.purchaseId && pendingPurchaseIds.has(n.purchaseId)}
            />
          ))}
        </View>
      ))}

      {me.family?.guardianPrefs ? (
        <>
          <Ornament title={t("guardian.notices.prefs").toUpperCase()} />
          <NoticePrefs prefs={me.family.guardianPrefs} />
        </>
      ) : null}

      <Ornament title={t("guardian.notices.device").toUpperCase()} />
      <Card style={{ paddingVertical: 4, paddingHorizontal: 14 }}>
        <PushNotificationsToggle />
      </Card>
    </Screen>
  );
}

function NoticeCard({ n, runPending, purchasePending }: { n: Notice; runPending: boolean; purchasePending: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();
  const copy = useNoticeCopy()(n.kind, n.params);
  const markDelivered = useMutation(api.rewards.markDelivered);
  const { busy, error, run } = useBusy();
  const when = dayBucket(n.createdAt) === "today" ? timeAgo(t, n.createdAt) : formatDue(n.createdAt);
  const isRun = (n.kind === "submission" || n.kind === "pending_reminder") && !!n.runId;
  const isPurchase = n.kind === "purchase" && !!n.purchaseId;

  return (
    <Card style={[styles.note, !n.read && styles.noteNew]}>
      {!n.read ? <View style={styles.newMark} /> : null}
      <View style={styles.icon}>
        <Sprite name={noticeSprite(n.kind)} width={n.kind === "deadline_guardian" ? 12 : 28} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Body size={15} weight={n.read ? "regular" : "bold"}>
          {copy.title}
        </Body>
        {copy.body ? (
          <Body size={14} color={T.soft}>
            {copy.body}
          </Body>
        ) : null}
        <Body size={13} color={T.muted}>
          {when}
        </Body>
        {error ? (
          <Body size={13} color={T.bad}>
            {error}
          </Body>
        ) : null}
        {isRun ? (
          <View style={styles.actions}>
            <Button
              label={runPending ? t("guardian.notices.review") : t("guardian.notices.viewDelivery")}
              variant={runPending ? "primary" : "ghost"}
              onPress={() => router.push(reviewHref(n.runId!))}
            />
          </View>
        ) : null}
        {isPurchase ? (
          <View style={styles.actions}>
            {purchasePending ? (
              <Button
                label={t("guardian.notices.markDelivered")}
                variant="ghost"
                busy={busy}
                onPress={() => void run(() => markDelivered({ purchaseId: n.purchaseId! }))}
              />
            ) : (
              <Seal kind="ok" icon="check" label={t("guardian.notices.delivered")} />
            )}
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  markRead: { minHeight: 44, justifyContent: "center" },
  markReadText: { fontFamily: F.bold, fontSize: 14, color: T.brassHi },
  note: { flexDirection: "row", gap: 12, paddingVertical: 12, paddingRight: 12, paddingLeft: 14 },
  noteNew: { backgroundColor: T.cardHi, borderColor: T.line },
  newMark: { position: "absolute", left: -1, top: 14, width: 3, height: 22, backgroundColor: T.brass, borderRadius: 2 },
  icon: { width: 30, alignItems: "center", paddingTop: 2 },
  actions: { flexDirection: "row", gap: 8, marginTop: 2 },
});
