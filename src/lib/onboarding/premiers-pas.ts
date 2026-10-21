/**
 * « Premiers pas » : tuto guidé du tableau de bord, liste de démarrage et aide « Comment ça marche ? » par page.
 * Logique pure et textes (FR / ES / EN) — aucun accès réseau ni base ici.
 */

export type OnboardingLang = 'fr' | 'es' | 'en';

export function onboardingLang(lang: string | null | undefined): OnboardingLang {
  return lang === 'es' ? 'es' : lang === 'en' ? 'en' : 'fr';
}

/* ——— Clés et événements partagés ——— */

/** localStorage : tuto déjà vu sur cet appareil (fermé, passé ou terminé). */
export const TOUR_SEEN_KEY = 'fm_tour_v1';
/** localStorage : la cliente a cliqué « Ajouter à mon calendrier » avec succès. */
export const CALENDAR_SUBSCRIBED_KEY = 'fm_calendar_subscribed';
/** Cookie : liste « Tes premiers pas » masquée (lu côté serveur pour éviter un clignotement). */
export const PREMIERS_PAS_HIDDEN_COOKIE = 'fm_premiers_pas_masque';
/** Événement (window) : relancer le tuto depuis le bouton « ? ». */
export const OPEN_TOUR_EVENT = 'fm:open-tour';
/** Événement (window) : abonnement calendrier réussi (coche la liste sans recharger). */
export const CALENDAR_SUBSCRIBED_EVENT = 'fm:calendar-subscribed';
/** Attribut posé sur window quand le tuto est prêt sur la page (le bouton « ? » le relance au lieu d'ouvrir l'aide). */
export const TOUR_READY_FLAG = '__fmTourReady';

/** Vidéo de bienvenue (sous-titres incrustés) ; null = pas de vidéo dans cette langue, le texte suffit. */
export const WELCOME_VIDEO: Record<OnboardingLang, string | null> = {
  fr: '/onboarding/bienvenue-fr.mp4',
  es: '/onboarding/bienvenue-es.mp4',
  en: null,
};
export const WELCOME_VIDEO_POSTER: Record<OnboardingLang, string | null> = {
  fr: '/onboarding/bienvenue-fr.jpg',
  es: '/onboarding/bienvenue-es.jpg',
  en: null,
};

/* ——— Tuto guidé ——— */

export type TourTarget = 'next-live' | 'programme' | 'planning' | 'replays';

export type TourStep = { id: TourTarget; title: string; body: string };

export type TourCopy = {
  welcomeTitle: string;
  welcomeBody: string;
  /** Même texte quand les programmes sont éteints (pas de « programme » promis). */
  welcomeBodyNoProgramme: string;
  start: string;
  next: string;
  prev: string;
  done: string;
  skip: string;
  replayHint: string;
  stepOf: string;
  close: string;
  videoLabel: string;
  steps: TourStep[];
};

