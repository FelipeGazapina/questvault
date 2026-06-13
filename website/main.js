/**
 * QuestVault marketing site — PT-BR / EN copy.
 * Phase 1 only: no vault, money, or future-feature spoilers.
 */

/** @type {string} Web app origin from Netlify build (config.js) or same-origin /app/ */
function webAppBase() {
  const fromConfig = typeof window !== "undefined" && window.QV_WEB_APP_URL;
  if (fromConfig) return fromConfig.replace(/\/?$/, "/");
  return "/app/";
}

const STRINGS = {
  pt: {
    "meta.title": "QuestVault — sua vida virou RPG",
    "meta.description":
      "QuestVault transforma hábitos reais em quests de pixel art. XP, streaks, loot shop e muito mais. Baixe agora — lojas em breve.",
    "nav.features": "RECURSOS",
    "nav.how": "COMO FUNCIONA",
    "nav.download": "BAIXAR",
    "nav.future": "O QUE VEM",
    "hero.title": "Sua vida.<br><em>Suas quests.</em><br>Seu loot.",
    "hero.lead":
      "Um RPG de pixel art para a vida real. Forje quests, suba de nível, mantenha a streak e monte sua wishlist — sem planilha, sem culpa.",
    "hero.download": "BAIXAR APP",
    "hero.how": "COMO FUNCIONA",
    "hero.note": "Grátis para jogar · PT-BR e EN · Feito para quem fala em XP",
    "phone.label": "QUEST BOARD",
    "phone.streak": "sequência de 5 dias",
    "phone.nav.board": "BOARD",
    "phone.nav.pool": "POOL",
    "phone.nav.shop": "SHOP",
    "phone.nav.log": "LOG",
    "phone.nav.hero": "HERO",
    "how.label": "COMO FUNCIONA",
    "how.title": "Três passos. Loop viciante.",
    "how.lead": "Você cria o pool. O jogo sorteia a mão. Você completa e evolui.",
    "how.1.title": "FORJE SEU POOL",
    "how.1.body": "Cadastre tarefas reais — diárias, side quests e bosses mensais. Só o que importa pra você.",
    "how.2.title": "COMPLETE & GANHE XP",
    "how.2.body": "O board invoca quests aleatórias a cada período. Marque como feita, ganhe XP rolado e alimente a streak.",
    "how.3.title": "MONTE SEU LOOT",
    "how.3.body": "Na Loot Shop, salve o que você quer comprar — com ícone pixel, preço e link. Seu alvo, seu grind.",
    "feat.label": "RECURSOS",
    "feat.title": "Tudo que um RPG de vida precisa",
    "feat.lead": "O jogo puro — diversão real, zero planilha.",
    "feat.1.title": "QUEST BOARD",
    "feat.1.body": "Mão sorteada por período: dailies, side quests e boss. Animação ao completar — a row some como vitória.",
    "feat.2.title": "QUEST POOL",
    "feat.2.body": "Sua biblioteca de tarefas. Filtros por tipo. Você forja; o jogo invoca.",
    "feat.3.title": "LOOT SHOP",
    "feat.3.body": "Wishlist com ícones pixel art — headset, pizza, games e mais. Título, preço e link do item.",
    "feat.4.title": "PERSONAGEM",
    "feat.4.body": "Avatar, nível, barra de XP, tiers de recompensa virtual e cosméticos desbloqueáveis.",
    "feat.5.title": "QUEST LOG",
    "feat.5.body": "Dashboard de vitórias: stats, gráfico dos últimos 7 dias e histórico recente.",
    "feat.6.title": "STREAK FLAME",
    "feat.6.body": "Sequência diária no board. A chama cresce quando você não quebra o ritmo.",
    "loot.caption": "Ícones de loot na wishlist — escolha o visual do seu próximo prêmio.",
    "dl.label": "BAIXAR",
    "dl.title": "Jogue agora pelo site",
    "dl.lead":
      "Enquanto aguardamos aprovação na App Store e Google Play, instale pelo navegador (PWA) ou baixe o APK Android.",
    "dl.pwa": "INSTALAR WEB APP",
    "dl.pwa.sub": "Abre o app · depois use Instalar no menu do navegador",
    "dl.pwa.missing": "Web app ainda não publicada. Rode: node website/scripts/build-pwa.mjs",
    "dl.pwa.open": "ABRIR WEB APP",
    "dl.android": "BAIXAR APK ANDROID",
    "dl.android.sub": "Arquivo .apk · instalação manual",
    "dl.ios.soon": "APP STORE",
    "dl.ios.sub": "Em breve",
    "dl.play.soon": "GOOGLE PLAY",
    "dl.play.sub": "Em breve",
    "dl.req.title": "ANTES DE INSTALAR",
    "dl.req.1": "Android 8+ recomendado para o APK direto.",
    "dl.req.2": "Permita instalação de fontes conhecidas nas configurações.",
    "dl.req.3": "iOS: abra /app/ no Safari → Compartilhar → Adicionar à Tela de Início.",
    "dl.missing":
      "APK ainda não publicado neste servidor. Coloque questvault.apk em website/downloads/ ou peça ao time.",
    "future.label": "HORIZONTE",
    "future.title": "A aventura só começou",
    "future.body":
      "Estamos forjando ideias grandes para o futuro do QuestVault — surpresas, novos sistemas e mais motivos pra abrir o app todo dia.",
    "future.hint": "FIQUE DE OLHO · ATUALIZAÇÕES CHEGANDO",
    "footer.tagline": "Seu personagem é você.",
    "footer.copy": "© QuestVault. Todos os direitos reservados.",
    "footer.privacy": "Privacidade",
    "footer.contact": "Contato",
  },
  en: {
    "meta.title": "QuestVault — your life, pixel RPG",
    "meta.description":
      "QuestVault turns real habits into pixel-art quests. XP, streaks, loot shop and more. Download now — stores coming soon.",
    "nav.features": "FEATURES",
    "nav.how": "HOW IT WORKS",
    "nav.download": "DOWNLOAD",
    "nav.future": "AHEAD",
    "hero.title": "Your life.<br><em>Your quests.</em><br>Your loot.",
    "hero.lead":
      "A pixel-art RPG for real life. Forge quests, level up, keep your streak, and build your wishlist — no spreadsheet, no guilt.",
    "hero.download": "DOWNLOAD APP",
    "hero.how": "HOW IT WORKS",
    "hero.note": "Free to play · PT-BR & EN · Built for people who speak in XP",
    "phone.label": "QUEST BOARD",
    "phone.streak": "5-day streak",
    "phone.nav.board": "BOARD",
    "phone.nav.pool": "POOL",
    "phone.nav.shop": "SHOP",
    "phone.nav.log": "LOG",
    "phone.nav.hero": "HERO",
    "how.label": "HOW IT WORKS",
    "how.title": "Three steps. Addictive loop.",
    "how.lead": "You build the pool. The game deals the hand. You complete and level up.",
    "how.1.title": "FORGE YOUR POOL",
    "how.1.body": "Add real tasks — dailies, side quests, and monthly bosses. Only what matters to you.",
    "how.2.title": "COMPLETE & EARN XP",
    "how.2.body": "The board summons random quests each period. Check them off, roll XP, feed the streak.",
    "how.3.title": "BUILD YOUR LOOT",
    "how.3.body": "In the Loot Shop, save what you want to buy — pixel icon, price, and link. Your target, your grind.",
    "feat.label": "FEATURES",
    "feat.title": "Everything a life RPG needs",
    "feat.lead": "The pure game — real fun, zero spreadsheet.",
    "feat.1.title": "QUEST BOARD",
    "feat.1.body": "Random hand per period: dailies, side quests, and boss. Completion animation — the row slides away as victory.",
    "feat.2.title": "QUEST POOL",
    "feat.2.body": "Your task library. Filter by type. You forge; the game summons.",
    "feat.3.title": "LOOT SHOP",
    "feat.3.body": "Wishlist with pixel loot icons — headset, pizza, games, and more. Title, price, and item link.",
    "feat.4.title": "CHARACTER",
    "feat.4.body": "Avatar, level, XP bar, virtual reward tiers, and unlockable cosmetics.",
    "feat.5.title": "QUEST LOG",
    "feat.5.body": "Victory dashboard: stats, last-7-days chart, and recent wins.",
    "feat.6.title": "STREAK FLAME",
    "feat.6.body": "Daily streak on the board. The flame grows when you keep the rhythm.",
    "loot.caption": "Loot icons on your wishlist — pick the look of your next reward.",
    "dl.label": "DOWNLOAD",
    "dl.title": "Play now from the web",
    "dl.lead":
      "While we wait for App Store and Google Play approval, install via browser (PWA) or download the Android APK.",
    "dl.pwa": "INSTALL WEB APP",
    "dl.pwa.sub": "Opens the live app · then use Install in your browser",
    "dl.pwa.missing": "Web app not published yet. Run: node website/scripts/build-pwa.mjs",
    "dl.pwa.open": "OPEN WEB APP",
    "dl.android": "DOWNLOAD ANDROID APK",
    "dl.android.sub": ".apk file · manual install",
    "dl.ios.soon": "APP STORE",
    "dl.ios.sub": "Coming soon",
    "dl.play.soon": "GOOGLE PLAY",
    "dl.play.sub": "Coming soon",
    "dl.req.title": "BEFORE YOU INSTALL",
    "dl.req.1": "Android 8+ recommended for the direct APK.",
    "dl.req.2": "Allow installs from trusted sources in settings.",
    "dl.req.3": "iOS: open /app/ in Safari → Share → Add to Home Screen.",
    "dl.missing":
      "APK not published on this server yet. Drop questvault.apk into website/downloads/ or ask the team.",
    "future.label": "HORIZON",
    "future.title": "The adventure has just begun",
    "future.body":
      "We're forging big ideas for QuestVault's future — surprises, new systems, and more reasons to open the app every day.",
    "future.hint": "STAY TUNED · UPDATES INCOMING",
    "footer.tagline": "The player character is you.",
    "footer.copy": "© QuestVault. All rights reserved.",
    "footer.privacy": "Privacy",
    "footer.contact": "Contact",
  },
};

