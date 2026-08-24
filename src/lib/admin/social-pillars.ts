import { createAdminClient } from '@/lib/supabase/admin';

/** Familles éditoriales CM v4 — mix hebdo (plus « 1 symptôme / semaine »). */
export const CONTENT_FAMILY_IDS = ['portee', 'confiance', 'conversion'] as const;
export type ContentFamilyId = (typeof CONTENT_FAMILY_IDS)[number];

export const CONTENT_FAMILY_LABELS: Record<ContentFamilyId, string> = {
  portee: 'Portée',
  confiance: 'Confiance',
  conversion: 'Conversion',
};

export type ContentThemeId =
  | 'postpartum'
  | 'perimenopause'
  | 'corps_bureau'
  | 'energie_crash'
  | 'sommeil_sn'
  | 'stress'
  | 'cours_visio'
  | 'histoire_alejandra'
  | 'correction_direct'
  | 'communaute_mangitas'
  | 'progres_adherente'
  | 'obj_souple'
  | 'obj_temps'
  | 'obj_materiel'
  | 'obj_honte'
  | 'obj_rate_cours'
  | 'essai_gratuit'
  | 'prix_assume'
  // legacy IDs (historique v3) — mappés vers familles
  | 'dos'
  | 'bassin'
  | 'hanches'
  | 'sommeil'
  | 'energie'
  | 'confiance';

export type ContentTheme = {
  id: ContentThemeId;
  family: ContentFamilyId;
  label: string;
  labelEs: string;
  angle: string;
  angleEs: string;
  /** CTA forcé pour conversion (essai gratuit). */
  forceTrialCta?: boolean;
  /** Visuel : montrer produit/coach (pas exo générique). */
  showProductOrCoach?: boolean;
  reelAnglesFr: string[];
  reelAnglesEs: string[];
};

/** Alias rétrocompat : l’ancien « pilier » = thème. */
export type WeeklyPillarId = ContentThemeId;
export type WeeklyPillar = ContentTheme;

