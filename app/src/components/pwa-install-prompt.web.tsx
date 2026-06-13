import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { C, FONT } from "@/lib/palette";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosStandalone() {
  if (typeof navigator === "undefined") return false;
  return (
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
}

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [showManualHint, setShowManualHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isIosStandalone() || window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const wantsInstall = params.get("install") === "1";

    if (wantsInstall && isIosSafari()) {
      setShowIosHint(true);
    }

    if (wantsInstall && !isIosSafari()) {
      setShowManualHint(true);
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShowManualHint(false);
      if (wantsInstall) {
        setShowIosHint(false);
      }
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setShowIosHint(false);
      setShowManualHint(false);
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
    setShowManualHint(false);
  }

  if (installed || dismissed) return null;
  if (!deferred && !showIosHint && !showManualHint) return null;

  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <View style={styles.panel}>
        <Text style={styles.title}>INSTALL QUESTVAULT</Text>
        {showIosHint && !deferred ? (
          <Text style={styles.body}>
            Tap Share, then &quot;Add to Home Screen&quot; to install the app on iOS.
          </Text>
        ) : showManualHint && !deferred ? (
          <Text style={styles.body}>
            Use the browser menu (⋮ or ⋯) and choose &quot;Install app&quot; or &quot;Add to Home
            screen&quot;.
          </Text>
        ) : (
          <Text style={styles.body}>Add QuestVault to your home screen — play like a native app.</Text>
        )}
        <View style={styles.row}>
          {deferred ? (
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => void onInstall()}>
              <Text style={styles.btnPrimaryText}>INSTALL</Text>
            </Pressable>
          ) : null}
          <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setDismissed(true)}>
            <Text style={styles.btnGhostText}>NOT NOW</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "fixed" as unknown as "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: "center",
  },
  panel: {
    maxWidth: 420,
    width: "100%",
    backgroundColor: C.navy,
    borderWidth: 3,
    borderColor: C.ink,
    padding: 14,
    gap: 10,
  },
  title: {
    fontFamily: FONT.head,
    fontSize: 10,
    color: C.white,
    textAlign: "center",
  },
  body: {
    fontFamily: FONT.body,
    fontSize: 20,
    color: C.fog,
    textAlign: "center",
    lineHeight: 22,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 3,
    borderColor: C.ink,
    minWidth: 100,
    alignItems: "center",
  },
  btnPrimary: {
    backgroundColor: C.leaf,
  },
  btnPrimaryText: {
    fontFamily: FONT.head,
    fontSize: 9,
    color: "#0c2a18",
  },
  btnGhost: {
    backgroundColor: C.night,
  },
  btnGhostText: {
    fontFamily: FONT.head,
    fontSize: 9,
    color: C.slate,
  },
});
