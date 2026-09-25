import { Image } from "expo-image";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Body, Title } from "@/components/ui";
import { SCENES } from "@/lib/art";
import { T } from "@/lib/theme";

const MAX_W = 520;

/**
 * Castle scene with the QUESTVAULT title standing on its ground, used by every access screen
 * (sign-in, pairing, onboarding, profile chooser). Keyboard-aware so forms stay reachable.
 */
export function AccessLayout({ children, showTagline = true }: { children: ReactNode; showTagline?: boolean }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const w = Math.min(width, MAX_W);
  const scene = SCENES.castelo;
  const sceneH = Math.round((w * scene.h) / scene.w);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.root}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ alignItems: "center", paddingBottom: insets.bottom + 28 }}
      >
        <View style={{ width: w }}>
          <Image source={scene.src} style={{ width: w, height: sceneH }} contentFit="cover" accessible={false} />
          <View style={[styles.content, { marginTop: -Math.round(sceneH * 0.24) }]}>
            <View style={styles.brand}>
              <Title size={30} color={T.brassHi} center style={styles.brandTitle}>
                {t("access.brand")}
              </Title>
              {showTagline ? (
                <Body center color={T.muted}>
                  {t("access.tagline")}
                </Body>
              ) : null}
            </View>
            {children}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  content: { paddingHorizontal: 20, gap: 22 },
  brand: { alignItems: "center", gap: 6 },
  brandTitle: {
    letterSpacing: 3.6,
    textShadowColor: "#0b0806",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
});
