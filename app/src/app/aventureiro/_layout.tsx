import { useQuery } from "convex/react";
import { Redirect } from "expo-router";
import { Tabs } from "expo-router/tabs";
import { View } from "react-native";

import { DecisionDialog } from "@/components/adventurer/decision-dialog";
import { PenaltyDialog } from "@/components/adventurer/penalty-dialog";
import { RpgTabBar, type TabSpec } from "@/components/tab-bar";
import { Loading } from "@/components/ui";
import { useAdventurer, useProfile } from "@/lib/family";
import { T } from "@/lib/theme";
import { api } from "../../../convex/_generated/api";

const TABS: TabSpec[] = [
  { name: "index", labelKey: "tabs.missoes", icon: "scroll" },
  { name: "loja", labelKey: "tabs.loja", icon: "coin" },
  { name: "tempo", labelKey: "tabs.tempo", icon: "hourglass" },
];

/**
 * Adventurer (child) area. Penalties and decisions made while away pop up as dialogs on the next
 * open (live, if the app is already open) — penalties first, one dialog at a time.
 */
export default function AdventurerLayout() {
  const { ready } = useProfile();
  const adventurer = useAdventurer();
  const penalties = useQuery(api.penalties.unseen, adventurer ? { adventurerId: adventurer._id } : "skip");

  if (!ready) return <Loading />;
  if (!adventurer) return <Redirect href="/" />;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <Tabs
        backBehavior="history"
        tabBar={(props) => <RpgTabBar {...props} tabs={TABS} hideOn={["finalizar"]} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: T.bg } }}
      />
      <PenaltyDialog penalties={penalties} />
      {penalties?.length === 0 ? <DecisionDialog adventurerId={adventurer._id} /> : null}
    </View>
  );
}
