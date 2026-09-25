import { useMutation } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Body, Toggle } from "@/components/ui";
import {
  getCurrentPushSubscription,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-notifications";
import { T } from "@/lib/theme";
import { api } from "../../convex/_generated/api";

/** Turns Web Push on/off for this browser, bound to whoever is signed in here. */
export function PushNotificationsToggle() {
  const { t, i18n } = useTranslation();
  const register = useMutation(api.push.registerPushSubscription);
  const remove = useMutation(api.push.removePushSubscription);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const supported = isPushSupported();

  const refresh = useCallback(async () => {
    if (!supported) return;
    setEnabled((await getCurrentPushSubscription()) !== null);
  }, [supported]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onToggle(next: boolean) {
    if (!supported || busy) return;
    setBusy(true);
    try {
      if (!next) {
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

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Body weight="bold">{enabled ? t("push.on") : t("push.off")}</Body>
        <Body size={13} color={T.muted}>
          {supported ? t("push.desc") : t("push.unsupported")}
        </Body>
      </View>
      {supported ? <Toggle value={enabled} onChange={(v) => void onToggle(v)} label={t("push.header")} /> : null}
    </View>
  );
}
