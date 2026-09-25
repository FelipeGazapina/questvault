import { useMutation } from "convex/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Body, Button, Field } from "@/components/ui";
import { errorKey } from "@/lib/family";
import { T } from "@/lib/theme";
import { api } from "../../../convex/_generated/api";

/**
 * Inline guardian PIN check (family.verifyPin). Used before entering the guardian area on a
 * shared phone and before leaving a child's profile.
 */
export function PinPrompt({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const { t } = useTranslation();
  const verifyPin = useMutation(api.family.verifyPin);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (pin.length < 4 || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (await verifyPin({ pin })) onSuccess();
      else {
        setError(t("access.pin.wrong"));
        setPin("");
      }
    } catch (e) {
      setError(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <Field
        label={t("access.pin.label")}
        placeholder={t("access.pin.placeholder")}
        value={pin}
        onChangeText={(v) => setPin(v.replace(/\D/g, "").slice(0, 6))}
        keyboardType="number-pad"
        secureTextEntry
        autoFocus
        maxLength={6}
        onSubmitEditing={submit}
        returnKeyType="go"
        style={{ fontSize: 22, letterSpacing: 8, textAlign: "center" }}
      />
      {error ? (
        <Body size={14} color={T.bad} style={{ textAlign: "center" }}>
          {error}
        </Body>
      ) : null}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button label={t("actions.cancel")} variant="ghost" onPress={onCancel} style={{ flex: 1 }} />
        <Button label={t("access.pin.submit")} onPress={submit} busy={busy} disabled={pin.length < 4} style={{ flex: 1 }} />
      </View>
    </View>
  );
}
