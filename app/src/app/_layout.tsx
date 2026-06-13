import "@/i18n";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { PressStart2P_400Regular, useFonts } from "@expo-google-fonts/press-start-2p";
import { VT323_400Regular } from "@expo-google-fonts/vt323";
import { Authenticated, AuthLoading, ConvexReactClient, Unauthenticated } from "convex/react";
import { Image } from "expo-image";
import { Tabs } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";

import { initStoredLanguage } from "@/i18n";
import { AuthScreen } from "@/components/auth-screen";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { FEATURES } from "@/lib/features";
import { C, FONT } from "@/lib/palette";
import { UserProvider } from "@/lib/user-context";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

const secureStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

function TabIcon({ source, active }: { source: number; active: boolean }) {
  return (
    <Image source={source} style={{ width: 22, height: 22, opacity: active ? 1 : 0.45 }} contentFit="contain" />
  );
}

function Splash() {
  return <View style={{ flex: 1, backgroundColor: C.night }} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ PressStart2P_400Regular, VT323_400Regular });
  const { t } = useTranslation();
  useEffect(() => {
    initStoredLanguage();
  }, []);
  if (!fontsLoaded) return <Splash />;

  return (
    <ConvexAuthProvider
      client={convex}
      storage={Platform.OS === "web" ? undefined : secureStorage}
    >
      <StatusBar style="light" />
      <PwaInstallPrompt />
      <AuthLoading>
        <Splash />
      </AuthLoading>
      <Unauthenticated>
        <AuthScreen />
      </Unauthenticated>
      <Authenticated>
        <UserProvider>
          <Tabs
            screenOptions={{
              headerShown: false,
              sceneStyle: { backgroundColor: C.night },
              tabBarStyle: {
                backgroundColor: C.panelDark,
                borderTopWidth: 3,
                borderTopColor: C.ink,
                height: 64,
              },
              tabBarActiveTintColor: C.gold,
              tabBarInactiveTintColor: C.slate,
              tabBarLabelStyle: { fontFamily: FONT.head, fontSize: 7 },
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: t("tabs.board"),
                tabBarIcon: ({ focused }) => (
                  <TabIcon source={require("@/assets/sprites/flame.png")} active={focused} />
                ),
              }}
            />
            <Tabs.Screen
              name="pool"
              options={{
                title: t("tabs.pool"),
                tabBarIcon: ({ focused }) => (
                  <TabIcon source={require("@/assets/sprites/hero-knight.png")} active={focused} />
                ),
              }}
            />
            <Tabs.Screen
              name="vault"
              options={{
                // Phase 1: the vault is money-shaped, so it stays hidden (FEATURES.vault).
                href: FEATURES.vault ? "/vault" : null,
                title: t("tabs.vault"),
                tabBarIcon: ({ focused }) => (
                  <TabIcon source={require("@/assets/sprites/chest.png")} active={focused} />
                ),
              }}
            />
            <Tabs.Screen
              name="shop"
              options={{
                title: t("tabs.shop"),
                tabBarIcon: ({ focused }) => (
                  <TabIcon source={require("@/assets/sprites/coin.png")} active={focused} />
                ),
              }}
            />
            <Tabs.Screen
              name="stats"
              options={{
                title: t("tabs.log"),
                tabBarIcon: ({ focused }) => (
                  <TabIcon source={require("@/assets/sprites/chest-open.png")} active={focused} />
                ),
              }}
            />
            <Tabs.Screen
              name="hero"
              options={{
                title: t("tabs.hero"),
                tabBarIcon: ({ focused }) => (
                  <TabIcon source={require("@/assets/sprites/hero.png")} active={focused} />
                ),
              }}
            />
          </Tabs>
        </UserProvider>
      </Authenticated>
    </ConvexAuthProvider>
  );
}
