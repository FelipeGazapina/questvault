import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Hud } from "@/components/hud";
import { BodyText, ConfirmModal, MoneyText, PixelButton, PixelPanel, PixelText } from "@/components/pixel";
import { FEATURES } from "@/lib/features";
import { brl, C } from "@/lib/palette";
import { useUser } from "@/lib/user-context";
import { api } from "../../convex/_generated/api";

const FEATURES_VAULT_ENABLED = FEATURES.vault;

const STASH_OPTIONS = [2000, 5000, 10000];

const LEDGER_COLORS: Record<string, string> = {
  deposit: C.mint,
  convert: C.gold,
  redeem: C.ember,
  withdraw: C.ember,
};

const LEDGER_SIGN: Record<string, string> = {
  deposit: "+ ",
  convert: "",
  redeem: "− ",
  withdraw: "− ",
};

export default function Vault() {
  const user = useUser();
  const ledger = useQuery(api.vault.ledgerList, {});
  const deposit = useMutation(api.vault.deposit);
  const withdrawAll = useMutation(api.vault.withdrawAll);
  const joinWaitlist = useMutation(api.users.joinWaitlist);
  const [stash, setStash] = useState(5000);
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);

  // Phase 1: vault hidden (FEATURES.vault) — guard against deep links too.
  if (!FEATURES_VAULT_ENABLED) {
    return <SafeAreaView style={styles.screen} edges={["top"]} />;
  }

  async function onStash() {
    await deposit({ amountCents: stash });
  }

  async function onConfirmWithdraw() {
    setConfirmingWithdraw(false);
    try {
      await withdrawAll({});
    } catch (e) {
      Alert.alert("Vault", e instanceof Error ? e.message : "Could not withdraw");
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Hud />
        <PixelText size={13} style={{ textAlign: "center", marginTop: 8 }}>
          THE VAULT
        </PixelText>

        <View style={{ alignItems: "center", gap: 6 }}>
          <Image
            source={require("@/assets/sprites/chest.png")}
            style={{ width: 128, height: 104 }}
            contentFit="contain"
          />
          <PixelText size={8} color={C.fog}>
            SEALED — UNLOCK BY QUESTING
          </PixelText>
          <MoneyText size={24} color={C.gold}>
            {brl(user?.lockedGold ?? 0)}
          </MoneyText>
          <PixelText size={8} color={C.fog} style={{ marginTop: 6 }}>
            GOLD POUCH — READY TO SPEND
          </PixelText>
          <MoneyText size={17} color={C.ice}>
            {brl(user?.spendableGold ?? 0)}
          </MoneyText>
        </View>

        <PixelPanel background={C.panelDark}>
          <PixelText size={8} color={C.slate}>
            STASH PLAY-GOLD (PHASE 1 — NOT REAL MONEY)
          </PixelText>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {STASH_OPTIONS.map((cents) => (
              <Pressable
                key={cents}
                onPress={() => setStash(cents)}
                style={[styles.chip, stash === cents && { borderColor: C.gold, backgroundColor: C.ink }]}
              >
                <MoneyText size={13} color={stash === cents ? C.gold : C.slate}>
                  {brl(cents)}
                </MoneyText>
              </Pressable>
            ))}
          </View>
          <PixelButton label="+ STASH GOLD" onPress={onStash} />
        </PixelPanel>

        {user && !user.waitlist ? (
          <PixelPanel borderColor={C.gold} background="#3a2f4a">
            <PixelText size={9} color={C.gold}>
              REAL GOLD IS COMING
            </PixelText>
            <BodyText size={17} color={C.fog}>
              Phase 2 will let you stash real money via Pix and unlock it with quests. Want in first?
            </BodyText>
            <PixelButton
              label="JOIN THE WAITLIST"
              color={C.gold}
              textColor="#4a3208"
              onPress={() => joinWaitlist({})}
            />
          </PixelPanel>
        ) : user?.waitlist ? (
          <BodyText size={16} color={C.mint} style={{ textAlign: "center" }}>
            You are on the real-gold waitlist ✓
          </BodyText>
        ) : null}

        <PixelPanel background={C.panelDark}>
          <PixelText size={8} color={C.slate}>
            LEDGER — EVERY COIN, TRACEABLE
          </PixelText>
          {(ledger ?? []).length === 0 && (
            <BodyText size={17} color={C.slate}>
              Nothing yet. Stash some gold and complete a quest.
            </BodyText>
          )}
          {(ledger ?? []).map((e) => (
            <View key={e._id} style={styles.ledgerRow}>
              <MoneyText size={12} color={C.fog} style={{ fontWeight: "400", flex: 1 }}>
                {e.description}
              </MoneyText>
              <MoneyText size={12} color={LEDGER_COLORS[e.entryType] ?? C.white}>
                {`${LEDGER_SIGN[e.entryType] ?? ""}${brl(e.amountCents)}${e.entryType === "convert" ? " unlocked" : ""}`}
              </MoneyText>
            </View>
          ))}
        </PixelPanel>

        <Pressable onPress={() => setConfirmingWithdraw(true)}>
          <BodyText size={17} color={C.slate} style={{ textAlign: "center" }}>
            Need your gold back? Leave the dungeon — always 100%, always free.
          </BodyText>
        </Pressable>
      </ScrollView>

      <ConfirmModal
        visible={confirmingWithdraw}
        title="LEAVE THE DUNGEON?"
        confirmLabel="WITHDRAW ALL"
        lines={[
          { label: "Total withdrawal", value: brl((user?.lockedGold ?? 0) + (user?.spendableGold ?? 0)), strong: true },
          { label: "Fees", value: "R$ 0,00 — always" },
          { label: "Streak and quests", value: "kept" },
        ]}
        onConfirm={onConfirmWithdraw}
        onCancel={() => setConfirmingWithdraw(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.night },
  content: { padding: 16, gap: 12 },
  chip: {
    borderWidth: 2,
    borderColor: C.ink,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  ledgerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 3,
  },
});
