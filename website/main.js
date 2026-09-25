/**
 * QuestVault site — PT-BR / EN copy and download buttons.
 * Family mode (v2): guardians forge missions, adventurers deliver with proof and earn rewards.
 */

/** Web app origin from the Netlify build (config.js), else same-origin /app/. */
function webAppBase() {
  const fromConfig = typeof window !== "undefined" && window.QV_WEB_APP_URL;
  if (fromConfig) return fromConfig.replace(/\/?$/, "/");
  return "/app/";
}

const STRINGS = {
  pt: {
    "meta.title": "QuestVault — missões para a família",
    "meta.description":
      "QuestVault: missões para a família. Os pais criam as tarefas, os filhos entregam com foto ou áudio e ganham moedas ou tempo de tela.",
    skip: "Pular para o conteúdo",
    "nav.how": "Como funciona",
    "nav.features": "Recursos",
    "nav.download": "Baixar",
    "hero.kicker": "Nova versão 2.0 · Família",
    "hero.title": "Missões em família.<br><em>Recompensas de verdade.</em>",
    "hero.lead":
      "Os pais criam as tarefas. Os filhos entregam com foto ou áudio, e ganham moedas ou tempo de tela quando o Guardião aprova.",
    "hero.download": "Baixar o app",
    "hero.how": "Como funciona",
    "hero.note": "Grátis · Web app e Android · Português e inglês",
    "phone.rank": "Nível 7 · Escudeiro",
    "phone.streak": "5 dias",
    "phone.today": "Missões de hoje",
    "phone.m1": "Ler 20 minutos",
    "phone.m2": "Lição de matemática",
    "phone.m3": "Arrumar o quarto",
    "phone.or": "ou",
    "phone.finish": "Finalizar missão",
    "phone.waiting": "Aguardando o Guardião conferir",
    "status.todo": "A fazer",
    "status.submitted": "Em análise",
    "status.approved": "Aprovada",
    "how.label": "Como funciona",
    "how.title": "Três passos, toda semana",
    "how.1.title": "O Guardião forja a missão",
    "how.1.body":
      "Arrumar o quarto, ler 20 minutos, lição de casa. Defina prazo, a prova exigida e a recompensa: moedas, tempo de tela, um item, ou deixe o filho escolher.",
    "how.2.title": "O Aventureiro entrega com prova",
    "how.2.body":
      "Ao terminar, ele toca em Finalizar: tira uma foto, conta como fez por texto ou áudio, e escolhe entre moedas e tempo.",
    "how.3.title": "Aprovou, liberou",
    "how.3.body":
      "Você confere a entrega e aprova ou pede para refazer. A recompensa chega na hora, com a sua mensagem, na próxima vez que ele abrir o app.",
    "roles.g.kicker": "Pai ou mãe",
    "roles.g.title": "O Guardião",
    "roles.g.1": "Cria missões diárias, semanais ou únicas",
    "roles.g.2": "Aprova entregas vendo a foto e ouvindo o áudio",
    "roles.g.3": "Monta o mercado: itens, pacotes de tempo e mesada",
    "roles.g.4": "Decide quais apps ficam livres, com tempo ou bloqueados",
    "roles.a.kicker": "Filho ou filha",
    "roles.a.title": "O Aventureiro",
    "roles.a.1": "Vê as missões do dia e o prazo de cada uma",
    "roles.a.2": "Entrega com foto e relato escrito ou gravado",
    "roles.a.3": "Sobe de nível, mantém a sequência e junta moedas",
    "roles.a.4": "Troca moedas por tempo de tela ou prêmios",
    "feat.label": "Recursos",
    "feat.title": "Tudo o que a rotina da família precisa",
    "feat.1.title": "Aprovação com prova",
    "feat.1.body": "Foto, texto ou áudio em cada entrega. Aprove em um toque ou peça para refazer com um recado.",
    "feat.2.title": "Tempo de tela sob controle",
    "feat.2.body":
      "Um banco de minutos conquistados, limite diário e horário de dormir. O tempo vence se ficar guardado demais.",
    "feat.3.title": "Mercado da família",
    "feat.3.body": "Você define os prêmios e os preços em moedas. Quando o filho compra, você recebe um aviso para entregar.",
    "feat.4.title": "Avisos na hora certa",
    "feat.4.body":
      "Nova missão, prazo chegando, entrega para revisar, missão aprovada. Tudo respeita o horário de silêncio de cada um.",
    "feat.5.title": "Apps liberados e bloqueados",
    "feat.5.body": "Escolha, app por app, o que fica sempre aberto, o que usa o tempo conquistado e o que fica fechado.",
    "feat.6.title": "Mesada no cofre",
    "feat.6.body": "Se quiser, moedas viram dinheiro: 100 moedas vão para o cofre de cada filho no valor que você definir.",
    "places.title": "Cada tela é um lugar do reino",
    "places.1": "Biblioteca: aprovações",
    "places.2": "Taverna: mercado e missões",
    "places.3": "Ruínas: o quadro do Aventureiro",
    "places.4": "Portão: os apps do celular",
    "dl.label": "Baixar",
    "dl.title": "Baixe a versão 2.0",
    "dl.lead": "Use no navegador ou instale no Android enquanto as lojas não aprovam.",
    "dl.web.title": "Web app",
    "dl.web.sub": "iPhone, Android e computador. Instale na tela inicial para receber os avisos.",
    "dl.web.open": "Abrir o app",
    "dl.web.install": "Instalar na tela inicial",
    "dl.web.missing": "O web app ainda não foi publicado.",
    "dl.android.title": "Android (APK)",
    "dl.android.sub": "Instalação direta, versão 2.0. Permita instalar de fontes desconhecidas.",
    "dl.android.cta": "Baixar APK",
    "dl.android.missing": "O APK está sendo gerado. Enquanto isso, use o web app.",
    "dl.soon": "Em breve",
    "dl.req.title": "Antes de instalar",
    "dl.req.1": "O Guardião cria a conta e a família primeiro",
    "dl.req.2": "No celular do filho: \"Sou aventureiro\" e o código de 6 dígitos",
    "dl.req.3": "Android 8 ou superior para o APK",
    "dl.req.4": "No iPhone, use o web app pelo Safari",
    "footer.tagline": "Missões, recompensas e tempo de tela em família.",
    "footer.copy": "© QuestVault",
    "footer.contact": "Contato",
  },
  en: {
    "meta.title": "QuestVault — missions for the family",
    "meta.description":
      "QuestVault: missions for the family. Parents create the tasks, kids deliver with a photo or audio and earn coins or screen time.",
    skip: "Skip to content",
    "nav.how": "How it works",
    "nav.features": "Features",
    "nav.download": "Download",
    "hero.kicker": "New version 2.0 · Family",
    "hero.title": "Family missions.<br><em>Real rewards.</em>",
    "hero.lead":
      "Parents create the tasks. Kids deliver with a photo or audio, and earn coins or screen time when the Guardian approves.",
    "hero.download": "Get the app",
    "hero.how": "How it works",
    "hero.note": "Free · Web app and Android · Portuguese and English",
    "phone.rank": "Level 7 · Squire",
    "phone.streak": "5 days",
    "phone.today": "Today's missions",
    "phone.m1": "Read for 20 minutes",
    "phone.m2": "Math homework",
    "phone.m3": "Tidy the bedroom",
    "phone.or": "or",
    "phone.finish": "Finish mission",
    "phone.waiting": "Waiting for the Guardian to check",
    "status.todo": "To do",
    "status.submitted": "In review",
    "status.approved": "Approved",
    "how.label": "How it works",
    "how.title": "Three steps, every week",
    "how.1.title": "The Guardian forges a mission",
    "how.1.body":
      "Tidy the bedroom, read for 20 minutes, homework. Set the deadline, the proof required and the reward: coins, screen time, an item, or let your kid choose.",
    "how.2.title": "The Adventurer delivers with proof",
    "how.2.body":
      "When done, they tap Finish: take a photo, tell how they did it in writing or audio, and pick coins or time.",
    "how.3.title": "Approved, unlocked",
    "how.3.body":
      "You check the delivery and approve or ask for a redo. The reward lands right away, with your message, the next time they open the app.",
    "roles.g.kicker": "Mom or dad",
    "roles.g.title": "The Guardian",
    "roles.g.1": "Creates daily, weekly or one-off missions",
    "roles.g.2": "Approves deliveries by seeing the photo and hearing the audio",
    "roles.g.3": "Stocks the market: items, time packs and allowance",
    "roles.g.4": "Decides which apps are free, timed or blocked",
    "roles.a.kicker": "Son or daughter",
    "roles.a.title": "The Adventurer",
    "roles.a.1": "Sees today's missions and each deadline",
    "roles.a.2": "Delivers with a photo and a written or recorded report",
    "roles.a.3": "Levels up, keeps the streak and saves coins",
    "roles.a.4": "Trades coins for screen time or prizes",
    "feat.label": "Features",
    "feat.title": "Everything the family routine needs",
    "feat.1.title": "Approval with proof",
    "feat.1.body": "Photo, text or audio in every delivery. Approve in one tap or ask for a redo with a note.",
    "feat.2.title": "Screen time under control",
    "feat.2.body": "A bank of earned minutes, a daily cap and bedtime. Time expires if it sits too long.",
    "feat.3.title": "Family market",
    "feat.3.body": "You set the prizes and their prices in coins. When your kid buys one, you get a note to deliver it.",
    "feat.4.title": "Notifications at the right time",
    "feat.4.body":
      "New mission, deadline coming, delivery to review, mission approved. Everything respects each person's quiet hours.",
    "feat.5.title": "Free and blocked apps",
    "feat.5.body": "Choose, app by app, what is always open, what uses earned time and what stays closed.",
    "feat.6.title": "Allowance in the safe",
    "feat.6.body": "If you want, coins become money: 100 coins go to each kid's safe at the value you set.",
    "places.title": "Every screen is a place in the realm",
    "places.1": "Library: approvals",
    "places.2": "Tavern: market and missions",
    "places.3": "Ruins: the Adventurer's board",
    "places.4": "Gate: the phone's apps",
    "dl.label": "Download",
    "dl.title": "Get version 2.0",
    "dl.lead": "Use it in the browser or install on Android while the stores review it.",
    "dl.web.title": "Web app",
    "dl.web.sub": "iPhone, Android and desktop. Add it to your home screen to get notifications.",
    "dl.web.open": "Open the app",
    "dl.web.install": "Add to home screen",
    "dl.web.missing": "The web app isn't published yet.",
    "dl.android.title": "Android (APK)",
    "dl.android.sub": "Direct install, version 2.0. Allow installs from unknown sources.",
    "dl.android.cta": "Download APK",
    "dl.android.missing": "The APK is being built. Meanwhile, use the web app.",
    "dl.soon": "Coming soon",
    "dl.req.title": "Before installing",
    "dl.req.1": "The Guardian creates the account and the family first",
    "dl.req.2": "On the kid's phone: \"I'm an adventurer\" and the 6-digit code",
    "dl.req.3": "Android 8 or newer for the APK",
    "dl.req.4": "On iPhone, use the web app in Safari",
    "footer.tagline": "Missions, rewards and screen time for the family.",
    "footer.copy": "© QuestVault",
    "footer.contact": "Contact",
  },
};

