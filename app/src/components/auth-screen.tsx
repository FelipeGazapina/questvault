import { useAuthActions } from "@convex-dev/auth/react";
import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BodyText, PixelButton, PixelText } from "@/components/pixel";
import { C, FONT } from "@/lib/palette";

const AVATARS = [
  require("@/assets/sprites/hero.png"),
  require("@/assets/sprites/hero-knight.png"),
  require("@/assets/sprites/hero-mage.png"),
  require("@/assets/sprites/hero-rogue.png"),
];

// The lock forges piece by piece — one piece per rule. Complete lock = secure password.
const CRITERIA: { labelKey: string; test: (p: string) => boolean }[] = [
  { labelKey: "auth.critLength", test: (p) => p.length >= 8 },
  { labelKey: "auth.critLetter", test: (p) => /[a-zA-Z]/.test(p) },
  { labelKey: "auth.critNumber", test: (p) => /\d/.test(p) },
  { labelKey: "auth.critSymbol", test: (p) => /[^a-zA-Z0-9]/.test(p) || p.length >= 12 },
];

const EMAIL_RE = /^\S+@\S+\.\S+$/;

/** Pixel padlock that assembles as password criteria are met (body → left shackle → right shackle → keyhole). */
function PixelLock({ met }: { met: boolean[] }) {
  const { t } = useTranslation();
  const complete = met.every(Boolean);
  const pieces = useRef(met.map(() => new Animated.Value(0))).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const wasComplete = useRef(false);

  useEffect(() => {
    met.forEach((m, i) => {
      Animated.spring(pieces[i], {
        toValue: m ? 1 : 0,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();
    });
    if (complete && !wasComplete.current) {
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 110, useNativeDriver: true }),
        Animated.spring(pulse, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
    }
    wasComplete.current = complete;
  }, [met, complete, pieces, pulse]);

  const color = complete ? C.gold : C.slate;
  const piece = (i: number) => ({
    opacity: pieces[i],
    transform: [{ scale: pieces[i] }],
  });

  return (
    <View style={{ alignItems: "center", gap: 8 }}>
      <Animated.View style={{ width: 72, height: 80, transform: [{ scale: pulse }] }}>
        <Animated.View
          style={[styles.lockPiece, { left: 10, top: 8, width: 10, height: 32, backgroundColor: color }, piece(1)]}
        />
        <Animated.View
          style={[styles.lockPiece, { left: 10, top: 0, width: 52, height: 10, backgroundColor: color }, piece(2)]}
        />
        <Animated.View
          style={[styles.lockPiece, { left: 52, top: 8, width: 10, height: 32, backgroundColor: color }, piece(2)]}
        />
        <Animated.View
          style={[
            styles.lockPiece,
            { left: 0, top: 38, width: 72, height: 42, backgroundColor: color, borderWidth: 3, borderColor: C.ink },
            piece(0),
          ]}
        />
        <Animated.View
          style={[styles.lockPiece, { left: 31, top: 50, width: 10, height: 10, backgroundColor: C.ink }, piece(3)]}
        />
        <Animated.View
          style={[styles.lockPiece, { left: 33, top: 60, width: 6, height: 10, backgroundColor: C.ink }, piece(3)]}
        />
      </Animated.View>
      <PixelText size={8} color={complete ? C.gold : C.slate}>
        {complete
          ? t("auth.lockSecure")
          : t("auth.lockForging", { n: met.filter(Boolean).length, total: CRITERIA.length })}
      </PixelText>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure = false,
  email = false,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secure?: boolean;
  email?: boolean;
  editable?: boolean;
}) {
  return (
    <View style={{ gap: 5 }}>
      <PixelText size={8} color={C.slate}>
        {label}
      </PixelText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.slate}
        secureTextEntry={secure}
        autoCapitalize={email || secure ? "none" : "characters"}
        keyboardType={email ? "email-address" : "default"}
        autoCorrect={false}
        editable={editable}
        style={[styles.input, !editable && { opacity: 0.5 }]}
      />
    </View>
  );
}

