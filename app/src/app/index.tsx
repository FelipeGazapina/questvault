import { useAuthActions } from "@convex-dev/auth/react";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { AccessLayout } from "@/components/access/access-layout";
import { PinPrompt } from "@/components/access/pin-prompt";
import { ProfileRow } from "@/components/access/profile-row";
import { Icon } from "@/components/icons";
import { Body, Button, Chip, Empty, Loading, Ornament } from "@/components/ui";
import { CREST_SPRITE } from "@/lib/art";
import { useProfile } from "@/lib/family";
import { formatMinutes, T } from "@/lib/theme";
import type { Id } from "../../convex/_generated/dataModel";

/** Where to go after the guardian PIN check. */
type GuardianTarget = "/guardiao" | "/guardiao/ajustes";

/** "Quem está jogando?" — the shared-phone profile chooser. */
export default function ProfileChooser() {
  const { t } = useTranslation();
  const router = useRouter();
  const { me, active, ready, enterGuardian, enterAdventurer } = useProfile();
  const [pinFor, setPinFor] = useState<GuardianTarget | null>(null);

  if (!ready || !me || !me.family) return <Loading />;
  // A paired phone whose adventurer was removed has nowhere to go: offer to start over.
  if (me.user.role === "adventurer" && !active) return <Unlinked />;
  if (me.user.role === "adventurer" || (active && active !== "guardian")) return <Redirect href="/aventureiro" />;
  if (active === "guardian") return <Redirect href="/guardiao" />;

  const hasPin = me.family.hasPin;

  const goGuardian = (target: GuardianTarget) => {
    enterGuardian();
    router.replace(target as never);
  };
  const askGuardian = (target: GuardianTarget) => (hasPin ? setPinFor(target) : goGuardian(target));
  const playAs = (id: Id<"adventurers">) => {
    enterAdventurer(id);
    router.replace("/aventureiro");
  };

  return (
    <AccessLayout>
      <Ornament title={t("access.chooser.title")} />

      <View style={{ gap: 10 }}>
        <ProfileRow
          banner="bannerRed"
          name={me.user.name || t("access.chooser.guardian")}
          accessibilityLabel={t("access.chooser.enterAs", { name: me.user.name || t("access.chooser.guardian") })}
          onPress={() => askGuardian("/guardiao")}
          details={
            <Body size={14} color={T.muted}>
              {hasPin ? t("access.chooser.guardianPin") : t("access.chooser.guardian")}
            </Body>
          }
        />
        {pinFor ? (
          <View style={styles.pinBox}>
            <PinPrompt onSuccess={() => goGuardian(pinFor)} onCancel={() => setPinFor(null)} />
          </View>
        ) : null}

        {me.adventurers.map((a) => (
          <ProfileRow
            key={a._id}
            banner={CREST_SPRITE[a.crest]}
            name={a.name}
            accessibilityLabel={t("access.chooser.enterAs", { name: a.name })}
            onPress={() => playAs(a._id)}
            details={
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                <Chip kind="coin" label={String(a.coins)} />
                <Chip kind="time" label={formatMinutes(a.timeBankMin)} />
              </View>
            }
            trailing={
              <Body size={13} color={T.muted}>
                {t("access.chooser.level", { level: a.level })}
              </Body>
            }
          />
        ))}

        <Pressable
          accessibilityRole="button"
          onPress={() => askGuardian("/guardiao/ajustes")}
          style={({ pressed }) => [styles.add, pressed && { opacity: 0.8 }]}
        >
          <Icon name="plus" color={T.brass} />
          <Body weight="bold" size={15} color={T.brass}>
            {t("access.chooser.add")}
          </Body>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerTitle}>
          <Icon name="phone" color={T.brassHi} />
          <Body weight="bold" size={15} color={T.brassHi}>
            {t("access.chooser.pairTitle")}
          </Body>
        </View>
        <Body size={13} center color={T.faint}>
          {t("access.chooser.pairHint")}
        </Body>
      </View>
    </AccessLayout>
  );
}

function Unlinked() {
  const { t } = useTranslation();
  const { signOut } = useAuthActions();
  return (
    <AccessLayout>
      <Empty sprite="padlock" text={t("access.chooser.unlinked")} />
      <Button label={t("access.pair.startOver")} onPress={() => void signOut()} />
    </AccessLayout>
  );
}

const styles = StyleSheet.create({
  pinBox: {
    padding: 14,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.lineSoft,
    borderRadius: 6,
  },
  add: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: T.line,
    borderRadius: 6,
  },
  footer: { alignItems: "center", gap: 4, paddingHorizontal: 8 },
  footerTitle: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 32 },
});
