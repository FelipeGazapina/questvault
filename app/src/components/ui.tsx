import { Image } from "expo-image";
import { type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, type IconName } from "@/components/icons";
import { CREST_SPRITE, SCENES, SPRITES, type SceneName, type SpriteName } from "@/lib/art";
import { F, T, type Crest } from "@/lib/theme";

// ─── Text ─────────────────────────────────────────────────────────────────

type TxtProps = {
  children: ReactNode;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  center?: boolean;
};

/** Cinzel — titles, section headers and buttons. */
export function Title({ children, size = 22, color = T.text, style, numberOfLines, center }: TxtProps) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: F.display, fontSize: size, color, lineHeight: Math.round(size * 1.25) }, center && styles.center, style]}
    >
      {children}
    </Text>
  );
}

/** Alegreya Sans — everything people read. */
export function Body({
  children,
  size = 16,
  color = T.text,
  style,
  numberOfLines,
  center,
  weight = "regular",
}: TxtProps & { weight?: "regular" | "medium" | "bold" | "heavy" | "italic" }) {
  const family = { regular: F.body, medium: F.medium, bold: F.bold, heavy: F.heavy, italic: F.bodyItalic }[weight];
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: family, fontSize: size, color, lineHeight: Math.round(size * 1.35) }, center && styles.center, style]}
    >
      {children}
    </Text>
  );
}

/** Small uppercase label ("PRAZO", "EXPERIÊNCIA"). */
export function Label({ children, color = T.muted, style }: { children: ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.label, { color }, style]}>{children}</Text>;
}

/** Tabular numbers (coins, minutes, XP, money). */
export function Num({ children, size = 18, color = T.text, style }: TxtProps) {
  return (
    <Text style={[{ fontFamily: F.heavy, fontSize: size, color, fontVariant: ["tabular-nums"], lineHeight: Math.round(size * 1.2) }, style]}>
      {children}
    </Text>
  );
}

// ─── Art ──────────────────────────────────────────────────────────────────

/** A pixel-art prop at a given width (height follows the sprite's grid). */
export function Sprite({ name, width, style }: { name: SpriteName; width: number; style?: StyleProp<ViewStyle> }) {
  const s = SPRITES[name];
  return (
    <Image
      source={s.src}
      style={[{ width, height: Math.round((width * s.h) / s.w) }, style as object]}
      contentFit="contain"
      accessible={false}
    />
  );
}

/** The adventurer's banner in a dark slot. */
export function CrestBadge({ crest, size = 46 }: { crest: Crest; size?: number }) {
  const w = Math.round(size * 0.62);
  return (
    <View style={[styles.slot, { width: size, height: Math.round(size * 1.2) }]}>
      <Sprite name={CREST_SPRITE[crest]} width={w} />
    </View>
  );
}

export function Slot({ children, size = 48, style }: { children: ReactNode; size?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.slot, { width: size, height: size }, style]}>{children}</View>;
}

/**
 * Screen with a pixel scene on top. The scene's bottom quarter is dark ground, and content starts
 * on it (overlapping), so the UI sits inside the world instead of under a hard edge.
 */
export function Screen({
  scene,
  children,
  contentStyle,
  gap = 16,
}: {
  scene?: SceneName;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  gap?: number;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const w = Math.min(width, 520);
  const s = scene ? SCENES[scene] : null;
  const sceneH = s ? Math.round((w * s.h) / s.w) : 0;
  const overlap = s ? Math.round(sceneH * (s.h === 80 ? 0.25 : 0.24)) : 0;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 28, alignItems: "center" }}>
      <View style={{ width: w }}>
        {s ? (
          <Image source={s.src} style={{ width: w, height: sceneH }} contentFit="cover" accessible={false} />
        ) : (
          <View style={{ height: insets.top + 12 }} />
        )}
        <View style={[{ marginTop: -overlap, paddingHorizontal: 16, gap }, contentStyle]}>{children}</View>
      </View>
    </ScrollView>
  );
}

