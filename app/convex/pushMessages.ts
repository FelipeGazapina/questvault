// Notification copy for Web Push and the in-app inbox. Pure — shared by Convex actions and the client.

export type PushLocale = "en" | "pt";

export type NoticeParams = Record<string, string | number>;

export type NoticeKind =
  | "mission_new"
  | "missions_new"
  | "submission"
  | "approved"
  | "rejected"
  | "deadline_child"
  | "deadline_guardian"
  | "pending_reminder"
  | "time_low"
  | "time_gift"
  | "purchase"
  | "daily_summary";

export function normalizePushLocale(raw: string | undefined): PushLocale {
  return raw?.toLowerCase().startsWith("en") ? "en" : "pt";
}

/** "50 moedas" / "30 min de tela" / an item title, from rewardKind + rewardAmount + itemTitle params. */
export function rewardLabel(p: NoticeParams, locale: PushLocale): string {
  const amount = Number(p.rewardAmount ?? 0);
  if (p.rewardKind === "coins") return locale === "en" ? `${amount} coins` : `${amount} moedas`;
  if (p.rewardKind === "time") return locale === "en" ? `${amount} min of screen time` : `${amount} min de tela`;
  if (p.rewardKind === "item") return String(p.itemTitle ?? "");
  if (p.rewardKind === "choice") {
    return locale === "en"
      ? `${p.coins} coins or ${p.minutes} min`
      : `${p.coins} moedas ou ${p.minutes} min`;
  }
  return "";
}

function proofLabel(p: NoticeParams, locale: PushLocale): string {
  const parts: string[] = [];
  const photos = Number(p.photos ?? 0);
  if (photos === 1) parts.push(locale === "en" ? "1 photo" : "1 foto");
  if (photos > 1) parts.push(locale === "en" ? `${photos} photos` : `${photos} fotos`);
  if (p.report === "text") parts.push(locale === "en" ? "written report" : "relato");
  if (p.report === "audio") parts.push(locale === "en" ? "audio report" : "relato em áudio");
  return parts.join(" + ");
}

type Copy = (p: NoticeParams, locale: PushLocale) => { title: string; body: string };

const COPY: Record<NoticeKind, Copy> = {
  mission_new: (p, l) => ({
    title: l === "en" ? `New mission: ${p.title}` : `Nova missão: ${p.title}`,
    body: l === "en" ? `Due ${p.due} · ${rewardLabel(p, l)}` : `Até ${p.due} · ${rewardLabel(p, l)}`,
  }),
  missions_new: (p, l) => ({
    title: l === "en" ? `${p.count} new missions` : `${p.count} novas missões`,
    body: l === "en" ? "Your quest board has fresh missions." : "Seu quadro tem missões novas.",
  }),
  submission: (p, l) => {
    const proof = proofLabel(p, l);
    const chose = l === "en" ? `Chose ${rewardLabel(p, l)}.` : `Escolheu ${rewardLabel(p, l)}.`;
    return {
      title: l === "en" ? `${p.name} delivered “${p.title}”` : `${p.name} entregou “${p.title}”`,
      body: proof ? `${proof[0].toUpperCase()}${proof.slice(1)}. ${chose}` : chose,
    };
  },
  approved: (p, l) => ({
    title: l === "en" ? "Mission approved!" : "Missão aprovada!",
    body:
      l === "en"
        ? `“${p.title}”: ${rewardLabel(p, l)} unlocked.`
        : `“${p.title}”: ${rewardLabel(p, l)} liberados.`,
  }),
  rejected: (p, l) => ({
    title: l === "en" ? `Redo: ${p.title}` : `Refazer: ${p.title}`,
    body: p.message
      ? `“${p.message}”`
      : l === "en"
        ? "Your guardian asked you to redo it."
        : "O Guardião pediu para refazer.",
  }),
  deadline_child: (p, l) => ({
    title:
      l === "en" ? `${p.minutes} min left for “${p.title}”` : `Faltam ${p.minutes} min para “${p.title}”`,
    body:
      l === "en"
        ? `Deliver on time and earn ${rewardLabel(p, l)}.`
        : `Entregue a tempo e ganhe ${rewardLabel(p, l)}.`,
  }),
  deadline_guardian: (p, l) => ({
    title:
      l === "en" ? `${p.name} hasn't delivered “${p.title}”` : `${p.name} ainda não entregou “${p.title}”`,
    body: l === "en" ? `Due at ${p.due}` : `Prazo às ${p.due}`,
  }),
  pending_reminder: (p, l) => ({
    title:
      l === "en"
        ? `${p.name}'s delivery waiting for ${p.hours} h`
        : `Entrega de ${p.name} esperando há ${p.hours} h`,
    body: `“${p.title}”`,
  }),
  time_low: (p, l) => ({
    title: l === "en" ? `${p.minutes} min of screen time left` : `Restam ${p.minutes} min de tela`,
    body:
      l === "en"
        ? "Then timed apps close until you earn more."
        : "Depois, os apps com tempo fecham até você ganhar mais.",
  }),
  time_gift: (p, l) => ({
    title: l === "en" ? `+${p.minutes} min of screen time` : `+${p.minutes} min de tela`,
    body: l === "en" ? "A gift from your guardian." : "Presente do Guardião.",
  }),
  purchase: (p, l) => ({
    title:
      l === "en"
        ? `${p.name} bought “${p.title}” for ${p.price} coins`
        : `${p.name} comprou “${p.title}” por ${p.price} moedas`,
    body: l === "en" ? "Mark it as delivered when it happens." : "Marque como entregue quando cumprir.",
  }),
  daily_summary: (p, l) => ({
    title: l === "en" ? "Daily summary" : "Resumo do dia",
    body:
      l === "en"
        ? `${p.approved} missions approved, ${p.rejected} to redo, ${p.minutes} min of screen time used.`
        : `${p.approved} missões aprovadas, ${p.rejected} para refazer, ${p.minutes} min de tela usados.`,
  }),
};

export function renderNotice(kind: string, params: NoticeParams, locale: PushLocale = "pt"): { title: string; body: string } {
  const copy = COPY[kind as NoticeKind];
  if (!copy) return { title: "QuestVault", body: "" };
  return copy(params, locale);
}
