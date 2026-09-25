import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { ConfirmDialog } from "@/components/adventurer/modal-frame";
import { ItemRow, OrderRow, PackTile } from "@/components/adventurer/shop-rows";
import { Body, Button, Card, Empty, Frame, Loading, Num, Ornament, Screen, Sprite, Title } from "@/components/ui";
import { errorKey, useAdventurer } from "@/lib/family";
import { brl, formatMinutes, T } from "@/lib/theme";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { COIN_BLOCK } from "../../../convex/rules";

type Pending =
  | { kind: "item"; item: Doc<"shopItems"> }
  | { kind: "pack"; pack: Doc<"timePacks"> }
  | { kind: "exchange" };

/** Adventurer market: buy screen time packs and items with coins; trade coins for real money. */
export default function AdventurerShop() {
  const { t } = useTranslation();
  const adventurer = useAdventurer();
  const adventurerId = adventurer?._id;
  const market = useQuery(api.rewards.market, adventurerId ? { adventurerId } : "skip");
  const buyItem = useMutation(api.rewards.buyItem);
  const buyPack = useMutation(api.rewards.buyPack);
  const exchangeCoins = useMutation(api.rewards.exchangeCoins);

  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(id);
  }, [notice]);

  if (!adventurerId || market === undefined) return <Loading />;

  const blockMoney = brl(market.coinRateCents);

  const ask = (p: Pending) => {
    setError(null);
    setPending(p);
  };

  const confirmText = (p: Pending): string => {
    if (p.kind === "item") return t("adventurer.shop.confirmItem", { title: p.item.title, price: p.item.priceCoins });
    if (p.kind === "pack") return t("adventurer.shop.confirmPack", { minutes: formatMinutes(p.pack.minutes), price: p.pack.priceCoins });
    return t("adventurer.shop.confirmExchange", { coins: COIN_BLOCK, money: blockMoney });
  };

  const confirm = async () => {
    if (!pending || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (pending.kind === "item") {
        await buyItem({ adventurerId, itemId: pending.item._id });
        setNotice(t("adventurer.shop.boughtItem"));
      } else if (pending.kind === "pack") {
        await buyPack({ adventurerId, packId: pending.pack._id });
        setNotice(t("adventurer.shop.boughtPack", { minutes: formatMinutes(pending.pack.minutes) }));
      } else {
        await exchangeCoins({ adventurerId, blocks: 1 });
        setNotice(t("adventurer.shop.exchanged", { money: blockMoney }));
      }
      setPending(null);
    } catch (e) {
      setError(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scene="taverna">
      <View style={styles.header}>
        <Title size={23} center>
          {t("adventurer.shop.title")}
        </Title>
        <View style={styles.coins}>
          <Sprite name="coin" width={20} />
          <Num color={T.coin}>{t("adventurer.shop.coins", { count: market.coins })}</Num>
        </View>
      </View>

      {notice ? (
        <Card highlight={T.okLine}>
          <Body center color={T.ok} weight="bold">
            {notice}
          </Body>
        </Card>
      ) : null}

      <Ornament title={t("adventurer.shop.buyTime")} />
      {market.packs.length ? (
        <View style={styles.packs}>
          {market.packs.map((p) => (
            <PackTile key={p._id} pack={p} coins={market.coins} onBuy={() => ask({ kind: "pack", pack: p })} />
          ))}
        </View>
      ) : (
        <Empty sprite="hourglass" text={t("adventurer.shop.noPacks")} />
      )}

      <Ornament title={t("adventurer.shop.items")} />
      {market.items.length ? (
        <View style={{ gap: 8 }}>
          {market.items.map((item) => (
            <ItemRow key={item._id} item={item} coins={market.coins} onBuy={() => ask({ kind: "item", item })} />
          ))}
          <Body size={13} center color={T.faint}>
            {t("adventurer.shop.itemsNote")}
          </Body>
        </View>
      ) : (
        <Empty sprite="stall" text={t("adventurer.shop.noItems")} />
      )}

      {market.purchases.length ? (
        <>
          <Ornament title={t("adventurer.shop.orders")} />
          <View style={{ gap: 8 }}>
            {market.purchases.map((p) => (
              <OrderRow key={p._id} purchase={p} />
            ))}
          </View>
        </>
      ) : null}

      {market.allowanceEnabled ? (
        <>
          <Ornament title={t("adventurer.shop.vault")} />
          <Frame style={{ gap: 12 }}>
            <View style={styles.vaultRow}>
              <Sprite name="chestOpen" width={56} />
              <View style={{ flex: 1 }}>
                <Num size={24} color={T.coin}>
                  {brl(market.cofreCents)}
                </Num>
                <Body size={13} color={T.muted}>
                  {t("adventurer.shop.vaultSub")}
                </Body>
              </View>
            </View>
            <Card style={styles.rate}>
              <Num size={15} color={T.coin}>
                {t("adventurer.shop.coins", { count: COIN_BLOCK })}
              </Num>
              <Body size={15} weight="bold" color={T.faint}>
                {t("adventurer.shop.becomes")}
              </Body>
              <Num size={15} color={T.coin}>
                {blockMoney}
              </Num>
            </Card>
            <Button
              variant="ghost"
              label={t("adventurer.shop.exchange", { count: COIN_BLOCK })}
              disabled={market.coins < COIN_BLOCK}
              onPress={() => ask({ kind: "exchange" })}
            />
          </Frame>
        </>
      ) : null}

      <ConfirmDialog
        visible={pending !== null}
        title={pending ? confirmText(pending) : ""}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
        busy={busy}
        error={error}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", gap: 10, paddingTop: 20 },
  coins: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: T.coinLine,
    borderRadius: 999,
    backgroundColor: "rgba(227,179,65,0.08)",
  },
  packs: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  vaultRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  rate: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 10 },
});
