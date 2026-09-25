import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/components/icons";
import { Frame, Sprite, Title } from "@/components/ui";
import type { SpriteName } from "@/lib/art";
import { T } from "@/lib/theme";

/** One "who's playing" entry: banner slot, name, details, and a trailing hint. */
export function ProfileRow({
  banner,
  name,
  details,
  trailing,
  onPress,
  accessibilityLabel,
}: {
  banner: SpriteName;
  name: string;
  details: ReactNode;
  trailing?: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => pressed && { opacity: 0.85, transform: [{ translateY: 1 }] }}
    >
      <Frame style={styles.row}>
        <View style={styles.slot}>
          <Sprite name={banner} width={32} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Title size={18} numberOfLines={1}>
            {name}
          </Title>
          {details}
        </View>
        {trailing ?? <Icon name="chevron" color={T.brassDk} />}
      </Frame>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
  slot: {
    width: 52,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.well,
    borderWidth: 1,
    borderColor: T.line,
    borderRadius: 4,
  },
});