export const CONTENT_THEMES: ContentTheme[] = [
  // ——— PORTÉE ———
  {
    id: 'postpartum',
    family: 'portee',
    label: 'Post-partum / périnée',
    labelEs: 'Postparto / suelo pélvico',
    angle: 'Reprendre sans se sentir seule — rendez-vous fixe + correction, pas YouTube.',
    angleEs: 'Retomar sin sentirse sola — cita fija + corrección, no YouTube.',
    reelAnglesFr: [
      'Le corps après bébé n’est pas « cassé »',
      'Périnée : ce qu’on n’ose pas dire',
      'Pourquoi seule à la maison ça n’a pas tenu',
      'Être vue en visio change tout',
      'Le rendez-vous fixe vs la bonne intention',
    ],
    reelAnglesEs: [
      'El cuerpo tras el bebé no está « roto »',
      'Suelo pélvico: lo que no se dice',
      'Por qué sola en casa no se sostuvo',
      'Ser vista en visio lo cambia todo',
      'La cita fija vs la buena intención',
    ],
  },
  {
    id: 'perimenopause',
    family: 'portee',
    label: 'Périménopause / 45+',
    labelEs: 'Perimenopausia / 45+',
    angle: 'Segment massif négligé — corps qui change, besoin d’être accompagnée.',
    angleEs: 'Segmento masivo descuidado — cuerpo que cambia, necesita acompañamiento.',
    reelAnglesFr: [
      'À 45+ le corps change — ce n’est pas un verdict',
      'Ce que la périménopause fait au bassin',
      'Énergie qui chute : ce n’est pas la volonté',
      'Un cours où on te regarde vraiment',
      'Rejoindre sans salle de sport',
    ],
    reelAnglesEs: [
      'A los 45+ no estás « demasiado vieja »',
      'Lo que hace la perimenopausia a la pelvis',
      'Energía que cae: no es la voluntad',
      'Un curso donde de verdad te miran',
      'Unirte sin gimnasio',
    ],
  },
  {
    id: 'corps_bureau',
    family: 'portee',
    label: 'Corps de bureau',
    labelEs: 'Cuerpo de oficina',
    angle: 'Dos / hanches / bassin / nuque — volume RÉDUIT, ne plus dominer la semaine.',
    angleEs: 'Espalda / caderas / pelvis / cuello — volumen REDUCIDO.',
    reelAnglesFr: [
      'Après 8h assise, le corps demande un rendez-vous',
      'Hanches raides : pas l’âge, la chaise',
      'Nuque crispée en visio pro',
      'Le bassin coincé après la 8e heure',
      'Bouger avec quelqu’un qui te voit',
    ],
    reelAnglesEs: [
      'Tras 8h sentada, el cuerpo pide una cita',
      'Caderas rígidas: no es la edad, es la silla',
      'Cuello tenso en visio pro',
      'La pelvis bloqueada a las 17h',
      'Moverse con alguien que te ve',
    ],
  },
  {
    id: 'energie_crash',
    family: 'portee',
    label: 'Énergie / coup de barre',
    labelEs: 'Energía / bajón',
    angle: 'Crash 15h — pas un manque de café, un corps sans signal de relâche.',
    angleEs: 'Bajón 15h — no es falta de café.',
    reelAnglesFr: [
      'Le coup de barre de 15h',
      'Café #3 vs 20 min de cours fixe',
      'Énergie stable avec rendez-vous',
      'Fatigue ≠ paresse',
      'Envoie ça à ta collègue de bureau',
    ],
    reelAnglesEs: [
      'El bajón de las 15h',
      'Café #3 vs 20 min de clase fija',
      'Energía estable con cita',
      'Cansancio ≠ pereza',
      'Envía esto a tu compañera',
    ],
  },
  {
    id: 'sommeil_sn',
    family: 'portee',
    label: 'Sommeil / système nerveux',
    labelEs: 'Sueño / sistema nervioso',
    angle: 'Corps qui ne décroche pas le soir — besoin d’être accompagnée, pas d’un tip.',
    angleEs: 'Cuerpo que no desconecta — necesita acompañamiento.',
    reelAnglesFr: [
      'Le corps encore « en réunion » à 22h',
      'Décrocher sans méditer 40 min',
      'Signal au système nerveux en cours',
      'Pourquoi seule le soir ça ne marche pas',
      'Un créneau fixe qui te sort de la boucle',
    ],
    reelAnglesEs: [
      'El cuerpo aún « en reunión » a las 22h',
      'Desconectar sin meditar 40 min',
      'Señal al sistema nervioso en clase',
      'Por qué sola por la noche no funciona',
      'Un horario fijo que te saca del bucle',
    ],
  },
  {
    id: 'stress',
    family: 'portee',
    label: 'Stress',
    labelEs: 'Estrés',
    angle: 'Charge mentale dans le corps — être vue et corrigée, pas « respirer plus fort ».',
    angleEs: 'Carga mental en el cuerpo — ser vista y corregida.',
    reelAnglesFr: [
      'Où le stress se pose dans le corps',
      'Arrêter de « respirer plus fort » seule',
      'Épaules qui montent sans que tu le remarques',
      'Ce que change une coach en direct',
      'Envoie ça à celle qui tient tout',
    ],
    reelAnglesEs: [
      'Dónde se posa el estrés en el cuerpo',
      'Dejar de « respirar más fuerte » sola',
      'Hombros que suben sin que lo notes',
      'Lo que cambia una coach en directo',
      'Envía esto a la que lo sostiene todo',
    ],
  },
  // ——— CONFIANCE ———
  {
    id: 'cours_visio',
    family: 'confiance',
    label: 'À quoi ressemble un cours visio',
    labelEs: 'Cómo es una clase en visio',
    angle: 'Le plus important — montrer le produit réel (écran, correction, groupe).',
    angleEs: 'Lo más importante — mostrar el producto real.',
    showProductOrCoach: true,
    reelAnglesFr: [
      'Ce que tu vois à l’écran en vrai',
      'Ce que tu vois à l’écran : le groupe en live',
      'Le créneau du mardi déjà dans l’agenda',
      'Un écran, plusieurs tapis, une seule heure',
      'Elle te dit d’abord où poser les mains',
    ],
    reelAnglesEs: [
      'Lo que ves en pantalla de verdad',
      'Lo que ves en pantalla: el grupo en vivo',
      'El martes ya está en la agenda',
      'Una pantalla, varios mats, una sola hora',
      'Primero te dice dónde poner las manos',
    ],
  },
  {
    id: 'histoire_alejandra',
    family: 'confiance',
    label: 'Histoire d’Alejandra',
    labelEs: 'Historia de Alejandra',
    angle: 'Pourquoi elle enseigne — identité + preuve humaine.',
    angleEs: 'Por qué enseña — identidad + prueba humana.',
    showProductOrCoach: true,
    reelAnglesFr: [
      'Pourquoi elle a créé FitMangas',
      'Ce qu’elle refuse dans le fitness',
      'De son parcours au studio visio',
      'La coach que tu vois vraiment',
      'Pas une influenceuse : une enseignante',
    ],
    reelAnglesEs: [
      'Por qué creó FitMangas',
      'Lo que rechaza del fitness',
      'De su recorrido al estudio visio',
      'La coach que de verdad ves',
      'No influencer: una maestra',
    ],
  },
  {
    id: 'correction_direct',
    family: 'confiance',
    label: 'Correction en direct',
    labelEs: 'Corrección en directo',
    angle: 'Ce que le gratuit ne peut pas faire — être corrigée maintenant.',
    angleEs: 'Lo que lo gratis no puede — ser corregida ahora.',
    showProductOrCoach: true,
    reelAnglesFr: [
      'La phrase qu’elle te dit en live',
      'Ajustement bassin vu à l’écran',
      'Le « stop » qu’elle te dit avant que ça force',
      'Le détail qui change ta posture',
      'Être vue = progresser plus vite',
    ],
    reelAnglesEs: [
      'La frase que te dice en vivo',
      'Ajuste de pelvis visto en pantalla',
      'El « stop » que te dice antes de forzar',
      'El detalle que cambia tu postura',
      'Ser vista = progresar más rápido',
    ],
  },
  {
    id: 'communaute_mangitas',
    family: 'confiance',
    label: 'Communauté Mangitas',
    labelEs: 'Comunidad Mangitas',
    angle: 'Ne pas être seule — le groupe, les prénoms, la constance.',
    angleEs: 'No estar sola — el grupo, los nombres, la constancia.',
    showProductOrCoach: true,
    reelAnglesFr: [
      'Qui est dans le cours avec toi',
      'Les Mangitas ne jugent pas',
      'Un « salut » en début de live',
      'Tenir parce que d’autres tiennent',
      'Envoie ça à ta copine qui abandonne toujours',
    ],
    reelAnglesEs: [
      'Quién está en clase contigo',
      'Las Mangitas no juzgan',
      'Un « hola » al inicio del live',
      'Agarrarse porque otras se agarran',
      'Envía esto a tu amiga que siempre deja',
    ],
  },
  {
    id: 'progres_adherente',
    family: 'confiance',
    label: 'Progrès d’une Mangita (anonyme)',
    labelEs: 'Progreso de una Mangita (anónima)',
    angle:
      'Preuve sociale SANS prénom ni visage IA : « une Mangita » + vraies photos bibliothèque / détails / citation marque. Jamais un visage généré présenté comme une cliente nommée.',
    angleEs:
      'Prueba social SIN nombre ni cara IA: « una Mangita » + fotos reales de biblioteca / detalles. Nunca un rostro generado como alumna nombrada.',
    showProductOrCoach: true,
    reelAnglesFr: [
      'Ce qu’une Mangita a changé en 6 semaines (sans la nommer)',
      'Elle pensait ne pas être « sportive » — anonymisé',
      'Le moment où ça a tenu — rendez-vous fixe',
      'Ce qu’elle dirait à son ancienne elle',
      'Preuve : le rendez-vous fixe, pas un visage IA',
    ],
    reelAnglesEs: [
      'Lo que cambió una Mangita en 6 semanas (sin nombrarla)',
      'Pensaba que no era « deportista » — anónimo',
      'El momento en que se sostuvo',
      'Lo que le diría a su yo de antes',
      'Prueba: la cita fija, no un rostro IA',
    ],
  },
  // ——— CONVERSION ———
  {
    id: 'obj_souple',
    family: 'conversion',
    label: 'Objection : je ne suis pas souple',
    labelEs: 'Objeción: no soy flexible',
    angle: 'Objection classique → essai gratuit 7 jours.',
    angleEs: 'Objeción clásica → prueba gratis 7 días.',
    forceTrialCta: true,
    reelAnglesFr: [
      'Tu n’as pas besoin d’être souple pour commencer',
      'On adapte, on ne force pas',
      'La honte de ne pas toucher ses pieds',
      'Essai 7 jours pour voir par toi-même',
      'Ce n’est pas un cours de contorsion',
    ],
    reelAnglesEs: [
      'No necesitas ser flexible para empezar',
      'Adaptamos, no forzamos',
      'La vergüenza de no tocar los pies',
      'Prueba 7 días para verlo tú',
      'No es un curso de contorsión',
    ],
  },
  {
    id: 'obj_temps',
    family: 'conversion',
    label: 'Objection : je n’ai pas le temps',
    labelEs: 'Objeción: no tengo tiempo',
    angle: 'Créneau fixe court > bonne intention vague.',
    angleEs: 'Horario fijo corto > buena intención vaga.',
    forceTrialCta: true,
    reelAnglesFr: [
      'Tu n’as pas le temps — c’est pour ça qu’il faut un créneau',
      '20–30 min bloqués vs « un jour »',
      'Le calendrier qui te rappelle',
      'Essai 7 jours : un seul live suffit à juger',
      'Envoie ça à celle qui dit toujours « plus tard »',
    ],
    reelAnglesEs: [
      'No tienes tiempo — por eso necesitas un horario',
      '20–30 min bloqueados vs « un día »',
      'El calendario que te recuerda',
      'Prueba 7 días: un live basta para juzgar',
      'Envía esto a la que siempre dice « luego »',
    ],
  },
  {
    id: 'obj_materiel',
    family: 'conversion',
    label: 'Objection : je n’ai pas de matériel',
    labelEs: 'Objeción: no tengo material',
    angle: 'Tapis + corps suffisent — essai 7 jours.',
    angleEs: 'Esterilla + cuerpo bastan — prueba 7 días.',
    forceTrialCta: true,
    reelAnglesFr: [
      'Pas besoin de salle ni d’élastiques',
      'Un tapis, un écran, une coach',
      'Ce qu’on utilise vraiment en visio',
      'Essai 7 jours depuis ton salon',
      'Zéro matériel fancy requis',
    ],
    reelAnglesEs: [
      'No hace falta gym ni bandas',
      'Una esterilla, una pantalla, una coach',
      'Lo que usamos de verdad en visio',
      'Prueba 7 días desde tu salón',
      'Cero material fancy',
    ],
  },
  {
    id: 'obj_honte',
    family: 'conversion',
    label: 'Objection : j’aurai honte',
    labelEs: 'Objeción: me dará vergüenza',
    angle: 'Caméra optionnelle / bienveillance — essai 7 jours.',
    angleEs: 'Cámara opcional / cuidado — prueba 7 días.',
    forceTrialCta: true,
    reelAnglesFr: [
      'Tu peux garder la caméra off au début',
      'Personne ne te juge sur ton tapis',
      '« Je suis nulle en sport » — on l’entend souvent',
      'Essai 7 jours pour sentir le climat',
      'Le groupe est là pour tenir, pas pour performer',
    ],
    reelAnglesEs: [
      'Puedes dejar la cámara off al inicio',
      'Nadie te juzga en tu esterilla',
      '« Soy mala en deporte » — se oye mucho',
      'Prueba 7 días para sentir el clima',
      'El grupo está para sostener, no para rendir',
    ],
  },
  {
    id: 'obj_rate_cours',
    family: 'conversion',
    label: 'Objection : et si je rate un cours ?',
    labelEs: 'Objeción: ¿y si falto a una clase?',
    angle: 'Replays existants — tu ne perds pas tout.',
    angleEs: 'Replays existen — no lo pierdes todo.',
    forceTrialCta: true,
    reelAnglesFr: [
      'Tu rates un live ? Le replay est là',
      'Le planning + la bibliothèque',
      'Pas de culpabilité si la semaine dérape',
      'Essai 7 jours pour tester le rythme',
      'Tu restes dans le rythme même absente',
    ],
    reelAnglesEs: [
      '¿Faltas a un live? El replay está',
      'El planning + la biblioteca',
      'Sin culpa si la semana se complica',
      'Prueba 7 días para testear el ritmo',
      'Sigues el ritmo aunque faltes',
    ],
  },
  {
    id: 'essai_gratuit',
    family: 'conversion',
    label: 'Essai gratuit 7 jours',
    labelEs: 'Prueba gratis 7 días',
    angle: 'Dire l’essai explicitement — pas « abonne-toi ».',
    angleEs: 'Decir la prueba explícitamente — no « suscríbete ».',
    forceTrialCta: true,
    reelAnglesFr: [
      '7 jours pour juger sans te forcer',
      'Carte pour l’essai, résiliation simple',
      'Ce que tu testes vraiment en 7 jours',
      'Le rendez-vous fixe en vrai',
      'Essai gratuit 7 jours — lien en bio / site',
    ],
    reelAnglesEs: [
      '7 días para juzgar sin forzarte',
      'Tarjeta para la prueba, baja fácil',
      'Lo que pruebas de verdad en 7 días',
      'La cita fija de verdad',
      'Prueba gratis 7 días — enlace en bio',
    ],
  },
  {
    id: 'prix_assume',
    family: 'conversion',
    label: 'Prix assumé',
    labelEs: 'Precio asumido',
    angle: 'Tu ne paies pas YouTube — tu paies pour ne pas être seule.',
    angleEs: 'No pagas YouTube — pagas por no estar sola.',
    forceTrialCta: true,
    reelAnglesFr: [
      'Pourquoi ce n’est pas « trop cher pour du Pilates »',
      'Ce que tu achètes : le rendez-vous + la correction',
      'Le gratuit a un coût : abandonner',
      'Essai 7 jours avant de décider',
      'Le prix de ne plus être seule',
    ],
    reelAnglesEs: [
      'Por qué no es « caro para Pilates »',
      'Lo que compras: la cita + la corrección',
      'Lo gratis tiene un costo: abandonar',
      'Prueba 7 días antes de decidir',
      'El precio de no estar sola',
    ],
  },
];

