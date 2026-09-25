import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/components/icons";
import { Body } from "@/components/ui";
import { T } from "@/lib/theme";

export type LocalPhoto = { uri: string; mimeType?: string };

const TILE = 96;
const PICK_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.6 };

function toPhotos(result: ImagePicker.ImagePickerResult): LocalPhoto[] {
  if (result.canceled) return [];
  return result.assets.map((a) => ({ uri: a.uri, mimeType: a.mimeType ?? undefined }));
}

/** Up to `max` delivery photos: take with the camera or pick from the gallery; tap × to remove. */
export function PhotoPicker({
  photos,
  onChange,
  max = 4,
}: {
  photos: LocalPhoto[];
  onChange: (next: LocalPhoto[]) => void;
  max?: number;
}) {
  const { t } = useTranslation();
  const [notice, setNotice] = useState<string | null>(null);
  const room = max - photos.length;

  const add = (picked: LocalPhoto[]) => {
    if (picked.length) onChange([...photos, ...picked].slice(0, max));
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      ...PICK_OPTIONS,
      allowsMultipleSelection: room > 1,
      selectionLimit: room,
    });
    add(toPhotos(result));
  };

  const takePhoto = async () => {
    setNotice(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync().catch(() => null);
    if (!perm?.granted) {
      setNotice(t("adventurer.finish.cameraDenied"));
      return pickFromGallery();
    }
    try {
      add(toPhotos(await ImagePicker.launchCameraAsync(PICK_OPTIONS)));
    } catch {
      // Some browsers/devices have no camera: fall back to the gallery.
      await pickFromGallery();
    }
  };

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.row}>
        {photos.map((p, i) => (
          <View key={p.uri} style={styles.thumb}>
            <Image
              source={{ uri: p.uri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              accessibilityLabel={t("adventurer.finish.photoA11y", { n: i + 1 })}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("adventurer.finish.removePhoto")}
              onPress={() => onChange(photos.filter((_, j) => j !== i))}
              hitSlop={8}
              style={styles.remove}
            >
              <Icon name="close" size={14} color={T.text} />
            </Pressable>
          </View>
        ))}
        {room > 0 ? (
          <>
            <Pressable accessibilityRole="button" onPress={takePhoto} style={[styles.thumb, styles.add]}>
              <Icon name="camera" size={26} />
              <Body size={14} weight="bold" color={T.brassHi} center>
                {t("adventurer.finish.takePhoto")}
              </Body>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={pickFromGallery} style={[styles.thumb, styles.add, styles.gallery]}>
              <Icon name="image" size={24} color={T.muted} />
              <Body size={13} weight="bold" color={T.muted} center>
                {t("adventurer.finish.gallery")}
              </Body>
            </Pressable>
          </>
        ) : null}
      </View>
      <Body size={13} color={notice ? T.bad : T.faint}>
        {notice ?? t("adventurer.finish.maxPhotos", { count: max })}
      </Body>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingTop: 8, paddingRight: 8 },
  thumb: {
    width: TILE,
    height: TILE,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: T.line,
    backgroundColor: T.well,
    overflow: "visible",
  },
  add: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderStyle: "dashed",
    borderColor: T.brassDk,
    backgroundColor: "transparent",
    padding: 6,
  },
  gallery: { borderColor: T.line },
  remove: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: T.line,
    backgroundColor: T.surface,
  },
});