const TOUR_COPY: Record<OnboardingLang, TourCopy> = {
  fr: {
    welcomeTitle: 'Bienvenue',
    welcomeBody:
      'Ton espace FitMangas en 1 minute : où rejoindre les lives d’Alejandra, ton programme, ton planning et tes replays.',
    welcomeBodyNoProgramme:
      'Ton espace FitMangas en 1 minute : où rejoindre les lives d’Alejandra, ton planning et tes replays.',
    start: 'Me faire visiter (1 min)',
    next: 'Suivant',
    prev: 'Précédent',
    done: 'Terminer',
    skip: 'Passer',
    replayHint: 'Tu peux revoir ce tuto quand tu veux avec le bouton',
    stepOf: 'Étape',
    close: 'Fermer le tuto',
    videoLabel: 'Vidéo de bienvenue FitMangas',
    steps: [
      {
        id: 'next-live',
        title: 'Prochain live',
        body: 'C’est ici que tu rejoins Alejandra en visio : elle te voit et te corrige en direct.',
      },
      {
        id: 'programme',
        title: 'Mon programme sur mesure',
        body: 'Fais le test de niveau en 2 minutes : il te dit par quel programme commencer.',
      },
      {
        id: 'planning',
        title: 'Planning',
        body: 'Tous les lives de la semaine et tes séances, à ton heure. Ajoute-les à ton agenda en un clic.',
      },
      {
        id: 'replays',
        title: 'Replays & bibliothèque',
        body: 'Tu as raté un live ? Le replay t’attend.',
      },
    ],
  },
  es: {
    welcomeTitle: 'Bienvenida',
    welcomeBody:
      'Tu espacio FitMangas en 1 minuto: dónde unirte a los lives de Alejandra, tu programa, tu planning y tus replays.',
    welcomeBodyNoProgramme:
      'Tu espacio FitMangas en 1 minuto: dónde unirte a los lives de Alejandra, tu planning y tus replays.',
    start: 'Hacer el recorrido (1 min)',
    next: 'Siguiente',
    prev: 'Anterior',
    done: 'Terminar',
    skip: 'Saltar',
    replayHint: 'Puedes volver a ver este tutorial cuando quieras con el botón',
    stepOf: 'Paso',
    close: 'Cerrar el tutorial',
    videoLabel: 'Video de bienvenida FitMangas',
    steps: [
      {
        id: 'next-live',
        title: 'Próximo live',
        body: 'Aquí te unes a Alejandra por videollamada: te ve y te corrige en vivo.',
      },
      {
        id: 'programme',
        title: 'Mi programa a medida',
        body: 'Haz el test de nivel en 2 minutos: te dice con qué programa empezar.',
      },
      {
        id: 'planning',
        title: 'Planning',
        body: 'Todos los lives de la semana y tus sesiones, a tu hora. Agrégalos a tu calendario en un clic.',
      },
      {
        id: 'replays',
        title: 'Replays y biblioteca',
        body: '¿Te perdiste un live? El replay te espera.',
      },
    ],
  },
  en: {
    welcomeTitle: 'Welcome',
    welcomeBody:
      'Your FitMangas space in 1 minute: where to join Alejandra’s lives, your programme, your schedule and your replays.',
    welcomeBodyNoProgramme:
      'Your FitMangas space in 1 minute: where to join Alejandra’s lives, your schedule and your replays.',
    start: 'Show me around (1 min)',
    next: 'Next',
    prev: 'Back',
    done: 'Done',
    skip: 'Skip',
    replayHint: 'You can replay this tour anytime with the button',
    stepOf: 'Step',
    close: 'Close the tour',
    videoLabel: 'FitMangas welcome video',
    steps: [
      {
        id: 'next-live',
        title: 'Next live',
        body: 'This is where you join Alejandra on video: she sees you and corrects you live.',
      },
      {
        id: 'programme',
        title: 'My tailored programme',
        body: 'Take the 2-minute level test: it tells you which programme to start with.',
      },
      {
        id: 'planning',
        title: 'Schedule',
        body: 'All of the week’s lives and your sessions, in your time zone. Add them to your calendar in one click.',
      },
      {
        id: 'replays',
        title: 'Replays & library',
        body: 'Missed a live? The replay is waiting for you.',
      },
    ],
  },
};

export function tourCopy(lang: OnboardingLang): TourCopy {
  return TOUR_COPY[lang];
}

/** Titre de la fenêtre de bienvenue (« Bienvenue Jenny 💛 », ou sans prénom). */
export function welcomeTitle(lang: OnboardingLang, firstName: string | null | undefined): string {
  const base = tourCopy(lang).welcomeTitle;
  const name = (firstName ?? '').trim();
  return name ? `${base} ${name} 💛` : `${base} 💛`;
}

/** Étapes réellement affichables : celles dont la cible existe sur la page (ex. programmes éteints → sautée). */
export function availableTourSteps(lang: OnboardingLang, presentTargets: Iterable<string>): TourStep[] {
  const present = new Set(presentTargets);
  return tourCopy(lang).steps.filter((s) => present.has(s.id));
}

/* ——— Liste « Tes premiers pas » ——— */

export type PremiersPasItemId = 'account' | 'level-test' | 'calendar' | 'first-live' | 'first-replay';

export type PremiersPasItem = { id: PremiersPasItemId; label: string; href: string | null; done: boolean };