// ─── Surfaces ─────────────────────────────────────────────────────────────

/** Leather panel with a double rule and brass corner rivets. */
export function Frame({ children, style, accent }: { children: ReactNode; style?: StyleProp<ViewStyle>; accent?: string }) {
  return (
    <View style={[styles.frame, accent ? { borderColor: accent } : null, style]}>
      <View pointerEvents="none" style={styles.frameInner} />
      <View pointerEvents="none" style={[styles.rivet, { top: -1, left: -1 }]} />
      <View pointerEvents="none" style={[styles.rivet, { top: -1, right: -1 }]} />
      <View pointerEvents="none" style={[styles.rivet, { bottom: -1, left: -1 }]} />
      <View pointerEvents="none" style={[styles.rivet, { bottom: -1, right: -1 }]} />
      {children}
    </View>
  );
}

export function Card({ children, style, highlight }: { children: ReactNode; style?: StyleProp<ViewStyle>; highlight?: string }) {
  return (
    <View style={[styles.card, highlight ? { borderColor: highlight, backgroundColor: T.cardHi } : null, style]}>{children}</View>
  );
}

/** Parchment — only for reports and messages between guardian and adventurer. */
export function Parchment({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.parch, style]}>
      <View pointerEvents="none" style={styles.parchInner} />
      {children}
    </View>
  );
}

/** "——◆ TÍTULO ◆——" section divider. */
export function Ornament({ title }: { title?: string }) {
  return (
    <View style={styles.orn} accessibilityRole={title ? "header" : undefined}>
      <View style={styles.ornLine}>
        <View style={[styles.diamond, { right: 0 }]} />
      </View>
      {title ? <Text style={styles.ornText}>{title}</Text> : null}
      <View style={styles.ornLine}>
        <View style={[styles.diamond, { left: 0 }]} />
      </View>
    </View>
  );
}

// ─── Controls ─────────────────────────────────────────────────────────────

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  sprite,
  disabled,
  busy,
  style,
  size = "md",
  accessibilityLabel,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "ghost" | "danger";
  icon?: IconName;
  sprite?: SpriteName;
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: "md" | "lg";
  accessibilityLabel?: string;
}) {
  const color = variant === "primary" ? T.onBrass : variant === "danger" ? T.bad : T.brassHi;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      onPress={disabled || busy ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        size === "lg" && { minHeight: 54 },
        variant === "primary" && styles.btnPrimary,
        variant === "ghost" && styles.btnGhost,
        variant === "danger" && styles.btnDanger,
        (disabled || busy) && { opacity: 0.5 },
        pressed && { transform: [{ translateY: 1 }], opacity: 0.9 },
        style,
      ]}
    >
      {busy ? <ActivityIndicator color={color} /> : null}
      {!busy && icon ? <Icon name={icon} size={18} color={color} /> : null}
      {!busy && sprite ? <Sprite name={sprite} width={22} /> : null}
      <Text style={[styles.btnText, { color }, size === "lg" && { fontSize: 15 }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  color = T.brassHi,
  badge,
  sprite,
}: {
  icon?: IconName;
  sprite?: SpriteName;
  onPress?: () => void;
  label: string;
  color?: string;
  badge?: number;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.iconBtn} hitSlop={4}>
      {sprite ? <Sprite name={sprite} width={27} /> : icon ? <Icon name={icon} size={22} color={color} /> : null}
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function Field({ label, style, ...rest }: TextInputProps & { label?: string; style?: StyleProp<TextStyle> }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Label>{label}</Label> : null}
      <TextInput
        placeholderTextColor={T.faint}
        accessibilityLabel={label}
        {...rest}
        style={[styles.field, rest.multiline && { minHeight: 96, textAlignVertical: "top", paddingTop: 10 }, style]}
      />
    </View>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      hitSlop={8}
      style={[styles.toggle, value && styles.toggleOn]}
    >
      <View style={[styles.knob, value && styles.knobOn]} />
    </Pressable>
  );
}

