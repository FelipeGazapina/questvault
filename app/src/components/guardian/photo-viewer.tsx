import { Image } from "expo-image";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/icons";
import { Body } from "@/components/ui";
import { hhmm, T } from "@/lib/theme";

/** Large proof photo with thumbnails; tapping opens it full screen. */
export function ProofPhotos({ urls, name, at }: { urls: string[]; name: string; at: number | null }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const current = urls[Math.min(index, urls.length - 1)];

  return (
    <View style={{ gap: 8 }}>
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel={t("guardian.approvals.openPhoto", { n: index + 1, name })}
        onPress={() => setZoom(true)}
        style={styles.main}
      >
        <Image source={{ uri: current }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      </Pressable>
      {urls.length > 1 ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          {urls.map((u, i) => (
            <Pressable
              key={u}
              accessibilityRole="imagebutton"
              accessibilityState={{ selected: i === index }}
              accessibilityLabel={t("guardian.approvals.photo", { n: i + 1 })}
              onPress={() => setIndex(i)}
              style={[styles.thumb, i === index && { borderColor: T.brass, borderWidth: 2 }]}
            >
              <Image source={{ uri: u }} style={StyleSheet.absoluteFill} contentFit="cover" />
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Body size={13} color={T.muted}>
          {t("guardian.review.photoOf", { n: index + 1, total: urls.length })}
        </Body>
        {at ? (
          <Body size={13} color={T.muted}>
            {hhmm(at)}
          </Body>
        ) : null}
      </View>

      <Modal visible={zoom} transparent animationType="fade" onRequestClose={() => setZoom(false)}>
        <View style={styles.zoomBg}>
          <Image source={{ uri: current }} style={StyleSheet.absoluteFill} contentFit="contain" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("guardian.review.closePhoto")}
            onPress={() => setZoom(false)}
            style={[styles.zoomClose, { top: insets.top + 12 }]}
          >
            <Icon name="close" size={24} color={T.text} />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  main: { height: 250, overflow: "hidden", borderRadius: 4, borderWidth: 1, borderColor: T.line, backgroundColor: T.well },
  thumb: { width: 64, height: 64, overflow: "hidden", borderRadius: 4, borderWidth: 1, borderColor: T.lineSoft, backgroundColor: T.well },
  zoomBg: { flex: 1, backgroundColor: "#000" },
  zoomClose: {
    position: "absolute",
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(19,16,13,0.8)",
    borderWidth: 1,
    borderColor: T.line,
  },
});