function detectLang() {
  try {
    const stored = localStorage.getItem("qv-lang");
    if (stored === "pt" || stored === "en") return stored;
  } catch {
    /* storage blocked */
  }
  return (navigator.language || "pt-BR").toLowerCase().startsWith("en") ? "en" : "pt";
}

function applyLang(lang) {
  const strings = STRINGS[lang] ?? STRINGS.pt;
  document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
  document.title = strings["meta.title"];
  document.querySelector('meta[name="description"]')?.setAttribute("content", strings["meta.description"]);

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const value = strings[el.getAttribute("data-i18n")];
    if (value === undefined) return;
    if (el.hasAttribute("data-i18n-html")) el.innerHTML = value;
    else el.textContent = value;
  });

  document.querySelectorAll(".lang-toggle button").forEach((btn) => {
    btn.setAttribute("aria-pressed", btn.dataset.lang === lang ? "true" : "false");
  });
  try {
    localStorage.setItem("qv-lang", lang);
  } catch {
    /* storage blocked */
  }
}

function enable(el) {
  el.classList.remove("btn-disabled");
  el.removeAttribute("aria-disabled");
}

async function exists(path) {
  try {
    return (await fetch(path, { method: "HEAD" })).ok;
  } catch {
    return false;
  }
}

async function checkPwa() {
  const open = document.getElementById("pwa-open");
  const install = document.getElementById("pwa-install");
  const note = document.getElementById("pwa-missing");
  if (!open || !install) return;

  const base = webAppBase();
  open.href = base;
  install.href = `${base}?install=1`;

  const available = base.startsWith("http") || (await exists("app/index.html")) || (await exists("app/manifest.json"));
  if (available) {
    enable(open);
    enable(install);
    if (note) note.hidden = true;
  } else if (note) {
    note.hidden = false;
  }
}

/**
 * APK: the Netlify build writes QV_APK_URL (GitHub release, checked at build time).
 * Otherwise fall back to a file committed at downloads/questvault.apk.
 */
async function checkApk() {
  const link = document.getElementById("apk-download");
  const note = document.getElementById("apk-missing");
  if (!link) return;

  const external = typeof window !== "undefined" && window.QV_APK_URL;
  if (external) {
    link.href = external;
    enable(link);
    if (note) note.hidden = true;
    return;
  }
  if (await exists("downloads/questvault.apk")) {
    enable(link);
    if (note) note.hidden = true;
  } else {
    link.addEventListener("click", (e) => e.preventDefault());
    if (note) note.hidden = false;
  }
}

function initNav() {
  const btn = document.querySelector(".menu-btn");
  const mobile = document.querySelector(".nav-mobile");
  if (!btn || !mobile) return;
  btn.addEventListener("click", () => {
    const open = mobile.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  mobile.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      mobile.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyLang(detectLang());
  document.querySelectorAll(".lang-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => applyLang(btn.dataset.lang ?? "pt"));
  });
  initNav();
  checkPwa();
  checkApk();
});
