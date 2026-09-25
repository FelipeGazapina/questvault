import "@/i18n";

import {
  AlegreyaSans_400Regular,
  AlegreyaSans_400Regular_Italic,
  AlegreyaSans_500Medium,
  AlegreyaSans_700Bold,
  AlegreyaSans_800ExtraBold,
} from "@expo-google-fonts/alegreya-sans";
import { Cinzel_600SemiBold, Cinzel_700Bold, useFonts } from "@expo-google-fonts/cinzel";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { Authenticated, AuthLoading, ConvexReactClient, Unauthenticated, useQuery } from "convex/react";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";

import { AuthScreen } from "@/components/access/auth-screen";
import { OnboardingScreen } from "@/components/access/onboarding-screen";
import { PairScreen } from "@/components/access/pair-screen";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { Loading } from "@/components/ui";
import { initStoredLanguage } from "@/i18n";
import { ProfileProvider } from "@/lib/family";
import { T } from "@/lib/theme";
import { api } from "../../convex/_generated/api";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

const secureStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

/** Signed in: create a family (guardian), pair a phone (child), or enter the app. */
function FamilyGate() {
  const me = useQuery(api.family.me, {});
  if (me === undefined) return <Loading />;
  if (!me.family) return me.user.isAnonymous ? <PairScreen /> : <OnboardingScreen />;
  return (
    <ProfileProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: T.bg } }} />
    </ProfileProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Cinzel_600SemiBold,
    Cinzel_700Bold,
    AlegreyaSans_400Regular,
    AlegreyaSans_400Regular_Italic,
    AlegreyaSans_500Medium,
    AlegreyaSans_700Bold,
    AlegreyaSans_800ExtraBold,
  });
  useEffect(() => {
    initStoredLanguage();
  }, []);
  if (!fontsLoaded) return <Loading />;

  return (
    <ConvexAuthProvider client={convex} storage={Platform.OS === "web" ? undefined : secureStorage}>
      <StatusBar style="light" />
      <PwaInstallPrompt />
      <AuthLoading>
        <Loading />
      </AuthLoading>
      <Unauthenticated>
        <AuthScreen />
      </Unauthenticated>
      <Authenticated>
        <FamilyGate />
      </Authenticated>
    </ConvexAuthProvider>
  );
}
