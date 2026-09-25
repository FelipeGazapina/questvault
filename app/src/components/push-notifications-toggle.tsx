import { useTranslation } from "react-i18next";

import { Body } from "@/components/ui";
import { T } from "@/lib/theme";

/** Native builds: push goes through the native companion (not yet built). */
export function PushNotificationsToggle() {
  const { t } = useTranslation();
  return (
    <Body size={13} color={T.muted}>
      {t("push.unsupported")}
    </Body>
  );
}
