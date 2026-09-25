import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Modal, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Body, Button, Frame, Title } from "@/components/ui";
import { T } from "@/lib/theme";

/** Dimmed modal with a centred leather frame. `onDismiss` handles the Android back button. */
export function ModalFrame({
  visible,
  onDismiss,
  children,
  dim = 0.82,
}: {
  visible: boolean;
  onDismiss?: () => void;
  children: ReactNode;
  dim?: number;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss ?? (() => {})} statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: `rgba(8,6,4,${dim})` }]}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Frame style={styles.frame}>
            <View accessibilityViewIsModal style={{ gap: 16 }}>
              {children}
            </View>
          </Frame>
        </ScrollView>
      </View>
    </Modal>
  );
}

/** Yes/no confirmation in the RPG frame (Alert is a no-op on web). */
export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  busy,
  error,
}: {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  error?: string | null;
}) {
  const { t } = useTranslation();
  return (
    <ModalFrame visible={visible} onDismiss={busy ? undefined : onCancel}>
      <Title size={19} center>
        {title}
      </Title>
      {body ? (
        <Body center color={T.muted}>
          {body}
        </Body>
      ) : null}
      {error ? (
        <Body center color={T.bad}>
          {error}
        </Body>
      ) : null}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button label={t("adventurer.confirm.no")} variant="ghost" onPress={onCancel} disabled={busy} style={{ flex: 1 }} />
        <Button label={confirmLabel ?? t("adventurer.confirm.yes")} onPress={onConfirm} busy={busy} style={{ flex: 1 }} />
      </View>
    </ModalFrame>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 16 },
  frame: { width: "100%", maxWidth: 440, paddingTop: 24, paddingHorizontal: 20, paddingBottom: 20 },
});
