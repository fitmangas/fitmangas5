/* =========================
   EDIT HERE
========================= */

// 1) Put your hero photo URL here (direct image URL)
const HERO_IMAGE_URL = "https://www.dropbox.com/scl/fi/vmq043zpcjkehh6rsyn7n/DSC_3488.PNG?rlkey=gladkol1foebum7jcagsz1mf3&st=awo05ygo&raw=1"; // e.g. "https://yourdomain.com/DSC_3488.jpg"

// Optional avatar photo (can be same as hero). Leave empty to use hero.
const AVATAR_IMAGE_URL = ""; // e.g. "https://yourdomain.com/avatar.jpg"

// Stripe links (fixed)
const offers = {
  visioCollectif: "https://buy.stripe.com/bJe7sL98Sdzla4af2L9bO00",
  visioIndividuel: "https://buy.stripe.com/cNicN50Cm9j56RY5sb9bO04",
  nantesCollectif: "https://buy.stripe.com/28E7sL0CmeDp906bQz9bO05",
  nantesIndividuel: "https://buy.stripe.com/aFa8wP1Gq7aX3FM9Ir9bO03",
};

// Contact
const instagramUrl = "https://www.instagram.com/fit.mangas/";
const email = "info@casamangas.fr";
const whatsappPhone = "33784835972";

/* =========================
   i18n
========================= */

const i18n = {
  fr: {
    title: "Alejandra",
    subtitle: "Barre & Pilates en visio",
    proofLabel: "PREUVES",
    proofGiven: "cours donnés",
    proofPeople: "personnes / semaine",
    proofTooltip: "Cours collectifs et cours individuels confondus.",
    accroche: "J’aide les femmes à se sentir fortes et bien dans leur corps, en visio depuis chez elles. 👇",
    microline: "Réserve en 30 secondes.",
    segVisio: "Visio",
    segNantes: "Nantes",
    sectionTitle: "Choisis ton cours",
    o1Title: "Visio collectif",
    o1Small: "39€ / mois",
    o2Title: "Visio individuel",
    o2Small: "269€ / mois",
    o3Title: "Nantes collectif",
    o3Small: " — 10€ / séance",
    o4Title: "Nantes individuel",
    o4Small: " — 50€ / séance",
    trialBadge: "7 jours gratuits",
    unitPay: "Paiement à l’unité",
    trustLine: "Paiement sécurisé • Abonnements gérés par Stripe",
    trustLine2: "Paiement sécurisé • Confirmation immédiate",
    helpTitle: "Je t’aide à choisir (WhatsApp)",
    helpSub: "Conseil rapide et gratuit",
    t1: "“Séances fluides, efficaces et agréables.”",
    t1Author: "Karla — Mexico",
    t2: "“Un accompagnement premium qui change tout.”",
    t2Author: "Léa — Nantes",
    t3: "“Le Pilates à la maison n’a jamais été aussi motivant.”",
    t3Author: "Mélodie — Pornic",
    waMsg: "Bonjour Alejandra, je viens d’Instagram. Peux-tu m’aider à choisir mon cours ? Objectif : ____ / Niveau : ____ / Dispos : ____"
  },
  es: {
    title: "Alejandra",
    subtitle: "Barre & Pilates online",
    proofLabel: "PRUEBAS",
    proofGiven: "clases dadas",
    proofPeople: "personas / semana",
    proofTooltip: "Clases grupales e individuales combinadas.",
    accroche: "Ayudo a las mujeres a sentirse fuertes y bien en su cuerpo, en clases online desde casa. 👇",
    microline: "Reserva en 30 segundos.",
    segVisio: "Online",
    segNantes: "Nantes",
    sectionTitle: "Elige tu clase",
    o1Title: "Online grupal",
    o1Small: "39€ / mes",
    o2Title: "Online individual",
    o2Small: "269€ / mes",
    o3Title: "Nantes grupal",
    o3Small: " — 10€ / clase",
    o4Title: "Nantes individual",
    o4Small: " — 50€ / clase",
    trialBadge: "7 días gratis",
    unitPay: "Pago por clase",
    trustLine: "Pago seguro • Suscripciones gestionadas por Stripe",
    trustLine2: "Pago seguro • Confirmación inmediata",
    helpTitle: "Te ayudo a elegir (WhatsApp)",
    helpSub: "Consejo rápido y gratis",
    t1: "“Sesiones fluidas, eficaces y agradables.”",
    t1Author: "Karla — México",
    t2: "“Un acompañamiento premium que lo cambia todo.”",
    t2Author: "Léa — Nantes",
    t3: "“El Pilates en casa nunca fue tan motivador.”",
    t3Author: "Mélodie — Pornic",
    waMsg: "Hola Alejandra, vengo de Instagram. ¿Me ayudas a elegir mi clase? Objetivo: ____ / Nivel: ____ / Disponibilidad: ____"
  }
};

let currentLang = "fr";

/* =========================
   Helpers
========================= */

function encodeWa(text) {
  return encodeURIComponent(text);
}

function waLink(message) {
  return `https://wa.me/${whatsappPhone}?text=${encodeWa(message)}`;
}

function setBgImages() {
  const hero = HERO_IMAGE_URL.trim();
  const avatar = (AVATAR_IMAGE_URL.trim() || hero);

  if (hero) document.documentElement.style.setProperty("--hero-url", `url("${hero}")`);
  if (avatar) document.documentElement.style.setProperty("--avatar-url", `url("${avatar}")`);
}

