import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { Bar, Body, Button, Card, Num, Seal, Slot, Sprite } from "@/components/ui";
import { formatMinutes, T } from "@/lib/theme";
import type { Doc } from "../../../convex/_generated/dataModel";

/** Coin price with the coin sprite ("● 80"). */
export function Price({ coins }: { coins: number }) {
  const { t } = useTranslation();
  return (
    <View style={styles.price} accessible accessibilityLabel={t("adventurer.shop.priceA11y", { count: coins })}>
      <Sprite name="coin" width={15} />
      <Num size={15} color={T.coin}>
        {coins}
      </Num>
    </View>
  );
}

/** One time pack tile: "15 min" and a brass button with its price. */
export function PackTile({ pack, coins, onBuy }: { pack: Doc<"timePacks">; coins: number; onBuy: () => void }) {
  const { t } = useTranslation();
  const minutes = formatMinutes(pack.minutes);
  return (
    <Card style={styles.pack}>
      <Sprite name="hourglass" width={27} />
      <Num size={17} color={T.time}>
        {minutes}
      </Num>
      <Button
        label={String(pack.priceCoins)}
        sprite="coin"
        onPress={onBuy}
        disabled={coins < pack.priceCoins}
        accessibilityLabel={t("adventurer.shop.buyPackA11y", { minutes, price: pack.priceCoins })}
        style={{ alignSelf: "stretch", paddingHorizontal: 6 }}
      />
    </Card>
  );
}

/** A market item; when unaffordable the button says how many coins are missing and a bar shows progress. */
export function ItemRow({ item, coins, onBuy }: { item: Doc<"shopItems">; coins: number; onBuy: () => void }) {
  const { t } = useTranslation();
  const missing = item.priceCoins - coins;
  return (
    <Card style={{ gap: 8 }}>
      <View style={styles.row}>
        <Slot size={48}>
          <Sprite name="chest" width={36} />
        </Slot>
        <View style={{ flex: 1, gap: 3 }}>
          <Body weight="bold">{item.title}</Body>
          <Price coins={item.priceCoins} />
        </View>
        <Button
          label={missing > 0 ? t("adventurer.shop.missing", { count: missing }) : t("adventurer.shop.buy")}
          onPress={onBuy}
          disabled={missing > 0}
        />
      </View>
      {missing > 0 ? <Bar ratio={coins / item.priceCoins} color={T.coin} /> : null}
    </Card>
  );
}

/** A purchase waiting for (or already given by) the guardian. */
export function OrderRow({ purchase }: { purchase: Doc<"purchases"> }) {
  const { t } = useTranslation();
  const delivered = purchase.status === "delivered";
  return (
    <Card style={[styles.row, delivered && { opacity: 0.75 }]}>
      <Sprite name={delivered ? "chestOpen" : "chest"} width={30} />
      <View style={{ flex: 1, gap: 2 }}>
        <Body weight="bold">{purchase.title}</Body>
        {purchase.kind === "mission" ? (
          <Body size={13} color={T.muted}>
            {t("adventurer.shop.fromMission")}
          </Body>
        ) : (
          <Price coins={purchase.priceCoins} />
        )}
      </View>
      <Seal
        kind={delivered ? "ok" : "pend"}
        label={delivered ? t("adventurer.shop.delivered") : t("adventurer.shop.pending")}
        icon={delivered ? "check" : undefined}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  price: { flexDirection: "row", alignItems: "center", gap: 5 },
  pack: { flexBasis: "30%", flexGrow: 1, alignItems: "center", gap: 6, paddingVertical: 12, paddingHorizontal: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
});
