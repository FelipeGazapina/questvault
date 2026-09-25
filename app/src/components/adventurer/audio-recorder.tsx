import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/components/icons";
import { Body, Card, Num } from "@/components/ui";
import { T } from "@/lib/theme";

export type LocalAudio = { uri: string; seconds: number };

const WAVE = [8, 16, 22, 12, 18, 9, 20, 14, 24, 10, 16, 7, 19, 12, 8, 15, 11, 6];

function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Record an audio report (expo-audio), listen back, and re-record. */
export function AudioRecorder({ value, onChange }: { value: LocalAudio | null; onChange: (a: LocalAudio | null) => void }) {
  const { t } = useTranslation();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const rec = useAudioRecorderState(recorder, 250);
  const player = useAudioPlayer(value?.uri ?? null);
  const playback = useAudioPlayerStatus(player);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setError(t("adventurer.audio.denied"));
        return;
      }
      if (playback.playing) player.pause();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      setError(t("adventurer.audio.failed"));
    }
  };

  const stop = async () => {
    const seconds = Math.max(1, Math.round(rec.durationMillis / 1000));
    try {
      await recorder.stop();
      // Route playback back to the speaker on iOS.
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
      const uri = recorder.uri ?? rec.url;
      if (uri) onChange({ uri, seconds });
      else setError(t("adventurer.audio.failed"));
    } catch {
      setError(t("adventurer.audio.failed"));
    }
  };

  const togglePlay = () => {
    if (playback.playing) {
      player.pause();
      return;
    }
    if (playback.didJustFinish || (playback.duration > 0 && playback.currentTime >= playback.duration - 0.05)) {
      void player.seekTo(0);
    }
    player.play();
  };

  const recording = rec.isRecording;
  const hint = recording ? t("adventurer.audio.recording") : value ? t("adventurer.audio.again") : t("adventurer.audio.tapToRecord");
  const shownSeconds = recording ? rec.durationMillis / 1000 : playback.playing ? playback.currentTime : (value?.seconds ?? 0);

  return (
    <Card style={styles.card}>
      {value || recording ? (
        <View style={styles.row}>
          {value && !recording ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={playback.playing ? t("adventurer.audio.pause") : t("adventurer.audio.play")}
              onPress={togglePlay}
              style={styles.play}
            >
              <Icon name={playback.playing ? "stop" : "play"} color={T.time} />
            </Pressable>
          ) : null}
          <View style={styles.wave} aria-hidden>
            {WAVE.map((h, i) => (
              <View key={i} style={[styles.waveBar, { height: h, backgroundColor: recording ? T.badFill : T.timeFill }]} />
            ))}
          </View>
          <Num size={14} color={T.muted}>
            {clock(shownSeconds)}
          </Num>
          {value && !recording ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("adventurer.audio.discard")}
              onPress={() => onChange(null)}
              hitSlop={6}
              style={styles.discard}
            >
              <Icon name="trash" size={18} color={T.muted} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={recording ? t("adventurer.audio.stop") : value ? t("adventurer.audio.reRecord") : t("adventurer.audio.start")}
        onPress={recording ? stop : start}
        style={({ pressed }) => [styles.rec, recording && styles.recOn, pressed && { opacity: 0.85 }]}
      >
        <Icon name={recording ? "stop" : "mic"} size={26} color="#fff4e8" />
      </Pressable>
      <Body size={13} color={error ? T.bad : T.muted} center>
        {error ?? hint}
      </Body>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", gap: 12, padding: 16 },
  row: { alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: 10 },
  play: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: T.timeLine,
    backgroundColor: T.well,
  },
  wave: { flex: 1, height: 24, flexDirection: "row", alignItems: "center", gap: 2, overflow: "hidden" },
  waveBar: { width: 3, borderRadius: 2 },
  discard: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  rec: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: T.brass,
    backgroundColor: T.badLine,
  },
  recOn: { backgroundColor: T.badFill },
});
