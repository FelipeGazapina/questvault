import { useQuery } from "convex/react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { PageHeader } from "@/components/guardian/kit";
import { AllowanceSection, ItemsSection, PacksSection, PurchaseRow, RulesSection } from "@/components/guardian/market";
import { Loading, Ornament, Screen } from "@/components/ui";
import { api } from "../../../convex/_generated/api";

/** Mercado da família: items, time packs, screen-time rules, allowance and purchases to deliver. */
export default function Rewards() {
  const { t } = useTranslation();
  const catalog = useQuery(api.rewards.catalog, {});
  const purchases = useQuery(api.rewards.pendingPurchases, {});

  if (catalog === undefined) return <Loading />;

  return (
    <Screen scene="taverna">
      <PageHeader sprite="stall" spriteWidth={62} title={t("guardian.rewards.title")} subtitle={t("guardian.rewards.subtitle")} />

      {purchases && purchases.length > 0 ? (
        <>
          <Ornament title={t("guardian.rewards.pendingDeliveries").toUpperCase()} />
          <View style={{ gap: 8 }}>
            {purchases.map((p) => (
              <PurchaseRow key={p._id} p={p} />
            ))}
          </View>
        </>
      ) : null}

      <Ornament title={t("guardian.rewards.items").toUpperCase()} />
      <ItemsSection items={catalog.items} />

      <Ornament title={t("guardian.rewards.packs").toUpperCase()} />
      <PacksSection packs={catalog.packs} />

      <Ornament title={t("guardian.rewards.rules").toUpperCase()} />
      <RulesSection settings={catalog.settings} />

      <Ornament title={t("guardian.rewards.allowance").toUpperCase()} />
      <AllowanceSection settings={catalog.settings} cofres={catalog.cofres} />
    </Screen>
  );
}
