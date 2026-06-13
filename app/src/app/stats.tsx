import { useQuery } from "convex/react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Hud } from "@/components/hud";
import { BodyText, PixelPanel, PixelText } from "@/components/pixel";
import { C } from "@/lib/palette";
import { api } from "../../convex/_generated/api";

const MAX_BAR_CELLS = 8;

function StatCard({ label, value, valueColor, sub }: { label: string; value: string; valueColor: string; sub: string }) {
  return (
    <PixelPanel background={C.panelDark} style={{ flex: 1, gap: 4 }}>
      <PixelText size={7} color={C.slate}>
        {label}
      </PixelText>
      <PixelText size={16} color={valueColor}>
        {value}
      </PixelText>
      <BodyText size={15} color={C.fog}>
        {sub}
      </BodyText>
    </PixelPanel>
  );
}

export default function QuestLog() {
  const { t, i18n } = useTranslation();
  const data = useQuery(api.quests.dashboard, {});

  const weekdayLetter = (day: string) =>
    new Date(day + "T12:00:00Z")
      .toLocaleDateString(i18n.language === "pt" ? "pt-BR" : "en-US", { weekday: "narrow", timeZone: "UTC" })
      .toUpperCase();

  const whenLabel = (day: string, last7: { day: string }[]) => {
    const today = last7[last7.length - 1]?.day;
    const yesterday = last7[last7.length - 2]?.day;
    if (day === today) return t("log.today");
    if (day === yesterday) return t("log.yesterday");
    return day;
  };

  const diff = data ? data.thisWeek - data.lastWeek : 0;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Hud />
        <PixelText size={13} style={{ textAlign: "center", marginTop: 8 }}>
          {t("log.title")}
        </PixelText>

        {data && (
          <>
            <View style={styles.statRow}>
              <StatCard
                label={t("log.total")}
                value={`${data.total}`}
                valueColor={C.mint}
                sub={t("log.sinceStart")}
              />
              <StatCard
                label={t("log.week")}
                value={`${data.thisWeek}`}
                valueColor={C.sky}
                sub={t("log.vsLastWeek", { diff: `${diff >= 0 ? "+" : ""}${diff}` })}
              />
            </View>
            <View style={styles.statRow}>
              <StatCard
                label={t("log.streak")}
                value={t("log.streakValue", { count: data.streak })}
                valueColor={C.ember}
                sub={data.questedToday ? t("log.todaySecured") : t("log.questToday")}
              />
              <StatCard
                label={t("log.bosses")}
                value={`${data.bossesTotal}`}
                valueColor={C.gold}
                sub={t("log.bossesMonth", { n: data.bossesThisMonth })}
              />
            </View>

            <PixelPanel background={C.panelDark}>
              <PixelText size={8} color={C.slate}>
                {t("log.last7")}
              </PixelText>
              <View style={styles.chart}>
                {data.last7.map((d, i) => {
                  const isToday = i === data.last7.length - 1;
                  const cells = Math.min(d.count, MAX_BAR_CELLS);
                  return (
                    <View key={d.day} style={styles.barCol}>
                      <View style={styles.bar}>
                        {Array.from({ length: cells }, (_, c) => (
                          <View
                            key={c}
                            style={[styles.barCell, { backgroundColor: isToday ? C.gold : C.sky }]}
                          />
                        ))}
                        {cells === 0 && <View style={[styles.barCell, { backgroundColor: C.ink }]} />}
                      </View>
                      <BodyText size={14} color={isToday ? C.gold : C.fog}>
                        {weekdayLetter(d.day)}
                      </BodyText>
                    </View>
                  );
                })}
              </View>
            </PixelPanel>

            <PixelPanel background={C.panelDark}>
              <PixelText size={8} color={C.slate}>
                {t("log.recent")}
              </PixelText>
              {data.recent.length === 0 && (
                <BodyText size={17} color={C.slate}>
                  {t("log.empty")}
                </BodyText>
              )}
              {data.recent.map((r) => (
                <View key={r.id} style={styles.victoryRow}>
                  <View style={{ flex: 1, gap: 1 }}>
                    <BodyText size={18} color={r.questType === "boss" ? C.gold : C.white}>
                      {(r.questType === "boss" ? t("board.bossPrefix") : "") + r.title}
                    </BodyText>
                    <BodyText size={14} color={C.slate}>
                      {whenLabel(r.day, data.last7)}
                    </BodyText>
                  </View>
                  <BodyText size={17} color={r.questType === "boss" ? C.gold : C.sky}>
                    {`+${r.xp} XP`}
                  </BodyText>
                </View>
              ))}
            </PixelPanel>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.night },
  content: { padding: 16, gap: 12 },
  statRow: { flexDirection: "row", gap: 10 },
  chart: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 10,
    paddingTop: 6,
  },
  barCol: { alignItems: "center", gap: 5 },
  bar: { flexDirection: "column-reverse", gap: 2 },
  barCell: { width: 26, height: 8 },
  victoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 2,
  },
});
