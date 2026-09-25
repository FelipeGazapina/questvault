import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { AdventurerHud } from "@/components/adventurer/hud";
import { MissionCard } from "@/components/adventurer/mission-card";
import { Empty, Loading, Ornament, Screen } from "@/components/ui";
import { useAdventurer } from "@/lib/family";
import { api } from "../../../convex/_generated/api";

/** Adventurer home: HUD plus today's and this week's missions. */
export default function AdventurerMissions() {
  const { t } = useTranslation();
  const adventurer = useAdventurer();
  const adventurerId = adventurer?._id;
  const board = useQuery(api.missions.board, adventurerId ? { adventurerId } : "skip");
  const syncBoard = useMutation(api.missions.syncBoard);

  // Spawn anything that became due since the last cron tick (idempotent, no push).
  useEffect(() => {
    if (adventurerId) void syncBoard({ adventurerId }).catch(() => {});
  }, [adventurerId, syncBoard]);

  if (!adventurer) return <Loading />;

  const empty = board && board.today.length === 0 && board.week.length === 0;

  return (
    <Screen scene="ruinas">
      <AdventurerHud adventurer={adventurer} />

      {board === undefined ? <Loading /> : null}
      {empty ? <Empty sprite="board" text={t("adventurer.missions.empty")} /> : null}

      {board && board.today.length > 0 ? (
        <>
          <Ornament title={t("adventurer.missions.today")} />
          {board.today.map((run) => (
            <MissionCard key={run._id} run={run} />
          ))}
        </>
      ) : null}

      {board && board.week.length > 0 ? (
        <>
          <Ornament title={t("adventurer.missions.week")} />
          {board.week.map((run) => (
            <MissionCard key={run._id} run={run} weekly />
          ))}
        </>
      ) : null}
    </Screen>
  );
}
