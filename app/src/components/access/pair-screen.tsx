import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { AccessLayout } from "@/components/access/access-layout";
import { Body, Button, Field, Frame, Sprite, Title } from "@/components/ui";
import { errorKey } from "@/lib/family";
import { T } from "@/lib/theme";
import { api } from "../../../convex/_generated/api";

const CODE_LENGTH = 6;

/**
 * A child's phone after the anonymous sign-in: type the guardian's 6-digit code to bind this
 * device to a profile. On success `family.me` updates and the root gate swaps to the app.
 */
export function PairScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuthActions();
  const claim = useMutation(api.family.claimPairingCode);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const submit = async () => {
    if (code.length !== CODE_LENGTH || busy || locked) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await claim({ code });
      if (!ok) {
        setError(t("access.pair.invalid"));
        setCode("");
      }
    } catch (e) {
      const key = errorKey(e);
      if (key === "errors.TOO_MANY_ATTEMPTS") setLocked(true);
      setError(t(key));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AccessLayout showTagline={false}>
      <Frame style={{ gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Sprite name="gate" width={44} />
          <Title size={19} style={{ flex: 1 }}>
            {t("access.pair.title")}
          </Title>
        </View>
        <Body color={T.soft}>{t("access.pair.body")}</Body>
        <Field
          label={t("access.pair.code")}
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, CODE_LENGTH))}
          keyboardType="number-pad"
          inputMode="numeric"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={CODE_LENGTH}
          placeholder="000000"
          editable={!locked}
          onSubmitEditing={submit}
          returnKeyType="go"
          style={{ fontSize: 30, letterSpacing: 10, textAlign: "center", minHeight: 60 }}
        />
        {error ? <Body color={T.bad}>{error}</Body> : null}
        {locked ? (
          <Button size="lg" label={t("access.pair.startOver")} onPress={() => void signOut()} />
        ) : (
          <Button
            size="lg"
            label={t("access.pair.submit")}
            onPress={submit}
            busy={busy}
            disabled={code.length !== CODE_LENGTH}
          />
        )}
      </Frame>
      {locked ? null : (
        <Button variant="ghost" icon="back" label={t("access.pair.back")} onPress={() => void signOut()} />
      )}
    </AccessLayout>
  );
}