/** Thèmes actifs (hors legacy). */
export const ACTIVE_CONTENT_THEMES = CONTENT_THEMES.filter(
  (t) =>
    ![
      'dos',
      'bassin',
      'hanches',
      'sommeil',
      'energie',
      'confiance',
    ].includes(t.id),
);

/** @deprecated utiliser CONTENT_THEMES — conservé pour imports existants. */
export const WEEKLY_PILLARS: WeeklyPillar[] = CONTENT_THEMES;

export const WEEKLY_PILLAR_IDS = CONTENT_THEMES.map((t) => t.id) as unknown as readonly ContentThemeId[];

export const SOCIAL_PILLAR_HISTORY_KEY = 'social_pillar_history';

export type PillarHistoryEntry = {
  pillarId: ContentThemeId;
  label: string;
  family?: ContentFamilyId;
  weekStart: string;
  locale?: string;
  createdAt: string;
};

export type WeekThemeAssignment = {
  family: ContentFamilyId;
  themeId: ContentThemeId;
  label: string;
};

export type WeekPlanSnapshot = {
  mixLabel: string;
  counts: { portee: number; confiance: number; conversion: number };
  assignments: WeekThemeAssignment[];
  shareHookSlotIndex: number;
};

export type PillarHistoryStore = {
  version: 1 | 2;
  entries: PillarHistoryEntry[];
  /** Derniers plans semaine (répartition + thèmes). */
  weekPlans?: Array<{
    weekStart: string;
    mixLabel: string;
    themeIds: ContentThemeId[];
    createdAt: string;
  }>;
};

