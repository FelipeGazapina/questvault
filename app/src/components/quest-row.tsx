import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Easing, StyleSheet, View, type ViewStyle } from "react-native";

import { BodyText, MoneyText, PixelButton, PixelPanel } from "@/components/pixel";
import { FEATURES } from "@/lib/features";
import { brl, C } from "@/lib/palette";
import type { Id } from "../../convex/_generated/dataModel";

const SLIDE_MS = 420;

export type BoardQuest = {
  _id: Id<"questInstances">;
  title: string;
  questType: "daily" | "side" | "boss";
  xp: number;
  conversionCents: number;
};

export function QuestRow({
  quest,
  exiting,
  busy,
  onComplete,
  onExitComplete,
  style,
}: {
  quest: BoardQuest;
  exiting: boolean;
  busy: boolean;
  onComplete: () => void;
  onExitComplete: () => void;
  style?: ViewStyle;
}) {
  const { t } = useTranslation();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!exiting) {
      progress.setValue(0);
      return;
    }
    Animated.timing(progress, {
      toValue: 1,
      duration: SLIDE_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onExitComplete();
    });
  }, [exiting, onExitComplete, progress]);

  const animatedStyle = {
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 520],
        }),
      },
    ],
    opacity: progress.interpolate({
      inputRange: [0, 0.55, 1],
      outputRange: [1, 0.65, 0],
    }),
  };

  const borderColor = quest.questType === "boss" ? C.gold : quest.questType === "side" ? C.mint : C.sky;
  const background = quest.questType === "boss" ? "#3a2f4a" : C.navy;

  return (
    <Animated.View style={[animatedStyle, style]}>
      <PixelPanel borderColor={borderColor} background={background} style={styles.quest}>
        <View style={{ flex: 1, gap: 2 }}>
          <BodyText size={21} color={C.white}>
            {quest.title}
          </BodyText>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <BodyText size={16} color={C.sky}>{`+${quest.xp} XP`}</BodyText>
            {FEATURES.vault && (
              <MoneyText size={12} color={C.gold}>{`+${brl(quest.conversionCents)}`}</MoneyText>
            )}
          </View>
        </View>
        <PixelButton
          label={t("board.doIt")}
          color={C.leaf}
          onPress={onComplete}
          disabled={busy || exiting}
          style={styles.smallBtn}
        />
      </PixelPanel>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  quest: { flexDirection: "row", alignItems: "center", gap: 12 },
  smallBtn: { paddingVertical: 8, paddingHorizontal: 10 },
});
