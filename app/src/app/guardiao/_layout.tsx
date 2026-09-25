import { useQuery } from "convex/react";
import { Redirect } from "expo-router";
import { Tabs } from "expo-router/tabs";

import { RpgTabBar, type TabSpec } from "@/components/tab-bar";
import { Loading } from "@/components/ui";
import { useProfile } from "@/lib/family";
import { T } from "@/lib/theme";
import { api } from "../../../convex/_generated/api";

/** Guardian (parent) area. Hidden routes (revisar, nova-missao, avisos, ajustes) live in the same navigator. */
export default function GuardianLayout() {
  const { ready, active, me } = useProfile();
  const isGuardian = me?.user.role === "guardian";
  const pending = useQuery(api.missions.pendingCount, isGuardian ? {} : "skip");

  if (!ready) return <Loading />;
  if (active !== "guardian" || !isGuardian) return <Redirect href="/" />;

  const tabs: TabSpec[] = [
    { name: "index", labelKey: "tabs.painel", icon: "home" },
    { name: "aprovacoes", labelKey: "tabs.aprovacoes", icon: "seal", badge: pending?.count || undefined },
    { name: "missoes", labelKey: "tabs.missoes", icon: "scroll" },
    { name: "recompensas", labelKey: "tabs.recompensas", icon: "chest" },
    { name: "apps", labelKey: "tabs.apps", icon: "apps" },
  ];

  return (
    <Tabs
      backBehavior="history"
      tabBar={(props) => <RpgTabBar {...props} tabs={tabs} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: T.bg } }}
    />
  );
}