export type PremiersPasFacts = {
  /** Test de niveau fait (cookie du test) ou programme déjà démarré. */
  levelTestDone: boolean;
  /** Abonnement calendrier confirmé (connu seulement dans le navigateur ; false côté serveur). */
  calendarSubscribed: boolean;
  /** profiles.live_visit_count */
  liveVisits: number;
  /** profiles.total_replay_watch_seconds */
  replaySeconds: number;
};

const ITEM_LABELS: Record<OnboardingLang, Record<PremiersPasItemId, string>> = {
  fr: {
    account: 'Compte créé',
    'level-test': 'Test de niveau (2 min)',
    calendar: 'Lives dans ton agenda',
    'first-live': 'Ton premier live',
    'first-replay': 'Un replay regardé',
  },
  es: {
    account: 'Cuenta creada',
    'level-test': 'Test de nivel (2 min)',
    calendar: 'Lives en tu calendario',
    'first-live': 'Tu primer live',
    'first-replay': 'Un replay visto',
  },
  en: {
    account: 'Account created',
    'level-test': 'Level test (2 min)',
    calendar: 'Lives in your calendar',
    'first-live': 'Your first live',
    'first-replay': 'A replay watched',
  },
};

export const PREMIERS_PAS_COPY: Record<
  OnboardingLang,
  { title: string; accent: string; hide: string; doneLabel: string; progress: (d: number, t: number) => string }
> = {
  fr: {
    title: 'Tes premiers pas',
    accent: 'un pas après l’autre.',
    hide: 'Masquer',
    doneLabel: 'Fait',
    progress: (d, t) => `${d} / ${t}`,
  },
  es: {
    title: 'Tus primeros pasos',
    accent: 'paso a paso.',
    hide: 'Ocultar',
    doneLabel: 'Hecho',
    progress: (d, t) => `${d} / ${t}`,
  },
  en: {
    title: 'Your first steps',
    accent: 'one step at a time.',
    hide: 'Hide',
    doneLabel: 'Done',
    progress: (d, t) => `${d} / ${t}`,
  },
};

/**
 * Les 5 étapes, « Compte créé » toujours cochée (une liste déjà commencée donne envie d'aller au bout).
 * Programmes éteints : pas d'étape « Test de niveau » (la page /test-niveau n'existe pas) → 4 étapes.
 */
export function buildPremiersPasItems(
  lang: OnboardingLang,
  facts: PremiersPasFacts,
  options: { programmes?: boolean } = {},
): PremiersPasItem[] {
  const l = ITEM_LABELS[lang];
  const programmes = options.programmes ?? true;
  const items: PremiersPasItem[] = [
    { id: 'account', label: l.account, href: null, done: true },
    { id: 'level-test', label: l['level-test'], href: '/test-niveau', done: facts.levelTestDone },
    { id: 'calendar', label: l.calendar, href: '/compte/planning', done: facts.calendarSubscribed },
    { id: 'first-live', label: l['first-live'], href: '/compte/planning', done: facts.liveVisits > 0 },
    { id: 'first-replay', label: l['first-replay'], href: '/compte/replays', done: facts.replaySeconds > 0 },
  ];
  return programmes ? items : items.filter((i) => i.id !== 'level-test');
}

export function premiersPasProgress(items: PremiersPasItem[]): {
  done: number;
  total: number;
  percent: number;
  complete: boolean;
} {
  const total = items.length;
  const done = items.filter((i) => i.done).length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0, complete: total > 0 && done === total };
}

export const PREMIERS_PAS_WINDOW_DAYS = 30;