function emptyHistory(): PillarHistoryStore {
  return { version: 2, entries: [], weekPlans: [] };
}

export function getContentTheme(id: string | null | undefined): ContentTheme | null {
  if (!id) return null;
  return CONTENT_THEMES.find((t) => t.id === id) ?? null;
}

/** Alias. */
export function getWeeklyPillar(id: string | null | undefined): WeeklyPillar | null {
  return getContentTheme(id);
}

export function themesForFamily(family: ContentFamilyId): ContentTheme[] {
  return ACTIVE_CONTENT_THEMES.filter((t) => t.family === family);
}

/**
 * Mix 7 posts IG : semaines paires 3/3/1, impaires 3/2/2.
 * Ordre : on aligne plutôt Reels→carousel→feed ; la répartition compte.
 */
export function buildFamilyMixForWeek(weekSeed: number): ContentFamilyId[] {
  const even = Math.abs(weekSeed) % 2 === 0;
  if (even) {
    // 3 portée · 3 confiance · 1 conversion
    return ['portee', 'portee', 'portee', 'confiance', 'confiance', 'confiance', 'conversion'];
  }
  // 3 portée · 2 confiance · 2 conversion
  return ['portee', 'portee', 'portee', 'confiance', 'confiance', 'conversion', 'conversion'];
}

