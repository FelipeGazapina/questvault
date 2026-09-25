import type { BottomTabBarProps } from "expo-router/tabs";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, type IconName } from "@/components/icons";
import { F, T } from "@/lib/theme";

export type TabSpec = { name: string; labelKey: string; icon: IconName; badge?: number };

/** Leather tab bar with a brass diamond over the active tab (design: "Componente: navegação"). */
export function RpgTabBar({
  state,
  navigation,
  tabs,
  hideOn = [],
}: BottomTabBarProps & { tabs: TabSpec[]; hideOn?: string[] }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;
  // Focused flows (e.g. delivering a mission) take the whole screen.
  if (activeName && hideOn.some((prefix) => activeName.startsWith(prefix))) return null;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {tabs.map((tab) => {
        const route = state.routes.find((r) => r.name === tab.name);
        if (!route) return null;
        const on = activeName === tab.name;
        const color = on ? T.brassHi : "#9a8b72";
        return (
          <Pressable
            key={tab.name}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={t(tab.labelKey)}
            onPress={() => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!on && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={styles.item}
          >
            <View style={[styles.mark, { opacity: on ? 1 : 0 }]} />
            <View>
              <Icon name={tab.icon} size={24} color={color} />
              {tab.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {t(tab.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: "#17120e",
    borderTopWidth: 1,
    borderTopColor: T.line,
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  item: { flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", gap: 4 },
  mark: { position: "absolute", top: -12, width: 7, height: 7, backgroundColor: T.brass, transform: [{ rotate: "45deg" }] },
  label: { fontFamily: F.bold, fontSize: 12, letterSpacing: 0.5 },
  badge: {
    position: "absolute",
    top: -6,
    right: -12,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: T.badge,
    borderWidth: 1,
    borderColor: "#17120e",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontFamily: F.heavy, fontSize: 11, color: "#fff4e8" },
});
