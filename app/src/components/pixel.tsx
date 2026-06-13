import { Modal, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

import { C, FONT } from "@/lib/palette";

export function PixelText({
  children,
  size = 12,
  color = C.white,
  style,
}: {
  children: ReactNodeLike;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text style={[{ fontFamily: FONT.head, fontSize: size, color, lineHeight: size * 1.7 }, style]}>
      {children}
    </Text>
  );
}

export function BodyText({
  children,
  size = 20,
  color = C.white,
  style,
}: {
  children: ReactNodeLike;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text style={[{ fontFamily: FONT.body, fontSize: size, color, lineHeight: size * 1.15 }, style]}>
      {children}
    </Text>
  );
}

/** D2.1 — money is always rendered in a clean system sans, never a pixel font. */
export function MoneyText({
  children,
  size = 14,
  color = C.white,
  style,
}: {
  children: ReactNodeLike;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[{ fontSize: size, color, fontWeight: "600" }, style]}>{children}</Text>;
}

export function PixelPanel({
  children,
  style,
  borderColor = C.ink,
  background = C.navy,
}: {
  children: ReactNodeLike;
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
  background?: string;
}) {
  return (
    <View style={[styles.panel, { borderColor, backgroundColor: background }, style]}>{children}</View>
  );
}

export function PixelButton({
  label,
  onPress,
  color = C.leaf,
  textColor = "#0c2a18",
  ghost = false,
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  ghost?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        ghost
          ? { backgroundColor: "transparent", borderColor: C.ink }
          : { backgroundColor: color, borderColor: C.ink },
        !ghost && !pressed && styles.buttonShadow,
        pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      <Text style={{ fontFamily: FONT.head, fontSize: 10, color: ghost ? C.slate : textColor }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Segmented progress bar — sky for XP, gold for money. */
export function SegBar({
  ratio,
  color = C.sky,
  cells = 16,
}: {
  ratio: number;
  color?: string;
  cells?: number;
}) {
  const filled = Math.round(Math.max(0, Math.min(1, ratio)) * cells);
  return (
    <View style={styles.bar}>
      {Array.from({ length: cells }, (_, i) => (
        <View
          key={i}
          style={[styles.cell, { backgroundColor: i < filled ? color : C.night }]}
        />
      ))}
    </View>
  );
}

/** R4 / design rule D2.1 — the explicit-confirm modal. Amounts in clean sans, pixel chrome. */
export function ConfirmModal({
  visible,
  title,
  lines,
  confirmLabel = "CONFIRM",
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  lines: { label: string; value: string; strong?: boolean }[];
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <PixelText size={12} color={C.gold} style={{ textAlign: "center" }}>
            {title}
          </PixelText>
          <View style={styles.modalPanel}>
            {lines.map((l) => (
              <View key={l.label} style={styles.modalRow}>
                <MoneyText size={13} color={C.fog} style={{ fontWeight: "400" }}>
                  {l.label}
                </MoneyText>
                <MoneyText size={l.strong ? 17 : 14} color={l.strong ? C.white : C.fog}>
                  {l.value}
                </MoneyText>
              </View>
            ))}
          </View>
          <PixelButton label={confirmLabel} color={C.gold} textColor="#4a3208" onPress={onConfirm} />
          <PixelButton label="CANCEL" ghost onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
}

type ReactNodeLike = React.ReactNode;

const styles = StyleSheet.create({
  panel: {
    borderWidth: 3,
    padding: 12,
    gap: 8,
  },
  button: {
    borderWidth: 3,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonShadow: {
    boxShadow: "4px 4px 0px rgba(0,0,0,0.5)",
  },
  bar: {
    flexDirection: "row",
    gap: 2,
    padding: 2,
    backgroundColor: C.deep,
    borderWidth: 2,
    borderColor: C.ink,
    alignSelf: "stretch",
  },
  cell: {
    flex: 1,
    height: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(8, 9, 16, 0.82)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    alignSelf: "stretch",
    maxWidth: 360,
    backgroundColor: C.navy,
    borderWidth: 4,
    borderColor: C.ink,
    padding: 18,
    gap: 12,
  },
  modalPanel: {
    backgroundColor: C.panelDark,
    borderWidth: 2,
    borderColor: C.ink,
    padding: 12,
    gap: 8,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
