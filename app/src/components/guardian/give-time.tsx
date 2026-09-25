import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Body, Button, Choice, Num, Sprite } from "@/components/ui";
import { formatMinutes, T } from "@/lib/theme";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ErrorText, Sheet, useBusy } from "./kit";

const AMOUNTS = [15, 30, 60] as const;

export type GiveTimeTarget = { _id: Id<"adventurers">; name: string } | null;

/** "Dar tempo": gift 15/30/60 minutes to an adventurer's time bank (rewards.giveTime). */
export function GiveTimeSheet({ target, onClose }: { target: GiveTimeTarget; onClose: () => void }) {
  const { t } = useTranslation();
  const giveTime = useMutation(api.rewards.giveTime);
  const { busy, error, setError, run } = useBusy();
  const [minutes, setMinutes] = useState<number>(30);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (target) {
      setDone(null);
      setError(null);
    }
  }, [target, setError]);

  async function confirm() {
    if (!target) return;
    const ok = await run(() => giveTime({ adventurerId: target._id, minutes }));
    if (ok) setDone(t("guardian.giveTime.done", { time: formatMinutes(minutes), name: target.name }));
  }

  return (
    <Sheet visible={!!target} onClose={onClose} title={t("guardian.giveTime.title", { name: target?.name ?? "" })}>
      {done ? (
        <View style={{ alignItems: "center", gap: 12, paddingVertical: 8 }}>
          <Sprite name="hourglass" width={40} />
          <Body center>{done}</Body>
          <Button label={t("actions.close")} variant="ghost" onPress={onClose} style={{ alignSelf: "stretch" }} />
        </View>
      ) : (
        <>
          <Body size={14} color={T.muted}>
            {t("guardian.giveTime.body")}
          </Body>
          <View style={{ flexDirection: "row", gap: 8 }} accessibilityRole="radiogroup">
            {AMOUNTS.map((m) => (
              <Choice
                key={m}
                selected={minutes === m}
                onPress={() => setMinutes(m)}
                label={formatMinutes(m)}
                color={T.timeFill}
                style={{ flex: 1, alignItems: "center", minHeight: 76, justifyContent: "center" }}
              >
                <Sprite name="hourglass" width={22} />
                <Num size={17} color={T.time}>
                  {formatMinutes(m)}
                </Num>
              </Choice>
            ))}
          </View>
          <ErrorText>{error}</ErrorText>
          <Button
            label={t("guardian.giveTime.confirm", { time: formatMinutes(minutes) })}
            onPress={() => void confirm()}
            busy={busy}
            size="lg"
          />
        </>
      )}
    </Sheet>
  );
}
