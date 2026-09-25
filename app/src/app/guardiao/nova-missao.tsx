import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { PageHeader, useGoBack } from "@/components/guardian/kit";
import { MissionForm } from "@/components/guardian/mission-form";
import { Empty, Loading, Screen } from "@/components/ui";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

/** Forjar nova missão — or edit one with `?id=<missionId>`. */
export default function ForgeMission() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const goBack = useGoBack("/guardiao/missoes");
  const mission = useQuery(api.missions.getMission, id ? { missionId: id as Id<"missions"> } : "skip");
  // Bumped after a successful create so the (still mounted) tab screen starts blank next time.
  const [round, setRound] = useState(0);

  const editing = !!id;
  const header = (
    <PageHeader
      onBack={goBack}
      sprite="anvil"
      spriteWidth={60}
      title={editing ? t("guardian.form.editTitle") : t("guardian.form.newTitle")}
      subtitle={t("guardian.form.subtitle")}
    />
  );

  if (editing && mission === undefined) return <Loading />;

  return (
    <Screen scene="taverna">
      {header}
      {editing && mission === null ? (
        <Empty sprite="board" text={t("guardian.notFound")} />
      ) : (
        <MissionForm
          key={editing ? id : `new-${round}`}
          mission={mission ?? null}
          onSaved={() => {
            if (!editing) setRound((r) => r + 1);
            router.navigate("/guardiao/missoes" as never);
          }}
        />
      )}
    </Screen>
  );
}