const LOOT_ICONS = ["headset", "pizza", "gamepad", "sneaker", "book", "phone", "coffee", "gift"];

function detectLang() {
  const stored = localStorage.getItem("qv-lang");
  if (stored === "pt" || stored === "en") return stored;
  const nav = navigator.language || "pt-BR";
  return nav.toLowerCase().startsWith("pt") ? "pt" : "en";
}

function applyLang(lang) {
  const strings = STRINGS[lang];
  document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
  document.title = strings["meta.title"];
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", strings["meta.description"]);

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key || !(key in strings)) return;
    const value = strings[key];
    if (el.hasAttribute("data-i18n-html")) {
      el.innerHTML = value;
    } else {
      el.textContent = value;
    }
  });

  document.querySelectorAll(".lang-toggle button").forEach((btn) => {
    btn.setAttribute("aria-pressed", btn.dataset.lang === lang ? "true" : "false");
  });

  localStorage.setItem("qv-lang", lang);
}

async function checkPwa() {
  const link = document.getElementById("pwa-open");
  const install = document.getElementById("pwa-install");
  const note = document.getElementById("pwa-missing");
  if (!link || !install) return;

  const base = webAppBase();
  link.href = base;
  install.href = `${base}?install=1`;

  const isExternal = base.startsWith("http");
  if (isExternal) {
    link.classList.remove("btn-disabled");
    link.removeAttribute("aria-disabled");
    install.classList.remove("btn-disabled");
    install.removeAttribute("aria-disabled");
    if (note) note.hidden = true;
    return;
  }

  const candidates = ["app/index.html", "app/manifest.json", "app/manifest.webmanifest"];
  let found = false;
  for (const path of candidates) {
    try {
      const res = await fetch(path, { method: "HEAD" });
      if (res.ok) {
        found = true;
        break;
      }
    } catch {
      /* try next */
    }
  }

  if (found) {
    link.classList.remove("btn-disabled");
    link.removeAttribute("aria-disabled");
    if (install) {
      install.classList.remove("btn-disabled");
      install.removeAttribute("aria-disabled");
    }
    if (note) note.hidden = true;
  } else {
    if (note) note.hidden = false;
  }
}

async function checkApk() {
  const link = document.getElementById("apk-download");
  const note = document.getElementById("apk-missing");
  if (!link) return;

  try {
    const res = await fetch("downloads/questvault.apk", { method: "HEAD" });
    if (res.ok) {
      link.classList.remove("btn-disabled");
      link.removeAttribute("aria-disabled");
      if (note) note.hidden = true;
    } else {
      link.classList.add("btn-disabled");
      link.setAttribute("aria-disabled", "true");
      link.addEventListener("click", (e) => e.preventDefault());
      if (note) note.hidden = false;
    }
  } catch {
    link.classList.add("btn-disabled");
    link.setAttribute("aria-disabled", "true");
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
  const lang = detectLang();
  applyLang(lang);

  document.querySelectorAll(".lang-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => applyLang(btn.dataset.lang ?? "pt"));
  });

  initNav();
  checkPwa();
  checkApk();
});
