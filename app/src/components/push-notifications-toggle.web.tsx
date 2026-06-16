import { useMutation } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { BodyText, PixelText } from "@/components/pixel";
import {
  getCurrentPushSubscription,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-notifications";
import { C } from "@/lib/palette";
import { api } from "../../convex/_generated/api";

export function PushNotificationsToggle() {
  const { t, i18n } = useTranslation();
  const register = useMutation(api.push.registerPushSubscription);
  const remove = useMutation(api.push.removePushSubscription);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const supported = isPushSupported();

  const refresh = useCallback(async () => {
    if (!supported) {
      setEnabled(false);
      return;
    }
    const sub = await getCurrentPushSubscription();
    setEnabled(sub !== null);
  }, [supported]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onToggle() {
    if (!supported || busy) return;
    setBusy(true);
    try {
      if (enabled) {
        const sub = await getCurrentPushSubscription();
        await unsubscribeFromPush();
        if (sub) await remove({ endpoint: sub.endpoint });
        setEnabled(false);
      } else {
        const sub = await subscribeToPush(i18n.language);
        if (!sub) return;
        await register(sub);
        setEnabled(true);
      }
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  return (
    <View style={{ gap: 8 }}>
      <PixelText size={8} color={C.slate}>
        {t("hero.pushHeader")}
      </PixelText>
      <Pressable
        onPress={() => void onToggle()}
        disabled={busy}
        style={{
          borderWidth: 3,
          borderColor: enabled ? C.mint : C.ink,
          backgroundColor: C.navy,
          padding: 10,
          gap: 4,
        }}
      >
        <PixelText size={9} color={enabled ? C.mint : C.fog}>
          {enabled ? t("hero.pushOn") : t("hero.pushOff")}
          {enabled ? "  ✓" : ""}
        </PixelText>
        <BodyText size={16} color={C.fog}>
          {t("hero.pushDesc")}
        </BodyText>
      </Pressable>
    </View>
  );
}
