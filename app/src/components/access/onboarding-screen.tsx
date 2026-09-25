import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { AccessLayout } from "@/components/access/access-layout";
import { CrestPicker } from "@/components/access/crest-picker";
import { Body, Button, Field, Frame, Ornament, Title } from "@/components/ui";
import { errorKey } from "@/lib/family";
import { T, type Crest } from "@/lib/theme";
import { api } from "../../../convex/_generated/api";

/**
 * Guardian's first run: name the guardian (and optionally the family), plus an optional first
 * adventurer. createFamily must run first — addAdventurer needs the family. Once the family
 * exists the root gate swaps to the app on its own.
 */
export function OnboardingScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuthActions();
  const me = useQuery(api.family.me, {});
  const createFamily = useMutation(api.family.createFamily);
  const addAdventurer = useMutation(api.family.addAdventurer);

  const [guardianName, setGuardianName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [crest, setCrest] = useState<Crest>("teal");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill with the name given at sign-up (the password profile defaults to "Guardião").
  const suggested = me?.user.name ?? "";
  useEffect(() => {
    if (suggested && suggested !== "Guardião") setGuardianName((cur) => cur || suggested);
  }, [suggested]);

  const submit = async () => {
    if (busy) return;
    const age = childAge ? Number(childAge) : undefined;
    if (!guardianName.trim()) return setError(t("access.onboarding.errors.name"));
    if (age !== undefined && !(age >= 1 && age < 30)) return setError(t("access.onboarding.errors.age"));
    setBusy(true);
    setError(null);
    try {
      await createFamily({ guardianName: guardianName.trim(), familyName: familyName.trim() || undefined });
      // This screen unmounts as soon as `me` sees the family; the mutation still goes through.
      if (childName.trim()) await addAdventurer({ name: childName.trim(), age, crest });
    } catch (e) {
      setError(t(errorKey(e)));
      setBusy(false);
    }
  };

  return (
    <AccessLayout showTagline={false}>
      <Frame style={{ gap: 14 }}>
        <View style={{ gap: 2 }}>
          <Title size={20}>{t("access.onboarding.title")}</Title>
          <Body color={T.muted}>{t("access.onboarding.body")}</Body>
        </View>
        <Field
          label={t("access.onboarding.guardianName")}
          placeholder={t("access.onboarding.guardianNamePlaceholder")}
          value={guardianName}
          onChangeText={setGuardianName}
          maxLength={24}
          autoComplete="name"
        />
        <Field
          label={t("access.onboarding.familyName")}
          placeholder={t("access.onboarding.familyNamePlaceholder")}
          value={familyName}
          onChangeText={setFamilyName}
          maxLength={40}
        />
      </Frame>

      <Ornament title={t("access.onboarding.firstAdventurer")} />

      <Frame style={{ gap: 14 }}>
        <Body size={15} color={T.muted}>
          {t("access.onboarding.firstAdventurerHint")}
        </Body>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 3 }}>
            <Field
              label={t("access.onboarding.childName")}
              placeholder={t("access.onboarding.childNamePlaceholder")}
              value={childName}
              onChangeText={setChildName}
              maxLength={20}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label={t("access.onboarding.childAge")}
              value={childAge}
              onChangeText={(v) => setChildAge(v.replace(/\D/g, "").slice(0, 2))}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
        </View>
        <CrestPicker value={crest} onChange={setCrest} />
      </Frame>

      {error ? <Body color={T.bad}>{error}</Body> : null}
      <Button size="lg" label={t("access.onboarding.submit")} onPress={submit} busy={busy} />
      <Button variant="ghost" icon="logout" label={t("access.onboarding.signOut")} onPress={() => void signOut()} />
    </AccessLayout>
  );
}
