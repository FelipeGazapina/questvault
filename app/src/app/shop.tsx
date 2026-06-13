import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Hud } from "@/components/hud";
import { BodyText, ConfirmModal, MoneyText, PixelButton, PixelPanel, PixelText, SegBar } from "@/components/pixel";
import { FEATURES } from "@/lib/features";
import {
  DEFAULT_LOOT_ICON,
  LOOT_ICONS,
  lootIconSource,
  resolveLootIconId,
  type LootIconId,
} from "@/lib/loot-icons";
import { brl, C, FONT } from "@/lib/palette";
import { useUser } from "@/lib/user-context";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export default function LootShop() {
  const { t } = useTranslation();
  const user = useUser();
  const items = useQuery(api.shop.list, {});
  const addItem = useMutation(api.shop.add);
  const removeItem = useMutation(api.shop.remove);
  const redeem = useMutation(api.shop.redeem);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [url, setUrl] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<LootIconId>(DEFAULT_LOOT_ICON);
  const [pendingClaim, setPendingClaim] = useState<{
    itemId: Id<"wishlist">;
    title: string;
    priceCents: number;
    url?: string;
  } | null>(null);

  const spendable = user?.spendableGold ?? 0;

  // R4: explicit confirmation showing amount and balance after, before any redemption.
  async function onConfirmClaim() {
    if (!pendingClaim) return;
    const { itemId, url: link } = pendingClaim;
    setPendingClaim(null);
    try {
      await redeem({ itemId });
      if (link) await Linking.openURL(link);
    } catch (e) {
      Alert.alert(t("shop.alertTitle"), e instanceof Error ? e.message : t("board.alertFailed"));
    }
  }

  async function onAdd() {
    const cents = Math.round(parseFloat(price.replace(",", ".")) * 100);
    if (!title.trim() || !Number.isFinite(cents) || cents <= 0) {
      Alert.alert(t("shop.alertTitle"), t("shop.invalidItem"));
      return;
    }
    await addItem({ title, priceCents: cents, url: url.trim() || undefined, iconId: selectedIcon });
    setTitle("");
    setPrice("");
    setUrl("");
    setSelectedIcon(DEFAULT_LOOT_ICON);
  }

  const active = (items ?? []).filter((i) => !i.redeemedAt);
  const claimed = (items ?? []).filter((i) => i.redeemedAt);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Hud />
        <PixelText size={13} style={{ textAlign: "center", marginTop: 8 }}>
          {t("shop.title")}
        </PixelText>

        {active.length === 0 && (
          <BodyText size={18} color={C.slate} style={{ textAlign: "center" }}>
            {t("shop.empty")}
          </BodyText>
        )}

        {active.map((item) => {
          const ready = FEATURES.vault && spendable >= item.priceCents;
          const iconId = resolveLootIconId(item.iconId);
          return (
            <PixelPanel key={item._id} borderColor={ready ? C.gold : C.ink} background={C.navy}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={styles.itemIconFrame}>
                  <Image
                    source={lootIconSource(iconId)}
                    style={styles.itemIcon}
                    contentFit="contain"
                  />
                </View>
                {item.imageUrl && (
                  <Image source={{ uri: item.imageUrl }} style={styles.itemImage} contentFit="cover" />
                )}
                <BodyText size={21} style={{ flex: 1 }}>
                  {item.title}
                </BodyText>
                <MoneyText size={13} color={C.gold}>
                  {brl(item.priceCents)}
                </MoneyText>
              </View>

              {/* Phase 2 (FEATURES.vault): progress vs the gold pouch and the claim flow. */}
              {FEATURES.vault && (
                <>
                  <BodyText size={16} color={C.fog}>
                    {ready
                      ? "Pouch covers it — you earned this one."
                      : `${brl(spendable)} / ${brl(item.priceCents)}`}
                  </BodyText>
                  <SegBar ratio={spendable / item.priceCents} color={C.gold} cells={20} />
                  {ready && (
                    <PixelButton
                      label="CLAIM LOOT"
                      color={C.gold}
                      textColor="#4a3208"
                      onPress={() =>
                        setPendingClaim({
                          itemId: item._id,
                          title: item.title,
                          priceCents: item.priceCents,
                          url: item.url,
                        })
                      }
                    />
                  )}
                </>
              )}

              {item.url && (
                <PixelButton
                  label={t("shop.openLink")}
                  ghost
                  onPress={() => item.url && Linking.openURL(item.url)}
                />
              )}
              <Pressable onPress={() => removeItem({ itemId: item._id })}>
                <BodyText size={14} color={C.slate} style={{ textAlign: "center" }}>
                  {t("shop.removeItem")}
                </BodyText>
              </Pressable>
            </PixelPanel>
          );
        })}

        <PixelPanel background={C.panelDark}>
          <PixelText size={8} color={C.slate}>
            {t("shop.addHeader")}
          </PixelText>
          <PixelText size={7} color={C.fog} style={{ marginTop: 4 }}>
            {t("shop.pickIcon")}
          </PixelText>
          <View style={styles.iconPicker}>
            {LOOT_ICONS.map(({ id, labelKey }) => {
              const active = selectedIcon === id;
              return (
                <Pressable
                  key={id}
                  accessibilityLabel={t(labelKey)}
                  onPress={() => setSelectedIcon(id)}
                  style={[styles.iconChip, active && styles.iconChipActive]}
                >
                  <Image source={lootIconSource(id)} style={styles.iconChipImage} contentFit="contain" />
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("shop.titlePlaceholder")}
            placeholderTextColor={C.slate}
            style={styles.input}
          />
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder={t("shop.pricePlaceholder")}
            placeholderTextColor={C.slate}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder={t("shop.linkPlaceholder")}
            placeholderTextColor={C.slate}
            autoCapitalize="none"
            style={styles.input}
          />
          <PixelButton label={t("shop.addButton")} onPress={onAdd} disabled={!title.trim() || !price.trim()} />
        </PixelPanel>

        {FEATURES.vault && claimed.length > 0 && (
          <PixelPanel background={C.panelDark}>
            <PixelText size={8} color={C.slate}>
              CLAIMED LOOT
            </PixelText>
            {claimed.map((item) => (
              <View key={item._id} style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <BodyText size={17} color={C.mint} style={{ flex: 1 }}>
                  {item.title}
                </BodyText>
                <MoneyText size={12} color={C.fog}>
                  {brl(item.priceCents)}
                </MoneyText>
              </View>
            ))}
          </PixelPanel>
        )}
      </ScrollView>

      <ConfirmModal
        visible={pendingClaim !== null}
        title="CLAIM LOOT?"
        lines={
          pendingClaim
            ? [
                { label: "Item", value: pendingClaim.title },
                { label: "Amount", value: brl(pendingClaim.priceCents), strong: true },
                { label: "Pouch after", value: brl(spendable - pendingClaim.priceCents) },
              ]
            : []
        }
        onConfirm={onConfirmClaim}
        onCancel={() => setPendingClaim(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.night },
  content: { padding: 16, gap: 12 },
  itemIconFrame: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: C.ink,
    backgroundColor: C.deep,
    alignItems: "center",
    justifyContent: "center",
  },
  itemIcon: { width: 36, height: 36 },
  itemImage: { width: 44, height: 44, borderWidth: 2, borderColor: C.ink },
  iconPicker: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4, marginBottom: 4 },
  iconChip: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: C.ink,
    backgroundColor: C.night,
    alignItems: "center",
    justifyContent: "center",
  },
  iconChipActive: { borderColor: C.gold, backgroundColor: C.ink },
  iconChipImage: { width: 36, height: 36 },
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
});