/** Visible pendant les 30 premiers jours du compte ou tant que l'essai est en cours, sauf si masquée. */
export function shouldShowPremiersPas(params: {
  accountCreatedAt: string | null | undefined;
  now: Date;
  isTrialing: boolean;
  hidden: boolean;
}): boolean {
  if (params.hidden) return false;
  if (params.isTrialing) return true;
  const created = params.accountCreatedAt ? Date.parse(params.accountCreatedAt) : NaN;
  if (Number.isNaN(created)) return false;
  return params.now.getTime() - created <= PREMIERS_PAS_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

/* ——— Aide « Comment ça marche ? » par page ——— */

export type PageHelpId =
  | 'dashboard'
  | 'planning'
  | 'programmes'
  | 'videos'
  | 'self-knowledge'
  | 'shop'
  | 'referral'
  | 'blog'
  | 'notifications'
  | 'preferences'
  | 'profile'
  | 'progress';

export type PageHelp = { id: PageHelpId; page: string; lines: [string, string, string] };

/** Préfixes testés dans l'ordre (le plus précis d'abord). */
const HELP_ROUTES: Array<{ prefix: string; id: PageHelpId }> = [
  { prefix: '/compte/connaissance-de-soi/progression', id: 'progress' },
  { prefix: '/compte/connaissance-de-soi', id: 'self-knowledge' },
  { prefix: '/compte/planning', id: 'planning' },
  { prefix: '/compte/programmes', id: 'programmes' },
  { prefix: '/compte/replays', id: 'videos' },
  { prefix: '/compte/boutique', id: 'shop' },
  { prefix: '/compte/parrainage', id: 'referral' },
  { prefix: '/compte/blog', id: 'blog' },
  { prefix: '/compte/notifications', id: 'notifications' },
  { prefix: '/compte/preferences', id: 'preferences' },
  { prefix: '/compte/profil', id: 'profile' },
  { prefix: '/compte/progression', id: 'progress' },
];

export function pageHelpIdForPath(pathname: string | null | undefined): PageHelpId {
  const path = (pathname ?? '').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  for (const r of HELP_ROUTES) {
    if (path === r.prefix || path.startsWith(`${r.prefix}/`)) return r.id;
  }
  return 'dashboard';
}

const HELP: Record<OnboardingLang, Record<PageHelpId, { page: string; lines: [string, string, string] }>> = {
  fr: {
    dashboard: {
      page: 'Tableau de bord',
      lines: [
        'Le prochain live : « Rejoindre » t’emmène dans la salle visio, où Alejandra te voit et te corrige.',
        'Ton programme sur mesure et le planning de la semaine.',
        'Tes replays et ta bibliothèque, à regarder quand tu veux.',
      ],
    },
    planning: {
      page: 'Planning',
      lines: [
        'Tous les lives de la semaine, à l’heure de ton fuseau (modifiable dans ton profil).',
        'Le jour du live, « Rejoindre » t’emmène dans la salle visio. Les lives passés restent grisés, avec leur replay.',
        '« Ajouter à mon calendrier » : les lives arrivent tout seuls dans ton agenda.',
      ],
    },
    programmes: {
      page: 'Programmes',
      lines: [
        'Un programme, ce sont des séances vidéo dans le bon ordre, entre deux lives.',
        'Pas sûre duquel choisir ? Le test de niveau (2 min) te le recommande.',
        'Tu choisis tes jours et ton heure : tes séances apparaissent dans ton planning.',
      ],
    },
    videos: {
      page: 'Vidéos',
      lines: [
        'Les replays : les lives enregistrés, à revoir quand tu veux.',
        'La bibliothèque : des séances vidéo à faire à ton rythme.',
        'Utilise les filtres et garde tes vidéos préférées en favoris.',
      ],
    },
    'self-knowledge': {
      page: 'Connaissance de soi',
      lines: [
        'Des tests pour mieux te connaître : ton énergie, ta façon de créer du lien, de tenir dans la durée.',
        'Chaque test se termine par un rapport personnel.',
        'Ta progression mensuelle est ici aussi : les cours suivis ce mois-ci.',
      ],
    },
    shop: {
      page: 'Boutique',
      lines: [
        'Tapis, tenues et accessoires FitMangas.',
        'Chaque article est fabriqué à la demande, puis livré chez toi.',
        'Tes commandes et leur suivi sont ici.',
      ],
    },
    referral: {
      page: 'Parrainage',
      lines: [
        'Partage ton code ou ton lien personnel avec tes amies.',
        '5 amies abonnées au Visio : ton abonnement est offert.',
        'Le parrainage est réservé aux abonnements Visio.',
      ],
    },
    blog: {
      page: 'Blog',
      lines: [
        'Des articles sur les exercices, la respiration et la posture.',
        'Cherche un sujet ou filtre par catégorie.',
        'Enregistre tes favoris pour les retrouver facilement.',
      ],
    },
    notifications: {
      page: 'Notifications',
      lines: [
        'Tes rappels de lives, les nouveaux replays et les nouveaux articles.',
        'Une pastille rouge veut dire qu’il y a du nouveau.',
        'Choisis ce que tu reçois dans tes préférences.',
      ],
    },
    preferences: {
      page: 'Préférences',
      lines: [
        'Choisis les notifications que tu reçois.',
        'Si tu suis un programme : tes jours et ton heure de séance.',
        'Ta langue et ton fuseau horaire se règlent dans ton profil.',
      ],
    },
    profile: {
      page: 'Profil',
      lines: [
        'Ta photo et tes informations.',
        'Ta langue et ton fuseau horaire : les heures des lives s’affichent à ton heure.',
        'Ton abonnement, tes factures et ton mot de passe.',
      ],
    },
    progress: {
      page: 'Progression',
      lines: [
        'Tes cours suivis, mois après mois.',
        'L’anneau du tableau de bord montre ton mois en cours.',
        'Ton niveau évolue avec ta régularité.',
      ],
    },
  },
  es: {
    dashboard: {
      page: 'Inicio',
      lines: [
        'El próximo live: «Unirse» te lleva a la sala, donde Alejandra te ve y te corrige.',
        'Tu programa a medida y el planning de la semana.',
        'Tus replays y tu biblioteca, para ver cuando quieras.',
      ],
    },
    planning: {
      page: 'Planning',
      lines: [
        'Todos los lives de la semana, a la hora de tu zona horaria (la cambias en tu perfil).',
        'El día del live, «Unirme» te lleva a la sala. Los lives pasados quedan en gris, con su replay.',
        '«Añadir a mi calendario»: los lives llegan solos a tu calendario.',
      ],
    },
    programmes: {
      page: 'Programas',
      lines: [
        'Un programa son sesiones en video en el orden correcto, entre dos lives.',
        '¿No sabes cuál elegir? El test de nivel (2 min) te lo recomienda.',
        'Eliges tus días y tu hora: tus sesiones aparecen en tu planning.',
      ],
    },
    videos: {
      page: 'Videos',
      lines: [
        'Los replays: los lives grabados, para volver a verlos cuando quieras.',
        'La biblioteca: sesiones en video para hacer a tu ritmo.',
        'Usa los filtros y guarda tus videos preferidos en favoritos.',
      ],
    },
    'self-knowledge': {
      page: 'Autoconocimiento',
      lines: [
        'Tests para conocerte mejor: tu energía, tu forma de crear vínculo, de mantenerte constante.',
        'Cada test termina con un informe personal.',
        'Tu progreso mensual también está aquí: las clases seguidas este mes.',
      ],
    },
    shop: {
      page: 'Tienda',
      lines: [
        'Tapetes, ropa y accesorios FitMangas.',
        'Cada artículo se fabrica bajo pedido y se envía a tu casa.',
        'Tus pedidos y su seguimiento están aquí.',
      ],
    },
    referral: {
      page: 'Referidos',
      lines: [
        'Comparte tu código o tu enlace personal con tus amigas.',
        '5 amigas suscritas a Visio: tu suscripción es gratis.',
        'El programa de referidos es para las suscripciones Visio.',
      ],
    },
    blog: {
      page: 'Blog',
      lines: [
        'Artículos sobre ejercicios, respiración y postura.',
        'Busca un tema o filtra por categoría.',
        'Guarda tus favoritos para encontrarlos fácilmente.',
      ],
    },
    notifications: {
      page: 'Notificaciones',
      lines: [
        'Tus recordatorios de lives, los nuevos replays y los nuevos artículos.',
        'Un punto rojo quiere decir que hay novedades.',
        'Elige lo que recibes en tus preferencias.',
      ],
    },
    preferences: {
      page: 'Preferencias',
      lines: [
        'Elige las notificaciones que recibes.',
        'Si sigues un programa: tus días y tu hora de sesión.',
        'Tu idioma y tu zona horaria se ajustan en tu perfil.',
      ],
    },
    profile: {
      page: 'Perfil',
      lines: [
        'Tu foto y tus datos.',
        'Tu idioma y tu zona horaria: las horas de los lives se muestran a tu hora.',
        'Tu suscripción, tus facturas y tu contraseña.',
      ],
    },
    progress: {
      page: 'Progreso',
      lines: [
        'Tus clases seguidas, mes a mes.',
        'El anillo del inicio muestra tu mes en curso.',
        'Tu nivel evoluciona con tu constancia.',
      ],
    },
  },
  en: {
    dashboard: {
      page: 'Dashboard',
      lines: [
        'Next live: “Join” takes you into the video room, where Alejandra sees you and corrects you.',
        'Your tailored programme and the week’s schedule.',
        'Your replays and library, to watch whenever you like.',
      ],
    },
    planning: {
      page: 'Schedule',
      lines: [
        'All of the week’s lives, in your time zone (change it in your profile).',
        'On the day, “Join” takes you into the video room. Past lives stay greyed out, with their replay.',
        '“Add to my calendar”: lives appear in your calendar automatically.',
      ],
    },
    programmes: {
      page: 'Programmes',
      lines: [
        'A programme is a set of video sessions in the right order, between two lives.',
        'Not sure which one? The 2-minute level test recommends one.',
        'Pick your days and time: your sessions show up in your schedule.',
      ],
    },
    videos: {
      page: 'Videos',
      lines: [
        'Replays: recorded lives, to watch again whenever you like.',
        'Library: video sessions to do at your own pace.',
        'Use the filters and save your favourite videos.',
      ],
    },
    'self-knowledge': {
      page: 'Self-knowledge',
      lines: [
        'Tests to know yourself better: your energy, how you connect with others, how you keep going.',
        'Each test ends with a personal report.',
        'Your monthly progress is here too: the classes you followed this month.',
      ],
    },
    shop: {
      page: 'Shop',
      lines: [
        'FitMangas mats, outfits and accessories.',
        'Each item is made to order, then shipped to you.',
        'Your orders and their tracking are here.',
      ],
    },
    referral: {
      page: 'Referrals',
      lines: [
        'Share your personal code or link with your friends.',
        '5 friends subscribed to Visio: your subscription is free.',
        'Referrals are for Visio subscriptions.',
      ],
    },
    blog: {
      page: 'Blog',
      lines: [
        'Articles about exercises, breathing and posture.',
        'Search for a topic or filter by category.',
        'Save your favourites to find them easily.',
      ],
    },
    notifications: {
      page: 'Notifications',
      lines: [
        'Your live reminders, new replays and new articles.',
        'A red dot means there is something new.',
        'Choose what you receive in your preferences.',
      ],
    },
    preferences: {
      page: 'Preferences',
      lines: [
        'Choose the notifications you receive.',
        'If you follow a programme: your session days and time.',
        'Your language and time zone are set in your profile.',
      ],
    },
    profile: {
      page: 'Profile',
      lines: [
        'Your photo and details.',
        'Your language and time zone: live times show in your time zone.',
        'Your subscription, invoices and password.',
      ],
    },
    progress: {
      page: 'Progress',
      lines: [
        'Your classes, month after month.',
        'The ring on the dashboard shows your current month.',
        'Your level grows with your consistency.',
      ],
    },
  },
};

export function pageHelp(lang: OnboardingLang, pathname: string | null | undefined): PageHelp {
  const id = pageHelpIdForPath(pathname);
  const h = HELP[lang][id];
  return { id, page: h.page, lines: h.lines };
}

export const PAGE_HELP_COPY: Record<
  OnboardingLang,
  { button: string; title: string; contact: string; close: string }
> = {
  fr: {
    button: 'Comment ça marche ?',
    title: 'Comment ça marche ?',
    contact: 'Une question ? Écris à l’équipe',
    close: 'Fermer',
  },
  es: {
    button: '¿Cómo funciona?',
    title: '¿Cómo funciona?',
    contact: '¿Una pregunta? Escribe al equipo',
    close: 'Cerrar',
  },
  en: {
    button: 'How does it work?',
    title: 'How does it work?',
    contact: 'A question? Write to the team',
    close: 'Close',
  },
};
