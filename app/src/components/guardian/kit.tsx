import { useRouter } from "expo-router";
import { useCallback, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/icons";
import { Body, Choice, Frame, Sprite, Title } from "@/components/ui";
import type { SpriteName } from "@/lib/art";
import { errorKey } from "@/lib/family";
import { F, T } from "@/lib/theme";

// ─── Navigation ───────────────────────────────────────────────────────────

/** Back when there is history, otherwise a sensible guardian route (deep links, web reloads). */
export function useGoBack(fallback: string) {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback as never);
  }, [router, fallback]);
}

// ─── Headers ──────────────────────────────────────────────────────────────

/** Scene header: a prop sprite beside the screen title (design: "Mercado da família", "Portões do celular"). */
export function PageHeader({
  sprite,
  spriteWidth = 48,
  title,
  subtitle,
  onBack,
  right,
}: {
  sprite?: SpriteName;
  spriteWidth?: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.header}>
      {onBack ? <BackButton onPress={onBack} label={t("guardian.back")} /> : null}
      {sprite ? <Sprite name={sprite} width={spriteWidth} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Title size={22}>{title}</Title>
        {subtitle ? (
          <Body size={14} color={T.muted}>
            {subtitle}
          </Body>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/** Plain brass chevron, 44×44 (the design's back link has no box). */
export function BackButton({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4} style={styles.back}>
      <Icon name="back" size={24} color={T.brassHi} />
    </Pressable>
  );
}

// ─── Rows ─────────────────────────────────────────────────────────────────

/** Settings-style row: bold title + muted description, control on the right. */
export function SettingRow({
  title,
  desc,
  right,
  last,
  icon,
}: {
  title: string;
  desc?: string;
  right?: ReactNode;
  last?: boolean;
  icon?: ReactNode;
}) {
  return (
    <View style={[styles.row, !last && styles.rowLine]}>
      {icon}
      <View style={{ flex: 1, gap: 1 }}>
        <Body size={16} weight="bold">
          {title}
        </Body>
        {desc ? (
          <Body size={13} color={T.muted}>
            {desc}
          </Body>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/** The design's small value button ("2 h", "21:00") that opens an editor. */
export function ValueButton({
  label,
  onPress,
  accessibilityLabel,
  color = T.brassHi,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.val, pressed && { opacity: 0.8 }]}
    >
      <Text style={[styles.valText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <Body size={14} color={T.bad} style={{ marginTop: 2 }}>
      {children}
    </Body>
  );
}

/** Small sprite + muted line under a primary action ("O Lucas recebe um aviso na hora"). */
export function Note({ sprite = "bell", children }: { sprite?: SpriteName; children: ReactNode }) {
  return (
    <View style={styles.note}>
      <Sprite name={sprite} width={16} />
      <Body size={13} color={T.muted} center style={{ flexShrink: 1 }}>
        {children}
      </Body>
    </View>
  );
}

/** Coin sprite + price in coin colour. */
export function Price({ coins, size = 15 }: { coins: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <Sprite name="coin" width={Math.round(size)} />
      <Text style={{ fontFamily: F.heavy, fontSize: size, color: T.coin, fontVariant: ["tabular-nums"] }}>{coins}</Text>
    </View>
  );
}

// ─── Sheets ───────────────────────────────────────────────────────────────

/** Bottom sheet on native, centred card on wide web — a Frame over a dimmed backdrop. */
export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t("actions.close")} />
        <Frame style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Title size={18} style={{ flex: 1 }}>
              {title}
            </Title>
            <Pressable accessibilityRole="button" accessibilityLabel={t("actions.close")} onPress={onClose} style={styles.close}>
              <Icon name="close" size={20} color={T.muted} />
            </Pressable>
          </View>
          {children}
        </Frame>
      </View>
    </Modal>
  );
}

/** A sheet listing a handful of values; picking one saves and closes. */
export function OptionSheet<V extends string | number>({
  visible,
  title,
  options,
  value,
  onPick,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { value: V; label: string }[];
  value: V;
  onPick: (v: V) => void;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.optGrid}>
        {options.map((o) => (
          <Choice
            key={String(o.value)}
            selected={o.value === value}
            label={o.label}
            onPress={() => {
              onPick(o.value);
              onClose();
            }}
            style={styles.opt}
          >
            <Body weight="bold" center color={o.value === value ? T.brassHi : T.text}>
              {o.label}
            </Body>
          </Choice>
        ))}
      </View>
    </Sheet>
  );
}

// ─── Time input ───────────────────────────────────────────────────────────

/** Keep only digits and insert the colon: "1730" → "17:30". */
export function formatTimeInput(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
}

export function isValidTime(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

/** Digits only → integer (empty → 0). */
export function toInt(s: string): number {
  const n = parseInt(s.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

// ─── Mutations ────────────────────────────────────────────────────────────

/** Run one async action at a time with a busy flag and a translated error message. */
export function useBusy() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(
    async (fn: () => Promise<unknown>): Promise<boolean> => {
      setBusy(true);
      setError(null);
      try {
        await fn();
        return true;
      } catch (e) {
        setError(t(errorKey(e)));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [t],
  );
  return { busy, error, setError, run };
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: -8, marginRight: -4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 58, paddingVertical: 8 },
  rowLine: { borderBottomWidth: 1, borderBottomColor: T.lineSoft },
  val: {
    minHeight: 36,
    paddingHorizontal: 10,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: T.line,
    borderRadius: 4,
    backgroundColor: T.well,
  },
  valText: { fontFamily: F.bold, fontSize: 14, fontVariant: ["tabular-nums"] },
  note: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  backdrop: { flex: 1, backgroundColor: "rgba(8,6,5,0.72)", justifyContent: "flex-end", alignItems: "center" },
  sheet: { width: "100%", maxWidth: 520, gap: 14 },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginRight: -8 },
  optGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  opt: { flexBasis: "30%", flexGrow: 1, minHeight: 52, alignItems: "center", justifyContent: "center" },
});

/** "20:00" today, "27/09 20:00" on another day. */
export function formatDue(ms: number): string {
  const d = new Date(ms);
  const today = new Date();
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (d.toDateString() === today.toDateString()) return time;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${time}`;
}
