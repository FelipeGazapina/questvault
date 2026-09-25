import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { Body, Button, Frame, Title } from "@/components/ui";
import { T } from "@/lib/theme";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof navigator === "undefined") return false;
  return (
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
}

/** Install nudge: notifications only reach a home-screen PWA, so this matters for the family flow. */
export function PwaInstallPrompt() {
  const { t } = useTranslation();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    const wantsInstall = new URLSearchParams(window.location.search).get("install") === "1";
    if (wantsInstall && isIosSafari()) setShowIosHint(true);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setShowIosHint(false);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function onInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferred(null);
  }

  if (installed || dismissed) return null;
  if (!deferred && !showIosHint) return null;

  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <Frame style={styles.panel}>
        <Title size={16} color={T.brassHi} center>
          {t("pwa.installTitle")}
        </Title>
        <Body center color={T.muted}>
          {showIosHint && !deferred ? t("pwa.iosHint") : t("pwa.installBody")}
        </Body>
        <View style={styles.row}>
          {deferred ? <Button label={t("pwa.install")} onPress={() => void onInstall()} /> : null}
          <Button label={t("pwa.later")} variant="ghost" onPress={() => setDismissed(true)} />
        </View>
      </Frame>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "fixed" as unknown as "absolute",
    bottom: 96,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: "center",
  },
  panel: { maxWidth: 420, width: "100%", gap: 10 },
  row: { flexDirection: "row", gap: 8, justifyContent: "center" },
});
