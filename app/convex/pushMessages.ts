import type { QuestType } from "./game";

export type PushLocale = "en" | "pt";

/** Whether to send a period push after spawn (pure — easy to test). */
export function shouldSendPeriodPush(args: {
  spawnedCount: number;
  alreadySent: boolean;
}): boolean {
  return args.spawnedCount > 0 && !args.alreadySent;
}

const COPY: Record<
  PushLocale,
  Record<QuestType, { title: string; body: string }>
> = {
  en: {
    daily: {
      title: "New daily quests!",
      body: "Your board has fresh dailies — open QuestVault and complete them.",
    },
    side: {
      title: "New side quests!",
      body: "This week's side quests are ready on your board.",
    },
    boss: {
      title: "New boss quest!",
      body: "A monthly boss quest was summoned — time to grind.",
    },
  },
  pt: {
    daily: {
      title: "Novas quests diárias!",
      body: "Seu board tem dailies novas — abra o QuestVault e cumpra.",
    },
    side: {
      title: "Novas side quests!",
      body: "As side quests da semana estão no seu board.",
    },
    boss: {
      title: "Nova boss quest!",
      body: "Uma boss quest mensal foi invocada — hora de grindar.",
    },
  },
};

export function pushNotificationContent(
  questType: QuestType,
  locale: PushLocale = "pt",
): { title: string; body: string } {
  return COPY[locale][questType];
}

export function normalizePushLocale(raw: string | undefined): PushLocale {
  return raw?.toLowerCase().startsWith("en") ? "en" : "pt";
}
