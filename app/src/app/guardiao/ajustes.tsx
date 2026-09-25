import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { AddAdventurer, AdventurerAdmin, PinCard } from "@/components/guardian/family-admin";
import { PageHeader, useBusy, useGoBack } from "@/components/guardian/kit";
import { PushNotificationsToggle } from "@/components/push-notifications-toggle";
import { Body, Button, Card, Loading, Ornament, Screen, Segmented } from "@/components/ui";
import { setLanguage, SUPPORTED_LANGUAGES, type LanguageCode } from "@/i18n";
import { useProfile } from "@/lib/family";
import { T } from "@/lib/theme";

/** Ajustes: adventurers (add, edit, pair a phone, archive), PIN, language, notifications, account. */
export default function Settings() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const goBack = useGoBack("/guardiao");
  const { me, leaveProfile } = useProfile();
  const { signOut } = useAuthActions();
  const { busy, run } = useBusy();

  if (!me?.family) return <Loading />;
  const lang = (i18n.language === "en" ? "en" : "pt") as LanguageCode;

  return (
    <Screen scene="castelo">
      <PageHeader onBack={goBack} sprite="helm" spriteWidth={36} title={t("guardian.settings.title")} subtitle={me.family.name} />

      <Ornament title={t("guardian.settings.adventurers").toUpperCase()} />
      {me.adventurers.map((a) => (
        <AdventurerAdmin key={a._id} a={a} />
      ))}
      <AddAdventurer />

      <Ornament title={t("guardian.settings.pin").toUpperCase()} />
      <PinCard hasPin={me.family.hasPin} />

      <Ornament title={t("guardian.settings.language").toUpperCase()} />
      <Segmented<LanguageCode>
        label={t("guardian.settings.language")}
        value={lang}
        onChange={(code) => void setLanguage(code)}
        options={SUPPORTED_LANGUAGES.map((l) => ({ value: l.code, label: l.label }))}
      />

      <Ornament title={t("guardian.settings.notices").toUpperCase()} />
      <Card style={{ paddingVertical: 4, paddingHorizontal: 14, gap: 4 }}>
        <PushNotificationsToggle />
      </Card>
      <Button label={t("guardian.settings.noticePrefs")} variant="ghost" icon="chevron" onPress={() => router.push("/guardiao/avisos" as never)} />

      <Ornament title={t("guardian.settings.account").toUpperCase()} />
      <View style={{ gap: 10 }}>
        <Button
          label={t("guardian.settings.switchProfile")}
          variant="ghost"
          onPress={() => {
            leaveProfile();
            router.replace("/" as never);
          }}
        />
        <Button
          label={t("guardian.settings.signOut")}
          variant="danger"
          icon="logout"
          busy={busy}
          onPress={() =>
            void run(async () => {
              leaveProfile();
              await signOut();
            })
          }
        />
        <Body size={12} color={T.faint} center>
          {me.user.name}
        </Body>
      </View>
    </Screen>
  );
}
