import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { MoneyText, PixelText, SegBar, BodyText } from "@/components/pixel";
import { FEATURES } from "@/lib/features";
import { C } from "@/lib/palette";
import { useUser } from "@/lib/user-context";
import { brl } from "@/lib/palette";
import { xpToNext } from "../../convex/game";

export function Hud() {
  const user = useUser();
  if (!user) return <View style={styles.hud} />;
  const level = user.level ?? 1;
  const need = xpToNext(level);
  return (
    <View style={styles.hud}>
      <Image
        source={require("@/assets/sprites/hero.png")}
        style={{ width: 36, height: 36 }}
        contentFit="contain"
      />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <PixelText size={9}>{user.name ?? "HERO"}</PixelText>
          <BodyText size={18} color={C.sky}>{`LV ${level}`}</BodyText>
        </View>
        <SegBar ratio={(user.xp ?? 0) / need} color={C.sky} cells={14} />
      </View>
      {FEATURES.vault && (
        <View style={styles.pouch}>
          <Image
            source={require("@/assets/sprites/coin.png")}
            style={{ width: 16, height: 16 }}
            contentFit="contain"
          />
          <MoneyText size={12} color={C.gold}>
            {brl(user.spendableGold ?? 0)}
          </MoneyText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    backgroundColor: C.navy,
    borderWidth: 3,
    borderColor: C.ink,
    minHeight: 60,
  },
  pouch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: C.ink,
    borderWidth: 2,
    borderColor: "#000000",
  },
});
