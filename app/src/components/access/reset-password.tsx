import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Body, Button, Field, Frame, Title } from "@/components/ui";
import { T } from "@/lib/theme";
import { normalizeResetCode, RESET_CODE_LENGTH } from "../../../convex/resetEmail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

type Step = "request" | "verify";

/** Convex Auth error → message key under access.reset.errors. */
function resetErrorKey(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("TooManyFailedAttempts")) return "access.reset.errors.tooMany";
  if (msg.includes("EMAIL_NOT_CONFIGURED") || msg.includes("EMAIL_SEND_FAILED")) return "access.reset.errors.mail";
  if (msg.includes("Invalid password")) return "access.reset.errors.password";
  if (msg.includes("code")) return "access.reset.errors.code";
  return "access.reset.errors.generic";
}

/**
 * "Esqueci minha senha": emails an 8-digit code, then sets a new password with it.
 * A successful reset signs the guardian in and ends their other sessions.
 */
export function ResetPassword({ initialEmail, onBack }: { initialEmail: string; onBack: () => void }) {
  const { t } = useTranslation();
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState(initialEmail.trim());
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"send" | "verify" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const cleanEmail = email.trim().toLowerCase();

  const sendCode = async () => {
    if (busy) return;
    if (!EMAIL_RE.test(cleanEmail)) {
      setError(t("access.auth.errors.email"));
      return;
    }
    setBusy("send");
    setError(null);
    setNotice(null);
    try {
      await signIn("password", { flow: "reset", email: cleanEmail });
      setStep("verify");
      setCode("");
      setNotice(t("access.reset.sent", { email: cleanEmail }));
    } catch (e) {
      setError(t(resetErrorKey(e)));
    } finally {
      setBusy(null);
    }
  };

  const confirm = async () => {
    if (busy) return;
    const digits = normalizeResetCode(code);
    if (digits.length !== RESET_CODE_LENGTH) {
      setError(t("access.reset.errors.codeLength", { n: RESET_CODE_LENGTH }));
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(t("access.auth.errors.password"));
      return;
    }
    setBusy("verify");
    setError(null);
    try {
      // On success the auth state flips and the gate moves on; nothing else to do here.
      await signIn("password", { flow: "reset-verification", email: cleanEmail, code: digits, newPassword: password });
    } catch (e) {
      setError(t(resetErrorKey(e)));
      setBusy(null);
    }
  };

  return (
    <Frame style={{ gap: 14 }}>
      <View style={{ gap: 2 }}>
        <Title size={19}>{t("access.reset.title")}</Title>
        <Body size={15} color={T.muted}>
          {step === "request" ? t("access.reset.requestHint") : t("access.reset.verifyHint")}
        </Body>
      </View>

      {step === "request" ? (
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
          onSubmitEditing={sendCode}
          returnKeyType="send"
        />
      ) : (
        <>
          {notice ? (
            <Body size={15} color={T.ok}>
              {notice}
            </Body>
          ) : null}
          <Field
            label={t("access.reset.code")}
            placeholder={t("access.reset.codePlaceholder")}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={RESET_CODE_LENGTH + 2}
          />
          <Field
            label={t("access.reset.newPassword")}
            placeholder={t("access.auth.passwordPlaceholder")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            onSubmitEditing={confirm}
            returnKeyType="go"
          />
        </>
      )}

      {error ? (
        <Body size={15} color={T.bad}>
          {error}
        </Body>
      ) : null}

      {step === "request" ? (
        <Button size="lg" label={t("access.reset.send")} onPress={sendCode} busy={busy === "send"} />
      ) : (
        <>
          <Button
            size="lg"
            label={t("access.reset.confirm")}
            onPress={confirm}
            busy={busy === "verify"}
            disabled={busy === "send"}
          />
          <Button
            variant="ghost"
            label={t("access.reset.resend")}
            onPress={sendCode}
            busy={busy === "send"}
            disabled={busy === "verify"}
          />
        </>
      )}

      <Button variant="ghost" icon="back" label={t("access.reset.back")} onPress={onBack} disabled={!!busy} />
    </Frame>
  );
}
