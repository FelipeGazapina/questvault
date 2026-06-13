import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTranslation } from "react-i18next";

import { BodyText, PixelButton, PixelPanel, PixelText, SegBar } from "@/components/pixel";
import { SUPPORTED_LANGUAGES, setLanguage } from "@/i18n";
import { FEATURES } from "@/lib/features";
import { C, FONT } from "@/lib/palette";
import { useUser } from "@/lib/user-context";
import { api } from "../../convex/_generated/api";
import { xpToNext } from "../../convex/game";

// Phase 1: only virtual reward tiers. The "real loot" tier returns with FEATURES.vault.
const TIERS = [
  { key: "xp", labelKey: "hero.tierXp", color: C.sky, descKey: "hero.tierXpDesc" },
  { key: "stickers", labelKey: "hero.tierStickers", color: C.mint, descKey: "hero.tierStickersDesc" },
] as const;

const AVATARS = [
  { name: "HERO", src: require("@/assets/sprites/hero.png") },
  { name: "KNIGHT", src: require("@/assets/sprites/hero-knight.png") },
  { name: "MAGE", src: require("@/assets/sprites/hero-mage.png") },
  { name: "ROGUE", src: require("@/assets/sprites/hero-rogue.png") },
];

export default function Hero() {
  const { t, i18n } = useTranslation();
  const user = useUser();
  const completions = useQuery(api.quests.recentCompletions, {});
  const setTier = useMutation(api.users.setTier);
  const setName = useMutation(api.users.setName);
  const { signOut } = useAuthActions();
  const [editingName, setEditingName] = useState("");

  if (!user) {
    return <SafeAreaView style={styles.screen} edges={["top"]} />;
  }

  const level = user.level ?? 1;
  const xp = user.xp ?? 0;
  const need = xpToNext(level);
  const totalQuests = completions?.length ?? 0;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <PixelText size={13} style={{ textAlign: "center", marginTop: 8 }}>
          {t("hero.title")}
        </PixelText>

        <View style={{ alignItems: "center", gap: 8 }}>
          <Image
            source={require("@/assets/sprites/hero.png")}
            style={{ width: 96, height: 96 }}
            contentFit="contain"
          />
          <PixelText size={12}>{`${user.name ?? "HERO"} · LV ${level}`}</PixelText>
          <BodyText size={18} color={C.sky}>{t("hero.xpToNext", { xp, need })}</BodyText>
          <View style={{ alignSelf: "stretch" }}>
            <SegBar ratio={xp / need} color={C.sky} cells={20} />
          </View>
        </View>

        <PixelPanel background={C.panelDark}>
          <PixelText size={8} color={C.slate}>
            {t("hero.name")}
          </PixelText>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              value={editingName}
              onChangeText={setEditingName}
              placeholder={user.name}
              placeholderTextColor={C.slate}
              maxLength={12}
              autoCapitalize="characters"
              style={[styles.input, { flex: 1 }]}
            />
            <PixelButton
              label={t("hero.set")}
              onPress={() => {
                if (editingName.trim()) setName({ name: editingName });
                setEditingName("");
              }}
              style={{ paddingVertical: 8 }}
            />
          </View>
        </PixelPanel>

        <PixelPanel background={C.panelDark}>
          <PixelText size={8} color={C.slate}>
            {t("hero.stats")}
          </PixelText>
          <View style={styles.statRow}>
            <BodyText size={18} color={C.fog}>{t("hero.streakLabel")}</BodyText>
            <BodyText size={18} color={C.ember}>{t("hero.streakDays", { count: user.streak ?? 0 })}</BodyText>
          </View>
          <View style={styles.statRow}>
            <BodyText size={18} color={C.fog}>{t("hero.recentQuests")}</BodyText>
            <BodyText size={18} color={C.mint}>{`${totalQuests}`}</BodyText>
          </View>
        </PixelPanel>

        <PixelPanel background={C.panelDark}>
          <PixelText size={8} color={C.slate}>
            {t("hero.tierHeader")}
          </PixelText>
          {TIERS.map((tier) => (
            <Pressable
              key={tier.key}
              onPress={() => setTier({ tier: tier.key })}
              style={[styles.tier, user.tier === tier.key && { borderColor: tier.color }]}
            >
              <PixelText size={9} color={tier.color}>
                {t(tier.labelKey)}
                {user.tier === tier.key ? "  ✓" : ""}
              </PixelText>
              <BodyText size={16} color={C.fog}>
                {t(tier.descKey)}
              </BodyText>
            </Pressable>
          ))}
        </PixelPanel>

        <PixelPanel background={C.panelDark}>
          <PixelText size={8} color={C.slate}>
            {t("hero.cosmetics")}
          </PixelText>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {AVATARS.map((a, i) => {
              const unlocked = i === 0 || level >= i * 5;
              return (
                <View key={a.name} style={[styles.avatarBox, { opacity: unlocked ? 1 : 0.4 }]}>
                  <Image source={a.src} style={{ width: 36, height: 36 }} contentFit="contain" />
                  <PixelText size={6} color={unlocked ? C.white : C.slate}>
                    {unlocked ? a.name : `LV ${i * 5}`}
                  </PixelText>
                </View>
              );
            })}
          </View>
        </PixelPanel>

        <PixelPanel background={C.panelDark}>
          <PixelText size={8} color={C.slate}>
            {t("hero.language")}
          </PixelText>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => void setLanguage(lang.code)}
                style={[styles.langChip, i18n.language === lang.code && { borderColor: C.gold }]}
              >
                <PixelText size={8} color={i18n.language === lang.code ? C.gold : C.slate}>
                  {lang.label}
                </PixelText>
              </Pressable>
            ))}
          </View>
        </PixelPanel>

        <Pressable onPress={() => void signOut()}>
          <BodyText size={17} color={C.slate} style={{ textAlign: "center" }}>
            {t("hero.signOut")}
          </BodyText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.night },
  content: { padding: 16, gap: 12 },
  input: {
    fontFamily: FONT.body,
    fontSize: 20,
    color: C.white,
    borderWidth: 2,
    borderColor: C.ink,
    backgroundColor: C.night,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statRow: { flexDirection: "row", justifyContent: "space-between" },
  tier: {
    borderWidth: 3,
    borderColor: C.ink,
    backgroundColor: C.navy,
    padding: 10,
    gap: 4,
  },
  avatarBox: {
    alignItems: "center",
    gap: 4,
    borderWidth: 2,
    borderColor: C.ink,
    padding: 8,
    backgroundColor: C.navy,
  },
  langChip: {
    borderWidth: 2,
    borderColor: C.ink,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: C.navy,
  },
});
