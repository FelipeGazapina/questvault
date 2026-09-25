import { Image } from "expo-image";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";

import { Body, Title } from "@/components/ui";
import { SCENES } from "@/lib/art";
import { T } from "@/lib/theme";

const MAX_W = 520;

/**
 * The tall castle-gate scene with a title over the night sky; content overlaps the ground.
 * Proportions follow the design: text at ~18% of the scene height, content rising ~21% into it.
 */
export function GateScreen({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  const { width } = useWindowDimensions();
  const w = Math.min(width, MAX_W);
  const s = SCENES.portao;
  const h = Math.round((w * s.h) / s.w);

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ alignItems: "center", paddingBottom: 28 }}>
      <View style={{ width: w }}>
        <View style={{ height: h }}>
          <Image source={s.src} style={{ width: w, height: h }} contentFit="cover" accessible={false} />
          <View style={[styles.sky, { top: Math.round(h * 0.18) }]}>
            <Title size={28} color={T.brassHi} center style={styles.shadow}>
              {title}
            </Title>
            <Body center color="#cfd6e8" style={[styles.shadow, { maxWidth: 260 }]}>
              {body}
            </Body>
          </View>
        </View>
        <View style={[styles.content, { marginTop: -Math.round(h * 0.21) }]}>{children}</View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  sky: { position: "absolute", left: 24, right: 24, alignItems: "center", gap: 8 },
  shadow: { textShadowColor: "#070a16", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 0 },
  content: { paddingHorizontal: 18, gap: 18 },
});