export function describeMix(families: ContentFamilyId[]): string {
  const counts = { portee: 0, confiance: 0, conversion: 0 };
  for (const f of families) counts[f] += 1;
  return `Cette semaine : ${counts.portee} portée · ${counts.confiance} confiance · ${counts.conversion} conversion`;
}

/** 8 derniers thèmes DE CETTE FAMILLE (pas les 8 derniers posts toutes familles). */
function lastThemeIdsInFamily(history: PillarHistoryStore, family: ContentFamilyId, lookback = 8): Set<string> {
  const set = new Set<string>();
  for (const e of history.entries) {
    const theme = getContentTheme(e.pillarId);
    const fam = e.family || theme?.family;
    if (fam !== family) continue;
    set.add(e.pillarId);
    if (set.size >= lookback) break;
  }
  return set;
}

/** Choisit un thème dans la famille en évitant les récents. */
export function pickThemeForFamily(
  family: ContentFamilyId,
  history: PillarHistoryStore,
  seed: number,
  usedThisWeek: Set<string>,
): ContentTheme {
  const pool = themesForFamily(family);
  const recent = lastThemeIdsInFamily(history, family);
  const fresh = pool.filter((t) => !recent.has(t.id) && !usedThisWeek.has(t.id));
  const candidates = fresh.length ? fresh : pool.filter((t) => !usedThisWeek.has(t.id));
  const finalPool = candidates.length ? candidates : pool;
  return finalPool[Math.abs(seed) % finalPool.length]!;
}

