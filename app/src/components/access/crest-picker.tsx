import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Body, Choice, Label, Sprite } from "@/components/ui";
import { CREST_SPRITE } from "@/lib/art";
import { T, type Crest } from "@/lib/theme";

const CRESTS: Crest[] = ["teal", "violet", "red"];

/** Three banner choices for an adventurer's crest. */
export function CrestPicker({ value, onChange }: { value: Crest; onChange: (c: Crest) => void }) {
  const { t } = useTranslation();
  return (
    <View style={{ gap: 6 }}>
      <Label>{t("access.onboarding.crest")}</Label>
      <View accessibilityRole="radiogroup" style={{ flexDirection: "row", gap: 10 }}>
        {CRESTS.map((c) => (
          <Choice
            key={c}
            label={t(`access.onboarding.crests.${c}`)}
            selected={value === c}
            onPress={() => onChange(c)}
            style={{ flex: 1, alignItems: "center", paddingVertical: 10 }}
          >
            <Sprite name={CREST_SPRITE[c]} width={26} />
            <Body size={13} color={value === c ? T.brassHi : T.muted} center>
              {t(`access.onboarding.crests.${c}`)}
            </Body>
          </Choice>
        ))}
      </View>
    </View>
  );
}
