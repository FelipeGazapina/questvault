import { Redirect } from "expo-router";
import { Tabs } from "expo-router/tabs";
import { View } from "react-native";

import { DecisionDialog } from "@/components/adventurer/decision-dialog";
import { RpgTabBar, type TabSpec } from "@/components/tab-bar";
import { Loading } from "@/components/ui";
import { useAdventurer, useProfile } from "@/lib/family";
import { T } from "@/lib/theme";

const TABS: TabSpec[] = [
  { name: "index", labelKey: "tabs.missoes", icon: "scroll" },
  { name: "loja", labelKey: "tabs.loja", icon: "coin" },
  { name: "tempo", labelKey: "tabs.tempo", icon: "hourglass" },
];

/** Adventurer (child) area. Decisions made while away pop up as a dialog on the next open. */
export default function AdventurerLayout() {
  const { ready } = useProfile();
  const adventurer = useAdventurer();

  if (!ready) return <Loading />;
  if (!adventurer) return <Redirect href="/" />;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <Tabs
        backBehavior="history"
        tabBar={(props) => <RpgTabBar {...props} tabs={TABS} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: T.bg } }}
      />
      <DecisionDialog adventurerId={adventurer._id} />
    </View>
  );
}
