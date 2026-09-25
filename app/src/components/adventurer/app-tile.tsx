import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { Body, Sprite } from "@/components/ui";
import { F, T } from "@/lib/theme";

const TILE_COLORS = ["#3f6b4a", "#3f5a7a", "#2f5f59", "#4d6b2f", "#7d362e", "#4a4f5c", "#5a4b85", "#6b5420"];

function colorFor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TILE_COLORS[h % TILE_COLORS.length];
}

/** App icon stand-in: the initial on a coloured tile, with an hourglass badge when it opens with time. */
export function AppTile({ name, timed }: { name: string; timed?: boolean }) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap} accessible accessibilityLabel={timed ? t("adventurer.lock.timedA11y", { name }) : name}>
      <View style={[styles.icon, { backgroundColor: colorFor(name) }]}>
        <Text style={styles.initial}>{name.trim().charAt(0).toUpperCase()}</Text>
        {timed ? (
          <View style={styles.badge}>
            <Sprite name="hourglass" width={20} />
          </View>
        ) : null}
      </View>
      <Body size={12} weight="bold" center numberOfLines={2}>
        {name}
      </Body>
    </View>
  );
}

/** Four-per-row grid of app tiles. */
export function AppGrid({ apps, timed }: { apps: { _id: string; name: string }[]; timed?: boolean }) {
  return (
    <View style={styles.grid}>
      {apps.map((a) => (
        <View key={a._id} style={styles.cell}>
          <AppTile name={a.name} timed={timed} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 12 },
  cell: { width: "25%", paddingHorizontal: 4 },
  wrap: { alignItems: "center", gap: 6, minHeight: 44 },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.line,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontFamily: F.display, fontSize: 21, color: T.text },
  badge: { position: "absolute", right: -6, bottom: -6 },
});