/** Plan complet pour N slots (typiquement 7 IG). */
export function buildWeekThemePlan(
  history: PillarHistoryStore,
  slotCount: number,
  weekSeed = Date.now(),
): WeekPlanSnapshot {
  const baseMix = buildFamilyMixForWeek(weekSeed);
  const families: ContentFamilyId[] = [];
  for (let i = 0; i < slotCount; i += 1) {
    families.push(baseMix[i % baseMix.length]!);
  }
  // Si slotCount > 7, prolonger en gardant les ratios approximatifs
  const used = new Set<string>();
  const assignments: WeekThemeAssignment[] = families.map((family, i) => {
    const theme = pickThemeForFamily(family, history, weekSeed + i * 17, used);
    used.add(theme.id);
    return { family, themeId: theme.id, label: theme.label };
  });

  const counts = { portee: 0, confiance: 0, conversion: 0 };
  for (const a of assignments) counts[a.family] += 1;

  // Slot « envoie ça à… » : priorité portée ou confiance (pas conversion pure)
  let shareHookSlotIndex = assignments.findIndex((a) => a.family === 'portee' || a.family === 'confiance');
  if (shareHookSlotIndex < 0) shareHookSlotIndex = 0;

  return {
    mixLabel: describeMix(families),
    counts,
    assignments,
    shareHookSlotIndex,
  };
}