export function Segmented<V extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: V; label: string; color?: string }[];
  value: V;
  onChange: (v: V) => void;
  label: string;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.seg}>
      {options.map((o, i) => {
        const on = o.value === value;
        const c = o.color ?? T.brass;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(o.value)}
            style={[
              styles.segItem,
              i > 0 && { borderLeftWidth: 1, borderLeftColor: T.lineSoft },
              on && { backgroundColor: `${c}24`, borderColor: c },
            ]}
          >
            <Text style={[styles.segText, { color: on ? (o.color ?? T.brassHi) : T.muted }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Selectable card-like option (reward type, tier, adventurer). */
export function Choice({
  selected,
  onPress,
  children,
  color = T.brass,
  style,
  label,
  role = "radio",
}: {
  selected: boolean;
  onPress: () => void;
  children: ReactNode;
  color?: string;
  style?: StyleProp<ViewStyle>;
  label: string;
  role?: "radio" | "checkbox";
}) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.choice, selected && { borderColor: color, backgroundColor: T.cardHi, borderWidth: 2 }, style]}
    >
      {children}
    </Pressable>
  );
}

// ─── Status & rewards ─────────────────────────────────────────────────────

export type SealKind = "todo" | "pend" | "ok" | "bad" | "time";

const SEAL: Record<SealKind, { fg: string; line: string; bg: string }> = {
  todo: { fg: T.brassHi, line: "#6b5436", bg: "rgba(201,164,92,0.1)" },
  pend: { fg: T.pend, line: T.pendLine, bg: "rgba(165,143,216,0.12)" },
  ok: { fg: T.ok, line: T.okLine, bg: "rgba(127,176,105,0.12)" },
  bad: { fg: T.bad, line: T.badLine, bg: "rgba(198,91,79,0.12)" },
  time: { fg: T.time, line: T.timeLine, bg: "rgba(95,184,173,0.1)" },
};

