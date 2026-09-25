import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/components/icons";
import { Card, Num } from "@/components/ui";
import { T } from "@/lib/theme";

// Decorative waveform (the report's real samples aren't stored).
const WAVE = [8, 14, 20, 12, 18, 24, 10, 16, 22, 14, 8, 18, 12, 20, 9, 15, 22, 11, 7, 13, 18, 10, 6];

function clock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Play/pause an adventurer's audio report, with a brass progress waveform and its duration. */
export function AudioReport({ url, seconds, name }: { url: string; seconds: number | null; name: string }) {
  const { t } = useTranslation();
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  const duration = status.duration || seconds || 0;
  const progress = duration > 0 ? status.currentTime / duration : 0;
  const playing = status.playing;

  function toggle() {
    if (playing) {
      player.pause();
      return;
    }
    if (duration > 0 && status.currentTime >= duration - 0.2) void player.seekTo(0);
    player.play();
  }

  return (
    <Card style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={playing ? t("guardian.audio.pause") : t("guardian.audio.play", { name })}
        onPress={toggle}
        style={styles.play}
      >
        <Icon name={playing ? "stop" : "play"} size={20} color={T.brassHi} />
      </Pressable>
      <View style={styles.wave} accessible={false}>
        {WAVE.map((h, i) => (
          <View
            key={i}
            style={[styles.bar, { height: h, backgroundColor: i / WAVE.length < progress ? T.brassHi : T.brassDk }]}
          />
        ))}
      </View>
      <Num size={14} color={T.muted}>
        {clock(playing || status.currentTime > 0 ? status.currentTime : duration)}
      </Num>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingLeft: 8, paddingRight: 12 },
  play: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: T.brassDk,
    backgroundColor: "#1a1511",
    alignItems: "center",
    justifyContent: "center",
  },
  wave: { flex: 1, height: 24, flexDirection: "row", alignItems: "center", gap: 2, overflow: "hidden" },
  bar: { width: 3, borderRadius: 2 },
});