/* =========================
   Init links
========================= */

function initLinks() {
  document.getElementById("offer-visio-collectif").href = offers.visioCollectif;
  document.getElementById("offer-visio-individuel").href = offers.visioIndividuel;
  document.getElementById("offer-nantes-collectif").href = offers.nantesCollectif;
  document.getElementById("offer-nantes-individuel").href = offers.nantesIndividuel;

  // Footer links
  document.getElementById("ig-link").href = instagramUrl;
  document.getElementById("mail-link").href = `mailto:${email}`;
  document.getElementById("wa-link").href = waLink(i18n[currentLang].waMsg);

  // Hero links
  document.getElementById("ig-hero").href = instagramUrl;
  document.getElementById("mail-hero").href = `mailto:${email}`;
  document.getElementById("wa-hero").href = waLink(i18n[currentLang].waMsg);
}

/* =========================
   Language
========================= */

function applyLang(lang) {
  currentLang = lang;

  // lang buttons state
  document.querySelectorAll(".langBtn").forEach(btn => {
    const isActive = btn.dataset.lang === lang;
    btn.classList.toggle("isActive", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  // text
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (i18n[lang][key]) el.textContent = i18n[lang][key];
  });

  // Update stats if already initialized
  initStats(false); // don't animate on lang change

  // WhatsApp link updates
  document.getElementById("whatsapp-help").href = waLink(i18n[lang].waMsg);
  document.getElementById("wa-link").href = waLink(i18n[lang].waMsg);
  document.getElementById("wa-hero").href = waLink(i18n[lang].waMsg);
}

/* =========================
   Segment (Visio/Nantes)
========================= */

function setSegment(seg) {
  document.querySelectorAll(".segBtn").forEach(btn => {
    const isActive = btn.dataset.seg === seg;
    btn.classList.toggle("isActive", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  document.querySelectorAll(".panel").forEach(p => {
    p.classList.toggle("isActive", p.dataset.panel === seg);
  });
}

/* =========================
   Stats & Tooltip
========================= */

let hasAnimatedStats = false;

function initStats(animate = true) {
  const baseCount = 2496;
  const baseDate = new Date("2026-03-10T00:00:00");
  const incrementPerDay = 3;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = Math.max(0, today - baseDate);
  const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const total = baseCount + (daysElapsed * incrementPerDay);
  
  // Format date (fr-FR or es-ES)
  const locale = currentLang === "es" ? "es-ES" : "fr-FR";
  const dateOptions = { day: "numeric", month: "long", year: "numeric" };
  const formattedDate = today.toLocaleDateString(locale, dateOptions);
  
  const totalEl = document.getElementById("proofTotal");
  const dateEl = document.getElementById("proofDate");

  if (dateEl) {
    const prefix = currentLang === "es" ? "al " : "au ";
    dateEl.textContent = prefix + formattedDate;
  }

  if (totalEl) {
    if (animate && !hasAnimatedStats) {
      animateCount(totalEl, total - 30, total, 700);
      hasAnimatedStats = true;
    } else {
      totalEl.textContent = new Intl.NumberFormat(locale).format(total);
    }
  }
}

function animateCount(el, start, end, duration) {
  let startTimestamp = null;
  const locale = currentLang === "es" ? "es-ES" : "fr-FR";
  
  // Easing function: easeOutQuad
  const easeOutQuad = (t) => t * (2 - t);
  
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const elapsed = timestamp - startTimestamp;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutQuad(progress);
    
    const current = Math.floor(easedProgress * (end - start) + start);
    el.textContent = new Intl.NumberFormat(locale).format(current);
    
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

function initTooltip() {
  const trigger = document.querySelector(".proofInfo");
  const tooltip = document.querySelector(".proofTooltip");
  if (!trigger || !tooltip) return;

  const toggle = (state) => {
    const isExpanded = state !== undefined ? state : trigger.getAttribute("aria-expanded") === "true";
    const newState = !isExpanded;
    trigger.setAttribute("aria-expanded", newState);
    tooltip.style.display = newState ? "block" : "none";
  };

  // Mobile tap
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    toggle();
  });

  // Close on tap outside
  document.addEventListener("click", () => {
    trigger.setAttribute("aria-expanded", "false");
    tooltip.style.display = "none";
  });
}

/* =========================
   Boot
========================= */

setBgImages();
initLinks();
initTooltip();
applyLang("fr");
initStats(true); // Call with animation after language is applied
setSegment("visio");

document.querySelectorAll(".langBtn").forEach(btn => {
  btn.addEventListener("click", () => applyLang(btn.dataset.lang));
});

document.querySelectorAll(".segBtn").forEach(btn => {
  btn.addEventListener("click", () => setSegment(btn.dataset.seg));
});

// WhatsApp help link
document.getElementById("whatsapp-help").href = waLink(i18n[currentLang].waMsg);

/* =========================
   Scroll to Top
========================= */

function initScrollToTop() {
  const scrollBtn = document.getElementById("scrollToTop");
  if (!scrollBtn) return;

  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 300) {
      scrollBtn.classList.add("isVisible");
    } else {
      scrollBtn.classList.remove("isVisible");
    }
  });

  scrollBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

initScrollToTop();
