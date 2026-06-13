import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Hud } from "@/components/hud";
import { BodyText, PixelButton, PixelPanel, PixelText } from "@/components/pixel";
import { BOARD_SECTIONS, QUEST_TYPES, sectionColor, typeLabelKey } from "@/lib/quest-types";
import { C, FONT } from "@/lib/palette";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { QuestType } from "../../convex/game";
import { SPAWN_SLOTS } from "../../convex/game";

type PoolFilter = "all" | QuestType;

const FILTER_OPTIONS: PoolFilter[] = ["all", ...QUEST_TYPES];

export default function QuestPoolScreen() {
  const { t } = useTranslation();
  const pool = useQuery(api.quests.poolList, {});
  const addToPool = useMutation(api.quests.addToPool);
  const removeFromPool = useMutation(api.quests.removeFromPool);

  const [filter, setFilter] = useState<PoolFilter>("all");
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<QuestType>("daily");
  const [removingId, setRemovingId] = useState<Id<"questPool"> | null>(null);

  const byType = useMemo(() => {
    const grouped: Record<QuestType, NonNullable<typeof pool>> = { daily: [], side: [], boss: [] };
    for (const entry of pool ?? []) {
      grouped[entry.questType].push(entry);
    }
    return grouped;
  }, [pool]);

  const totalEntries = (pool ?? []).length;

  const visibleSections = useMemo(() => {
    if (filter === "all") return BOARD_SECTIONS;
    return BOARD_SECTIONS.filter(({ type }) => type === filter);
  }, [filter]);

  const filteredCount = useMemo(() => {
    if (filter === "all") return totalEntries;
    return byType[filter].length;
  }, [filter, totalEntries, byType]);

  function onFilterChange(next: PoolFilter) {
    setFilter(next);
    if (next !== "all") setNewType(next);
  }

  function filterLabel(f: PoolFilter) {
    if (f === "all") return t("pool.filterAll");
    return t(typeLabelKey(f));
  }

  function filterActiveColor(f: PoolFilter) {
    if (f === "all") return C.gold;
    return sectionColor(f, C);
  }

  async function onAdd() {
    if (!newTitle.trim()) return;
    try {
      await addToPool({ title: newTitle, questType: newType });
      setNewTitle("");
    } catch (e) {
      Alert.alert(t("pool.alertTitle"), e instanceof Error ? e.message : t("board.alertFailed"));
    }
  }

  async function onRemove(poolId: Id<"questPool">) {
    if (removingId) return;
    setRemovingId(poolId);
    try {
      await removeFromPool({ poolId });
    } catch (e) {
      Alert.alert(t("pool.alertTitle"), e instanceof Error ? e.message : t("board.alertFailed"));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Hud />
        <View style={styles.titleBlock}>
          <PixelText size={13} style={{ textAlign: "center" }}>
            {t("pool.title")}
          </PixelText>
          <BodyText size={17} color={C.fog} style={{ textAlign: "center" }}>
            {t("pool.subtitle")}
          </BodyText>
        </View>

        <View style={styles.filters}>
          {FILTER_OPTIONS.map((f) => {
            const active = filter === f;
            const accent = filterActiveColor(f);
            return (
              <Pressable
                key={f}
                onPress={() => onFilterChange(f)}
                style={[styles.filterChip, active && { backgroundColor: C.ink, borderColor: accent }]}
              >
                <PixelText size={7} color={active ? accent : C.slate}>
                  {filterLabel(f)}
                </PixelText>
              </Pressable>
            );
          })}
        </View>

        {pool !== undefined && totalEntries === 0 && (
          <BodyText size={18} color={C.slate} style={{ textAlign: "center" }}>
            {t("pool.empty")}
          </BodyText>
        )}

        {pool !== undefined && totalEntries > 0 && filteredCount === 0 && (
          <BodyText size={18} color={C.slate} style={{ textAlign: "center" }}>
            {t("pool.emptyFilter", { type: filterLabel(filter) })}
          </BodyText>
        )}

        {pool !== undefined &&
          visibleSections.map(({ type }) => {
            const entries = byType[type];
            if (entries.length === 0) return null;
            const color = sectionColor(type, C);
            return (
              <View key={type} style={styles.section}>
                {filter === "all" && (
                  <View style={styles.sectionHeader}>
                    <PixelText size={9} color={color}>
                      {t(typeLabelKey(type))}
                    </PixelText>
                    <BodyText size={15} color={C.slate}>
                      {t("pool.summonMeta", { max: SPAWN_SLOTS[type] })}
                    </BodyText>
                  </View>
                )}
                {entries.map((entry) => (
                  <PixelPanel key={entry._id} borderColor={color} background={C.navy} style={styles.poolRow}>
                    <View style={[styles.typeTag, { borderColor: color }]}>
                      <PixelText size={6} color={color}>
                        {t(typeLabelKey(type))}
                      </PixelText>
                    </View>
                    <BodyText size={21} color={C.white} style={{ flex: 1 }}>
                      {entry.title}
                    </BodyText>
                    <Pressable onPress={() => void onRemove(entry._id)} disabled={removingId === entry._id}>
                      <BodyText size={14} color={C.slate}>
                        {t("pool.remove")}
                      </BodyText>
                    </Pressable>
                  </PixelPanel>
                ))}
              </View>
            );
          })}

        <PixelPanel background={C.panelDark}>
          <PixelText size={8} color={C.slate}>
            {t("pool.addHeader")}
          </PixelText>
          <TextInput
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder={t("board.questPlaceholder")}
            placeholderTextColor={C.slate}
            style={styles.input}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            {QUEST_TYPES.map((tp) => (
              <Pressable
                key={tp}
                onPress={() => setNewType(tp)}
                style={[styles.chip, newType === tp && { backgroundColor: C.ink, borderColor: C.gold }]}
              >
                <PixelText size={7} color={newType === tp ? C.gold : C.slate}>
                  {t(typeLabelKey(tp))}
                </PixelText>
              </Pressable>
            ))}
          </View>
          <BodyText size={16} color={C.fog}>
            {t("pool.addHint", { max: SPAWN_SLOTS[newType] })}
          </BodyText>
          <PixelButton label={t("pool.addButton")} onPress={onAdd} disabled={!newTitle.trim()} />
        </PixelPanel>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.night },
  content: { padding: 16, gap: 12, paddingBottom: 24 },
  titleBlock: { gap: 4, marginTop: 8 },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  filterChip: {
    borderWidth: 2,
    borderColor: C.ink,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: C.navy,
  },
  section: { gap: 8 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  poolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  typeTag: {
    borderWidth: 2,
    borderColor: C.ink,
    backgroundColor: C.ink,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  input: {
    fontFamily: FONT.body,
    fontSize: 20,
    color: C.white,
    borderWidth: 2,
    borderColor: C.ink,
    backgroundColor: C.night,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chip: {
    borderWidth: 2,
    borderColor: C.ink,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
});