export function Seal({ kind, label, icon }: { kind: SealKind; label: string; icon?: IconName }) {
  const c = SEAL[kind];
  return (
    <View style={[styles.seal, { borderColor: c.line, backgroundColor: c.bg }]}>
      {icon ? <Icon name={icon} size={13} color={c.fg} /> : null}
      <Text style={[styles.sealText, { color: c.fg }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

export type ChipKind = "coin" | "time" | "xp" | "item";

const CHIP: Record<ChipKind, { fg: string; line: string; bg: string; sprite?: SpriteName }> = {
  coin: { fg: T.coin, line: T.coinLine, bg: "rgba(227,179,65,0.08)", sprite: "coin" },
  time: { fg: T.time, line: T.timeLine, bg: "rgba(95,184,173,0.08)", sprite: "hourglass" },
  xp: { fg: T.xp, line: T.xpLine, bg: "rgba(143,180,227,0.08)" },
  item: { fg: T.brassHi, line: "#6b5436", bg: "rgba(201,164,92,0.08)", sprite: "chest" },
};

export function Chip({ kind, label }: { kind: ChipKind; label: string }) {
  const c = CHIP[kind];
  return (
    <View style={[styles.chip, { borderColor: c.line, backgroundColor: c.bg }]}>
      {c.sprite ? <Sprite name={c.sprite} width={15} /> : null}
      <Text style={[styles.chipText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

export function Bar({ ratio, color = T.xpFill, height = 8 }: { ratio: number; color?: string; height?: number }) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <View style={[styles.bar, { height }]}>
      <View style={{ width: `${pct}%`, height: "100%", backgroundColor: color }} />
    </View>
  );
}

/** Numbered diamond step header used in the delivery dialog. */
export function Step({ n, title }: { n: number; title: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={styles.stepDiamond}>
        <Text style={styles.stepNum}>{n}</Text>
      </View>
      <Title size={14} color={T.brassHi} style={{ letterSpacing: 1.2 }}>
        {title}
      </Title>
    </View>
  );
}

export function Empty({ sprite, text }: { sprite?: SpriteName; text: string }) {
  return (
    <Card style={{ alignItems: "center", gap: 10, paddingVertical: 20 }}>
      {sprite ? <Sprite name={sprite} width={52} /> : null}
      <Body center color={T.muted}>
        {text}
      </Body>
    </Card>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, backgroundColor: T.bg, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={T.brass} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center" },
  screen: { flex: 1, backgroundColor: T.bg },
  label: { fontFamily: F.bold, fontSize: 12, letterSpacing: 1.6, textTransform: "uppercase" },
  slot: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.well,
    borderWidth: 1,
    borderColor: T.line,
    borderRadius: 4,
  },
  frame: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.line,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  frameInner: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderWidth: 1,
    borderColor: T.lineSoft,
  },
  rivet: { position: "absolute", width: 5, height: 5, backgroundColor: T.brass },
  card: { backgroundColor: T.card, borderWidth: 1, borderColor: T.lineSoft, borderRadius: 6, padding: 12 },
  parch: {
    backgroundColor: T.parch,
    borderWidth: 1,
    borderColor: T.brassDk,
    borderRadius: 4,
    padding: 14,
  },
  parchInner: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderWidth: 1,
    borderColor: T.parchLine,
    borderRadius: 2,
  },
  orn: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  ornLine: { flex: 1, height: 1, backgroundColor: T.line },
  diamond: { position: "absolute", top: -3, width: 6, height: 6, backgroundColor: T.brass, transform: [{ rotate: "45deg" }] },
  ornText: { fontFamily: F.display, fontSize: 13, letterSpacing: 2, color: T.brass },
  btn: {
    minHeight: 46,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 4,
  },
  btnPrimary: {
    backgroundColor: T.brass,
    borderTopWidth: 1,
    borderTopColor: T.brassLight,
    borderBottomWidth: 2,
    borderBottomColor: T.brassDk,
  },
  btnGhost: { borderWidth: 1, borderColor: T.brassDk },
  btnDanger: { borderWidth: 1, borderColor: "#9a3f36" },
  btnText: { fontFamily: F.display, fontSize: 14, letterSpacing: 1 },
  iconBtn: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.line,
    borderRadius: 4,
  },
  badge: {
    position: "absolute",
    top: -7,
    right: -7,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: T.badge,
    borderWidth: 1,
    borderColor: T.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontFamily: F.heavy, fontSize: 12, color: "#fff4e8" },
  field: {
    minHeight: 46,
    paddingHorizontal: 12,
    backgroundColor: T.well,
    borderWidth: 1,
    borderColor: T.line,
    borderRadius: 4,
    color: T.text,
    fontFamily: F.body,
    fontSize: 16,
  },
  toggle: {
    width: 52,
    height: 30,
    padding: 3,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: T.line,
    backgroundColor: T.well,
    justifyContent: "center",
  },
  toggleOn: { backgroundColor: "#3b3020", borderColor: T.brass, alignItems: "flex-end" },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: T.line },
  knobOn: { backgroundColor: T.brass },
  seg: { flexDirection: "row", borderWidth: 1, borderColor: T.lineSoft, borderRadius: 4, overflow: "hidden" },
  segItem: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  segText: { fontFamily: F.bold, fontSize: 15 },
  choice: {
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.lineSoft,
    borderRadius: 6,
    padding: 12,
    gap: 6,
  },
  seal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  sealText: { fontFamily: F.bold, fontSize: 12, letterSpacing: 1 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 3,
    paddingLeft: 7,
    paddingRight: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontFamily: F.bold, fontSize: 14 },
  bar: { backgroundColor: "#110d0b", borderWidth: 1, borderColor: T.lineSoft, borderRadius: 999, overflow: "hidden" },
  stepDiamond: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: T.brass,
    backgroundColor: T.cardHi,
    transform: [{ rotate: "45deg" }],
  },
  stepNum: { fontFamily: F.display, fontSize: 12, color: T.brassHi, transform: [{ rotate: "-45deg" }] },
});