/** @deprecated — un seul pilier/semaine remplacé par buildWeekThemePlan. */
export function pickWeeklyPillar(history: PillarHistoryStore, seed = Date.now()): WeeklyPillar {
  const plan = buildWeekThemePlan(history, 1, seed);
  return getContentTheme(plan.assignments[0]!.themeId)!;
}

export function recentPillars(history: PillarHistoryStore, limit = 8): PillarHistoryEntry[] {
  return history.entries.slice(0, limit);
}

export function recentThemeLabels(history: PillarHistoryStore, limit = 8): string[] {
  return recentPillars(history, limit).map((e) => {
    const fam = e.family || getContentTheme(e.pillarId)?.family;
    const famLabel = fam ? CONTENT_FAMILY_LABELS[fam] : null;
    return famLabel ? `${famLabel} · ${e.label}` : e.label;
  });
}

export async function loadPillarHistory(): Promise<PillarHistoryStore> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('admin_settings')
      .select('value')
      .eq('key', SOCIAL_PILLAR_HISTORY_KEY)
      .maybeSingle();
    if (error || !data?.value) return emptyHistory();
    const parsed = JSON.parse(String(data.value)) as PillarHistoryStore;
    if (!parsed || !Array.isArray(parsed.entries)) return emptyHistory();
    return {
      version: parsed.version === 2 ? 2 : 1,
      entries: parsed.entries.slice(0, 40),
      weekPlans: Array.isArray(parsed.weekPlans) ? parsed.weekPlans.slice(0, 20) : [],
    };
  } catch {
    return emptyHistory();
  }
}

export async function savePillarHistory(store: PillarHistoryStore): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from('admin_settings').upsert(
    {
      key: SOCIAL_PILLAR_HISTORY_KEY,
      value: JSON.stringify({
        version: 2,
        entries: store.entries.slice(0, 40),
        weekPlans: (store.weekPlans ?? []).slice(0, 20),
      }),
    },
    { onConflict: 'key' },
  );
  if (error) throw new Error(error.message);
}

export async function recordWeeklyPillar(pillar: WeeklyPillar, weekStart: string): Promise<PillarHistoryStore> {
  const history = await loadPillarHistory();
  const entry: PillarHistoryEntry = {
    pillarId: pillar.id,
    label: pillar.label,
    family: pillar.family,
    weekStart,
    createdAt: new Date().toISOString(),
  };
  const next = {
    version: 2 as const,
    entries: [entry, ...history.entries].slice(0, 40),
    weekPlans: history.weekPlans ?? [],
  };
  await savePillarHistory(next);
  return next;
}

/** Enregistre tous les thèmes de la semaine + snapshot de mix. */
export async function recordWeekThemePlan(
  plan: WeekPlanSnapshot,
  weekStart: string,
): Promise<PillarHistoryStore> {
  const history = await loadPillarHistory();
  const now = new Date().toISOString();
  const newEntries: PillarHistoryEntry[] = plan.assignments.map((a) => ({
    pillarId: a.themeId,
    label: a.label,
    family: a.family,
    weekStart,
    createdAt: now,
  }));
  const weekPlan = {
    weekStart,
    mixLabel: plan.mixLabel,
    themeIds: plan.assignments.map((a) => a.themeId),
    createdAt: now,
  };
  const next: PillarHistoryStore = {
    version: 2,
    entries: [...newEntries, ...history.entries].slice(0, 40),
    weekPlans: [weekPlan, ...(history.weekPlans ?? [])].slice(0, 20),
  };
  await savePillarHistory(next);
  return next;
}

export const TRIAL_CTA_FR = 'Essai gratuit 7 jours sur fitmangas.com';
export const TRIAL_CTA_ES = 'Prueba gratis 7 días en fitmangas.com';
