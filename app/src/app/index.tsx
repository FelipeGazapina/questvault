import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Hud } from "@/components/hud";
import { QuestRow } from "@/components/quest-row";
import { BodyText, PixelPanel, PixelText } from "@/components/pixel";
import { FEATURES } from "@/lib/features";
import { BOARD_SECTIONS, sectionColor, typeLabelKey } from "@/lib/quest-types";
import { brl, C } from "@/lib/palette";
import { useUser } from "@/lib/user-context";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { SPAWN_SLOTS } from "../../convex/game";

export default function QuestBoard() {
  const { t } = useTranslation();
  const user = useUser();
  const board = useQuery(api.quests.board, {});
  const syncBoard = useMutation(api.quests.syncBoard);
  const debugResummon = useMutation(api.quests.debugResummon);
  const complete = useMutation(api.quests.complete);

  const [toast, setToast] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<Id<"questInstances"> | null>(null);
  const [exitingIds, setExitingIds] = useState<Set<Id<"questInstances">>>(() => new Set());
  const [resummoning, setResummoning] = useState(false);

  useEffect(() => {
    void syncBoard({});
  }, [syncBoard]);

  const visibleByType = useMemo(() => {
    if (!board) return null;
    return {
      daily: board.daily.filter((q) => !exitingIds.has(q._id)),
      side: board.side.filter((q) => !exitingIds.has(q._id)),
      boss: board.boss.filter((q) => !exitingIds.has(q._id)),
    };
  }, [board, exitingIds]);

  const totalVisible =
    visibleByType === null
      ? 0
      : visibleByType.daily.length + visibleByType.side.length + visibleByType.boss.length;

  const clearExiting = useCallback((instanceId: Id<"questInstances">) => {
    setExitingIds((prev) => {
      if (!prev.has(instanceId)) return prev;
      const next = new Set(prev);
      next.delete(instanceId);
      return next;
    });
  }, []);

  async function onComplete(instanceId: Id<"questInstances">) {
    if (completingId) return;
    setCompletingId(instanceId);
    try {
      const r = await complete({ instanceId });
      const parts = [`+${r.xpGained} XP`];
      if (FEATURES.vault && r.convertedCents > 0) {
        parts.push(t("board.unlocked", { amount: brl(r.convertedCents) }));
      }
      if (r.leveledUpTo) parts.push(t("board.levelUp", { level: r.leveledUpTo }));
      setToast(parts.join(" · "));
      setTimeout(() => setToast(null), 3500);
      setExitingIds((prev) => new Set(prev).add(instanceId));
    } catch (e) {
      Alert.alert(t("board.alertTitle"), e instanceof Error ? e.message : t("board.alertFailed"));
    } finally {
      setCompletingId(null);
    }
  }

  async function onResummon() {
    if (resummoning) return;
    setResummoning(true);
    setExitingIds(new Set());
    try {
      await debugResummon({});
      setToast(t("board.resummonDone"));
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      Alert.alert(t("board.alertTitle"), e instanceof Error ? e.message : t("board.alertFailed"));
    } finally {
      setResummoning(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={[styles.content, FEATURES.debugResummon && styles.contentWithFab]}>
        <Hud />
        <PixelText size={13} style={{ textAlign: "center", marginTop: 8 }}>
          {t("board.title")}
        </PixelText>
        <View style={styles.streak}>
          <Image
            source={require("@/assets/sprites/flame.png")}
            style={{ width: 14, height: 18 }}
            contentFit="contain"
          />
          <BodyText size={20} color={C.ember}>
            {user?.streak ? t("board.streak", { count: user.streak }) : t("board.startStreak")}
          </BodyText>
        </View>

        {toast && (
          <PixelPanel borderColor={C.gold} background="#3a2f4a">
            <PixelText size={9} color={C.gold} style={{ textAlign: "center" }}>
              {toast}
            </PixelText>
          </PixelPanel>
        )}

        {board !== undefined && totalVisible === 0 && (
          <BodyText size={18} color={C.slate} style={{ textAlign: "center" }}>
            {board.poolCounts.daily + board.poolCounts.side + board.poolCounts.boss === 0
              ? t("board.emptyPoolGoTab")
              : t("board.emptyBoard")}
          </BodyText>
        )}

        {visibleByType &&
          BOARD_SECTIONS.map(({ type }) => {
            const quests = visibleByType[type];
            if (quests.length === 0) return null;
            const color = sectionColor(type, C);
            return (
              <View key={type} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <PixelText size={9} color={color}>
                    {t(typeLabelKey(type))}
                  </PixelText>
                  <BodyText size={15} color={C.slate}>
                    {t("board.sectionCount", { count: quests.length, max: SPAWN_SLOTS[type] })}
                  </BodyText>
                </View>
                {quests.map((q) => (
                  <QuestRow
                    key={q._id}
                    quest={q}
                    exiting={exitingIds.has(q._id)}
                    busy={completingId === q._id}
                    onComplete={() => onComplete(q._id)}
                    onExitComplete={() => clearExiting(q._id)}
                  />
                ))}
              </View>
            );
          })}

      </ScrollView>

      {FEATURES.debugResummon && (
        <Pressable
          style={[styles.fab, resummoning && styles.fabBusy]}
          onPress={() => void onResummon()}
          disabled={resummoning}
          accessibilityLabel={t("board.debugResummon")}
        >
          <PixelText size={7} color={C.night} style={{ textAlign: "center" }}>
            {resummoning ? "..." : t("board.debugResummon")}
          </PixelText>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.night },
  content: { padding: 16, gap: 12 },
  contentWithFab: { paddingBottom: 88 },
  streak: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  section: { gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 80,
    backgroundColor: C.gold,
    borderWidth: 3,
    borderColor: C.ink,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 72,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  fabBusy: { opacity: 0.6 },
});