export function AuthScreen() {
  const { signIn } = useAuthActions();
  const { t } = useTranslation();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;

  const signUp = mode === "signUp";
  const met = useMemo(() => CRITERIA.map((c) => c.test(password)), [password]);
  const lockComplete = met.every(Boolean);
  const emailValid = EMAIL_RE.test(email.trim());

  function showError(message: string) {
    setError(message);
    shake.setValue(0);
    Animated.sequence(
      [10, -8, 6, -4, 0].map((toValue) =>
        Animated.timing(shake, { toValue, duration: 55, useNativeDriver: true }),
      ),
    ).start();
  }

  // What still blocks sign-up — shown under the button instead of a dead, silent button.
  const blocker = !emailValid
    ? t("auth.blockerEmail")
    : signUp && !lockComplete
      ? t("auth.blockerLock")
      : null;
  const canSubmit = emailValid && password.length > 0 && (!signUp || lockComplete) && !busy;

  async function onSubmit() {
    if (!canSubmit) {
      if (blocker) showError(blocker);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await signIn("password", {
        email: email.trim().toLowerCase(),
        password,
        flow: signUp ? "signUp" : "signIn",
        ...(signUp ? { name: name.trim() || "HERO" } : {}),
      });
      // Success: the auth gate swaps this screen for the game — that transition is the confirmation.
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (signUp && /exist|already/i.test(msg)) {
        showError(t("auth.errExists"));
      } else if (signUp) {
        showError(t("auth.errGeneric"));
      } else {
        showError(t("auth.errWrong"));
      }
      setBusy(false);
    }
  }

  function switchMode() {
    setMode(signUp ? "signIn" : "signUp");
    setError(null);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.avatarRow}>
            {(signUp ? AVATARS : [AVATARS[0]]).map((src, i) => (
              <Image
                key={i}
                source={src}
                style={{ width: signUp ? 36 : 48, height: signUp ? 36 : 48 }}
                contentFit="contain"
              />
            ))}
          </View>

          {signUp ? (
            <PixelText size={14} style={{ textAlign: "center" }}>
              {t("auth.createHero")}
            </PixelText>
          ) : (
            <PixelText size={20} color={C.gold} style={{ textAlign: "center" }}>
              QUESTVAULT
            </PixelText>
          )}
          <BodyText size={18} color={C.fog} style={{ textAlign: "center" }}>
            {signUp ? t("auth.subSignUp") : t("auth.subSignIn")}
          </BodyText>

          <Animated.View style={{ gap: 12, marginTop: 16, transform: [{ translateX: shake }] }}>
            {signUp && (
              <Field
                label={t("auth.heroName")}
                value={name}
                onChangeText={setName}
                placeholder="LIPI"
                editable={!busy}
              />
            )}
            <Field
              label={t("auth.email")}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setError(null);
              }}
              placeholder="hero@mail.com"
              email
              editable={!busy}
            />
            <Field
              label={t("auth.password")}
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setError(null);
              }}
              placeholder={signUp ? t("auth.pwPlaceholderSignUp") : "********"}
              secure
              editable={!busy}
            />

            {signUp && (
              <View style={styles.lockPanel}>
                <PixelLock met={met} />
                <View style={{ gap: 3, flex: 1 }}>
                  {CRITERIA.map((c, i) => (
                    <BodyText key={c.labelKey} size={17} color={met[i] ? C.mint : C.slate}>
                      {(met[i] ? "■ " : "□ ") + t(c.labelKey)}
                    </BodyText>
                  ))}
                </View>
              </View>
            )}

            {error && (
              <View style={styles.errorPanel}>
                <BodyText size={17} color={C.ember} style={{ textAlign: "center" }}>
                  {error}
                </BodyText>
              </View>
            )}

            <PixelButton
              label={
                busy
                  ? signUp
                    ? t("auth.forging")
                    : t("auth.entering")
                  : signUp
                    ? t("auth.startRun")
                    : t("auth.signIn")
              }
              onPress={onSubmit}
              disabled={busy || (signUp && !lockComplete) || (!signUp && (!emailValid || !password))}
            />
            {!busy && blocker && !error && (
              <BodyText size={16} color={C.slate} style={{ textAlign: "center" }}>
                {blocker}
              </BodyText>
            )}
          </Animated.View>

          <Pressable onPress={switchMode} style={{ marginTop: 16 }} disabled={busy}>
            <PixelText size={8} color={C.ice} style={{ textAlign: "center" }}>
              {signUp ? t("auth.switchToSignIn") : t("auth.switchToSignUp")}
            </PixelText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.night },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 28,
    gap: 14,
  },
  avatarRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    alignItems: "flex-end",
  },
  input: {
    fontFamily: FONT.body,
    fontSize: 20,
    color: C.white,
    borderWidth: 3,
    borderColor: C.ink,
    backgroundColor: C.night,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  lockPiece: {
    position: "absolute",
  },
  lockPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: C.panelDark,
    borderWidth: 3,
    borderColor: C.ink,
    padding: 12,
  },
  errorPanel: {
    borderWidth: 3,
    borderColor: C.ember,
    backgroundColor: "#3a2020",
    padding: 10,
  },
});
