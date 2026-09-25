import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { AccessLayout } from "@/components/access/access-layout";
import { Body, Button, Field, Frame, Ornament, Segmented, Title } from "@/components/ui";
import { T } from "@/lib/theme";

type Flow = "signIn" | "signUp";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

/** Convex Auth error → friendly message key under access.auth.errors. */
function authErrorKey(e: unknown, flow: Flow): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("TooManyFailedAttempts")) return "access.auth.errors.tooMany";
  if (msg.includes("InvalidSecret")) return "access.auth.errors.wrongPassword";
  if (msg.includes("InvalidAccountId")) return "access.auth.errors.noAccount";
  if (msg.includes("already exists")) return "access.auth.errors.exists";
  if (msg.includes("Invalid password")) return "access.auth.errors.password";
  return flow === "signIn" ? "access.auth.errors.wrongPassword" : "access.auth.errors.generic";
}

/** Signed-out entry: guardians use email + password; a child's phone signs in anonymously to pair. */
export function AuthScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<Flow>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"password" | "anonymous" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (flow === "signUp" && !name.trim()) return "access.auth.errors.name";
    if (!EMAIL_RE.test(email.trim())) return "access.auth.errors.email";
    if (password.length < MIN_PASSWORD) return "access.auth.errors.password";
    return null;
  };

  const submit = async () => {
    if (busy) return;
    const invalid = validate();
    if (invalid) {
      setError(t(invalid));
      return;
    }
    setBusy("password");
    setError(null);
    try {
      await signIn("password", {
        email: email.trim().toLowerCase(),
        password,
        flow,
        ...(flow === "signUp" ? { name: name.trim() } : {}),
      });
    } catch (e) {
      setError(t(authErrorKey(e, flow)));
      setBusy(null);
    }
  };

  const pairAsAdventurer = async () => {
    if (busy) return;
    setBusy("anonymous");
    setError(null);
    try {
      await signIn("anonymous");
    } catch {
      setError(t("access.auth.errors.generic"));
      setBusy(null);
    }
  };

  const changeFlow = (next: Flow) => {
    setFlow(next);
    setError(null);
  };

  return (
    <AccessLayout>
      <Frame style={{ gap: 14 }}>
        <View style={{ gap: 2 }}>
          <Title size={19}>{t("access.auth.guardianTitle")}</Title>
          <Body size={15} color={T.muted}>
            {t("access.auth.guardianHint")}
          </Body>
        </View>
        <Segmented
          label={t("access.auth.modeLabel")}
          value={flow}
          onChange={changeFlow}
          options={[
            { value: "signIn", label: t("access.auth.signIn") },
            { value: "signUp", label: t("access.auth.signUp") },
          ]}
        />
        {flow === "signUp" ? (
          <Field
            label={t("access.auth.name")}
            placeholder={t("access.auth.namePlaceholder")}
            value={name}
            onChangeText={setName}
            autoComplete="name"
            textContentType="name"
            maxLength={24}
          />
        ) : null}
        <Field
          label={t("access.auth.email")}
          placeholder={t("access.auth.emailPlaceholder")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="username"
        />
        <Field
          label={t("access.auth.password")}
          placeholder={t("access.auth.passwordPlaceholder")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={flow === "signUp" ? "new-password" : "current-password"}
          textContentType={flow === "signUp" ? "newPassword" : "password"}
          onSubmitEditing={submit}
          returnKeyType="go"
        />
        {error ? (
          <Body size={15} color={T.bad}>
            {error}
          </Body>
        ) : null}
        <Button
          size="lg"
          label={flow === "signIn" ? t("access.auth.submitSignIn") : t("access.auth.submitSignUp")}
          onPress={submit}
          busy={busy === "password"}
          disabled={busy === "anonymous"}
        />
      </Frame>

      <Ornament title={t("access.auth.or")} />

      <View style={{ gap: 6, alignItems: "stretch" }}>
        <Button
          variant="ghost"
          icon="phone"
          label={t("access.auth.adventurer")}
          onPress={pairAsAdventurer}
          busy={busy === "anonymous"}
          disabled={busy === "password"}
        />
        <Body size={13} center color={T.faint}>
          {t("access.auth.adventurerHint")}
        </Body>
      </View>
    </AccessLayout>
  );
}
