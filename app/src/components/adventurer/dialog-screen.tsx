import { Image } from "expo-image";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Frame } from "@/components/ui";
import { SCENES, type SceneName } from "@/lib/art";
import { T } from "@/lib/theme";

const MAX_W = 520;

/** A full-screen dialog: a dimmed scene behind a leather frame that scrolls with the keyboard. */
export function DialogScreen({ scene, children }: { scene: SceneName; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const w = Math.min(width, MAX_W);
  const s = SCENES[scene];

  return (
    <View style={styles.root}>
      <View style={styles.backdrop} pointerEvents="none">
        <Image source={s.src} style={{ width: w, height: Math.round((w * s.h) / s.w) }} contentFit="cover" accessible={false} />
      </View>
      <View style={styles.dim} pointerEvents="none" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ alignItems: "center", paddingTop: insets.top + 24, paddingBottom: 24, paddingHorizontal: 10 }}
        >
          <Frame style={[styles.dialog, { width: Math.min(w - 20, MAX_W - 20) }]}>
            <View accessibilityViewIsModal style={{ gap: 18 }}>
              {children}
            </View>
          </Frame>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center" },
  dim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(8,6,4,0.78)" },
  dialog: { paddingTop: 20, paddingHorizontal: 18, paddingBottom: 18 },
});
