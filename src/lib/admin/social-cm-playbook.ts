import type { SocialLocale, SocialNetwork, SocialPostFormat } from '@/lib/admin/social-comms';
import { SOCIAL_EDITORIAL_IMAGE_BASE_PROMPT } from '@/lib/admin/social-image-prompt';

export { SOCIAL_EDITORIAL_IMAGE_BASE_PROMPT };

/** Type média produit — le format dicte le média. */
export type SocialMediaKind = 'video_brief' | 'photo' | 'carousel';

export type CaptionBand = {
  min: number;
  idealMin: number;
  idealMax: number;
  max: number;
  hint: string;
};

/** Légendes par format (données 2025–2026, pas une longueur unique). */
export const CAPTION_BY_FORMAT: Record<SocialPostFormat, CaptionBand> = {
  reel: {
    min: 40,
    idealMin: 70,
    idealMax: 150,
    max: 220,
    hint: 'Reel : légende courte (hook + CTA). Le message est dans la vidéo (titre + sous-titres).',
  },
  feed: {
    min: 80,
    idealMin: 100,
    idealMax: 180,
    max: 280,
    hint: 'Feed photo marque : légende courte ; l’image réelle porte. Pour un post éducatif long, préfère un carousel.',
  },
  carousel: {
    min: 150,
    idealMin: 200,
    idealMax: 900,
    max: 1500,
    hint: 'Carousel éducatif : légende plus longue OK (hook dans les 125 premiers car. + valeur + CTA save).',
  },
  story: {
    min: 0,
    idealMin: 0,
    idealMax: 40,
    max: 80,
    hint: 'Story : texte minimal.',
  },
  text: {
    min: 120,
    idealMin: 160,
    idealMax: 320,
    max: 420,
    hint: 'WhatsApp communauté : résumé d’article chaleureux + lien. Pas d’acquisition.',
  },
};

export function mediaKindForSlot(network: SocialNetwork, format: SocialPostFormat): SocialMediaKind {
  if (format === 'reel' || network === 'tiktok') return 'video_brief';
  if (format === 'carousel') return 'carousel';
  return 'photo';
}

type NetworkGuideline = {
  label: string;
  captionMax: number;
  captionIdeal: number;
  hashtagMax: number;
  hashtagIdeal: number;
  bestHours: number[];
  bestDays: string[];
  formats: SocialPostFormat[];
  weeklyTarget: string;
  tips: string[];
};

export const SOCIAL_CM_GUIDELINES: Record<SocialNetwork, NetworkGuideline> = {
  instagram: {
    label: 'Instagram',
    captionMax: 2200,
    captionIdeal: 120,
    hashtagMax: 5,
    hashtagIdeal: 4,
    bestHours: [7, 8, 11, 12, 17, 18, 19],
    bestDays: ['mardi', 'mercredi', 'jeudi', 'vendredi'],
    formats: ['reel', 'carousel', 'feed'],
    weeklyTarget:
      '3–5 Reels + 1–2 carousels + 1–2 Feed. Facebook = miroir auto du même contenu (pas de posts FB séparés).',
    tips: [
      'Reels = vidéo 9:16 + gros titre 0–2 s + sous-titres brûlés (pas une photo Unsplash).',
      'Carousels pour l’éducation Pilates (saves).',
      'Feed photo = bibliothèque réelle en priorité (authenticité Alejandra).',
      'Publier IG publie aussi FB si la case « Aussi Facebook » est cochée.',
    ],
  },
  facebook: {
    label: 'Facebook',
    captionMax: 500,
    captionIdeal: 80,
    hashtagMax: 2,
    hashtagIdeal: 1,
    bestHours: [9, 10, 13, 14, 18],
    bestDays: ['mercredi', 'jeudi', 'vendredi'],
    formats: ['feed', 'reel'],
    weeklyTarget: 'Miroir Instagram uniquement — même média + même légende. Pas de création FB séparée.',
    tips: [
      'Ne pas refaire de Reels dédiés Facebook.',
      'Gérer le miroir depuis la carte Instagram (case Aussi Facebook).',
    ],
  },
  whatsapp: {
    label: 'WhatsApp',
    captionMax: 420,
    captionIdeal: 240,
    hashtagMax: 0,
    hashtagIdeal: 0,
    bestHours: [8, 12, 17, 19],
    bestDays: ['lundi', 'mercredi', 'vendredi'],
    formats: ['text', 'feed'],
    weeklyTarget:
      '2–3 messages/semaine pour la communauté déjà membre : teaser d’un article blog (ce qu’elles y trouveront) + lien.',
    tips: [
      'Pas d’acquisition (« rejoins-nous ») — elles sont déjà dans la communauté.',
      'Ton : chaleureux, utile, résumé en 4–6 lignes + lien fitmangas.com/blog/…',
      '0 hashtag.',
    ],
  },
  linkedin: {
    label: 'LinkedIn',
    captionMax: 1300,
    captionIdeal: 600,
    hashtagMax: 3,
    hashtagIdeal: 2,
    bestHours: [8, 9, 12, 17, 18],
    bestDays: ['mardi', 'mercredi', 'jeudi'],
    formats: ['feed'],
    weeklyTarget: '2–3 posts/semaine : posture pro, bien-être au travail, leadership du corps (sans jargon IG).',
    tips: [
      'Hook dans les 2 premières lignes (aperçu LinkedIn).',
      'Paragraphes courts, 1 question ouverte en fin pour commentaires.',
      'Peu de hashtags (1–3). Ton pro / bienveillant, pas « viral IG ».',
    ],
  },
  tiktok: {
    label: 'TikTok',
    captionMax: 150,
    captionIdeal: 90,
    hashtagMax: 4,
    hashtagIdeal: 3,
    bestHours: [9, 12, 17, 19, 21],
    bestDays: ['mardi', 'jeudi', 'samedi'],
    formats: ['reel'],
    weeklyTarget: '3–5 vidéos courtes/semaine (même logique Reels : titre + sous-titres).',
    tips: ['Hook immédiat.', 'Sous-titres intégrés.'],
  },
};

export const CM_STRATEGY_NOTES = [
  'Prioriser la vidéo (Reels) pour croître — jamais une image Unsplash déguisée en Reel.',
  'Facebook = miroir Instagram (même post). Pas de briefs Reels Facebook séparés.',
  'WhatsApp = communauté déjà membre : teaser d’articles blog, pas d’acquisition.',
  'LinkedIn = ton pro / bien-être au travail ; case « Aussi LinkedIn » pour adapter un post IG.',
  'Carousels pour l’éducation Pilates (saves). Photos réelles Alejandra pour Feed identité.',
  'Une idée-pilier / semaine (dos, stress, bassin, hanches, sommeil, confiance, énergie) — pas deux semaines de suite le même.',
  'Cascade image : Gemini (payant) → fond de marque local → bibliothèque Alejandra. Jamais Pollinations. Unsplash = blog seulement.',
  'Format viral Reel : Claude Code + HyperFrames local — parole naturelle, Whisper local, sous-titres blanc/contour + mot-clé terracotta.',
  'CTA produit : dashboard desktop en carte flottante — jamais screenshot mobile plein cadre coupé.',
];

/**
 * Piliers éditoriaux FitMangas — base de génération (problématiques femmes 30–55,
 * Pilates/Barre doux, vie réelle : bureau, maison, stress, énergie).
 * Pas une liste exhaustive : l’IA doit ROTATER, pas recycler posture/respiration.
 */
export const FITMANGAS_EDITORIAL_PILLARS = [
  { id: 'energy', label: 'Énergie du quotidien', angle: 'Fatigue 15h, café en boucle, besoin d’un boost sans HIIT.' },
  { id: 'stress', label: 'Stress & système nerveux', angle: 'Charge mentale, tension mâchoire/épaules, besoin de calme utile.' },
  { id: 'desk', label: 'Corps au bureau', angle: 'Écran, nuque, hanches figées — gestes discrets au bureau.' },
  { id: 'core', label: 'Centre & abdos doux', angle: 'Abdos sans crunch / sans mal de dos — sensation de maintien.' },
  { id: 'hips', label: 'Hanches & mobilité', angle: 'Hanches raides après assise longue, marche plus légère.' },
  { id: 'pelvic', label: 'Bassin & plancher', angle: 'Post-partum, stabilité, confiance dans le bas du corps (ton respectueux).' },
  { id: 'sleep', label: 'Sommeil & récupération', angle: 'Corps qui ne décroche pas le soir, routine douce.' },
  { id: 'confidence', label: 'Confiance & présence', angle: 'Se sentir droite, élégante, ancrée — sans promesse miracle.' },
  { id: 'barre', label: 'Barre & jambes', angle: 'Jambes toniques, fessiers, sensation “allongée”.' },
  { id: 'consistency', label: 'Constance douce', angle: '10–20 min, régularité > intensité, cours en visio FitMangas.' },
  { id: 'pain_care', label: 'Douleurs du quotidien', angle: 'Mal de dos / nuque : prévention douce (pas diagnostic médical).' },
  { id: 'community', label: 'Communauté & cours', angle: 'Ambiance live, progression, “je ne suis pas seule”.' },
] as const;

/** Fallback si l’IA omet le brief Reel — 3 idées + phrases parlables. */
export const FACE_CAM_SHOT_LIST = [
  '1) Face cam téléphone — parole naturelle (HD Normal SDR, pas HDR)',
  '2) Rester face cam toute la durée (phase actuelle : AUCUN plan exercice filmé)',
  '3) CTA oral doux : fitmangas.com / classes',
].join('\n');

export const FACE_CAM_SHOT_LIST_ES = [
  '1) Face cam teléfono — habla natural (HD Normal SDR, no HDR)',
  '2) Quedarte face cam todo el tiempo (fase actual: NINGÚN plano de ejercicio filmado)',
  '3) CTA oral suave: fitmangas.com / clases',
].join('\n');

export function faceCamShotListForLocale(locale: SocialLocale = 'fr'): string {
  return locale === 'es' ? FACE_CAM_SHOT_LIST_ES : FACE_CAM_SHOT_LIST;
}

const EXERCISE_TITLE_RE =
  /\b(planche|plancha|crunch|squat|gainage|flexion|roulement|ouverture de bras|planche sur les genoux|respiration ventrale|torsion assise|respiración|apertura de brazos|báscula pélvica|bascule du bassin|puente de glúteos|el cien|the hundred|roll[- ]?up|dead ?bug|bird ?dog)\b/i;

/** Détecte un titre “nom d’exercice” peu Instagrammable. */
export function looksLikeExerciseTitle(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (EXERCISE_TITLE_RE.test(t) && !/[?!¿]/.test(t)) return true;
  if (/^(la |le |les |el |los |las )?(planche|plancha|squat|crunch)\b/i.test(t)) return true;
  return false;
}

/** Force le plan de tournage face cam (ignore les plans d’exercice inventés par l’IA). */
export function enforceFaceCamShotList(raw: string, locale: SocialLocale = 'fr'): string {
  const text = raw.trim();
  const fallback = faceCamShotListForLocale(locale);
  if (!text) return fallback;
  const mentionsExercisePlan =
    /plan\s*\d|exercice film|ejercicio film|b-?roll|plan large|plano amplio|démontr|demostr|ouverture de bras|apertura de brazos|flexion|planche|plancha|roulement d['’]épaules|mouvement filmé|movimiento filmado/i.test(
      text,
    );
  const hasFaceCam = /face\s*cam/i.test(text);
  if (mentionsExercisePlan || !hasFaceCam) return fallback;
  return text.slice(0, 800);
}

/** Hook Reel Instagrammable (MAJUSCULES, max 8 mots, bénéfice). */
export function polishInstagramHook(raw: string, fallbackTitle: string, locale: SocialLocale = 'fr'): string {
  let h = (raw || '').trim().replace(/\s+/g, ' ');
  const fallback = (fallbackTitle || '').trim();
  if (!h || looksLikeExerciseTitle(h)) {
    h = looksLikeExerciseTitle(fallback) ? '' : fallback;
  }
  if (!h) h = locale === 'es' ? '¿TU CUERPO TE HABLA?' : 'TON CORPS TE PARLE ?';
  h = h.replace(/[🚀🧘💪🔥✨]/g, '').trim();
  // Même règle que overlay : majuscules, phrase complète, jamais tronqué.
  const polished = polishOverlayText(h, locale, 56);
  return polished || (locale === 'es' ? '¿TU CUERPO TE HABLA?' : 'TON CORPS TE PARLE ?');
}

/**
 * Titre carte : RECONNAISSANCE CONCRÈTE D’ABORD (scène vécue), reformulation claire ENSUITE.
 * Jamais « X n’est pas Y » en ouverture sans scène. Accords féminins FR/ES.
 */
export function polishPostTitle(
  raw: string,
  hookTitle: string,
  format?: SocialPostFormat,
  locale: SocialLocale = 'fr',
): string {
  let t = (raw || '').trim().replace(/\s+/g, ' ');
  t = t.replace(/\(\s*\d+\s*slides?\s*\)/gi, '').trim();
  if (!t || looksLikeExerciseTitle(t) || titleFailsQualityGate(t)) {
    const fromHook = (hookTitle || '').trim();
    if (fromHook && !looksLikeExerciseTitle(fromHook) && !titleFailsQualityGate(fromHook)) {
      t = fromHook.charAt(0) + fromHook.slice(1).toLowerCase();
      if (!/[.!?…¿¡]$/.test(t)) t += locale === 'es' ? '?' : ' ?';
    } else {
      // Pas de filler — marqueur à revoir (l’UI lit titleNeedsReview)
      t = locale === 'es' ? 'Título a revisar' : 'Titre à revoir';
    }
  }
  if (format === 'carousel' && !/slide/i.test(t)) {
    // le compte exact est ajouté après génération des images
  }
  return t.slice(0, 160);
}

const TITLE_BLACKLIST =
  /\b(hurle|hurler|sauvage|guerri[eè]re|plume|fant[oô]me|inébranlable|rayonne|doux|douce|suave|d[eé]verrouille|prestance)\b|un geste qui|lib[eè]re ta|éveille ta|sculpte ta|active ton noyau|force invisible|en douceur|gesto suave|un gesto que/i;

/** Ouverture « X n’est pas Y » sans scène concrète = rejet. */
const OPENS_WITH_NEGATION_NO_SCENE =
  /^(ce n['’]est pas|no es|eso no es|no es falta de|el problema no es)\b/i;

const HAS_CONCRETE_SCENE =
  /\b(tu |te |tes |ton |ta |tú |te |tus |cuando |quand |après |tras |à \d|las \d|heure|chaise|silla|bureau|lèves|levantas|redresses|journée|día sentada|corps|cuerpo)\b/i;

export function titleFailsQualityGate(title: string): boolean {
  const t = (title || '').trim();
  if (!t || t.length < 12) return true;
  if (TITLE_BLACKLIST.test(t)) return true;
  if (/^(titre à revoir|título a revisar)/i.test(t)) return true;
  // « X n’est pas Y » en ouverture sans aucune scène concrète dans le titre = rejet
  if (OPENS_WITH_NEGATION_NO_SCENE.test(t) && !HAS_CONCRETE_SCENE.test(t)) return true;
  return false;
}

/** Mots / fragments sur lesquels un overlay ne doit JAMAIS se terminer (troncature). */
const OVERLAY_HANGING_END =
  /(?:^|\s)(EN|DU|DE|DES|LE|LA|LES|UN|UNE|ET|OU|À|A|AU|AUX|POUR|PAR|SUR|DANS|AVEC|SANS|QUE|QUI|SI|TU|TE|TON|TA|TES|JE|ME|MON|MA|MES|ON|NOUS|VOUS|SE|SA|SON|SES|CE|CET|CETTE|CES|PAS|PLUS|D'|L'|N'|QU'|C'|Y|EL|LA|LOS|LAS|UN|UNA|POR|PARA|CON|SIN|QUE|SI|TU|TE|TU|SU|SUS|AL|DEL)$/i;

export function isIncompleteOverlay(text: string): boolean {
  const t = (text || '').trim();
  if (!t) return true;
  if (/[,;:–—\-…]\s*$/.test(t)) return true;
  if (OVERLAY_HANGING_END.test(t)) return true;
  return false;
}

/**
 * Overlay / hook sur image : phrase autonome, MAJUSCULES, courte et COMPLÈTE.
 * JAMAIS une troncature du titre long (ni coupe au milieu d’un mot, ni sur une préposition).
 * Si trop long → on raccourcit par mots entiers jusqu’à une fin valide ; pas de slice aveugle.
 */
export function polishOverlayText(raw: string, locale: SocialLocale = 'fr', max = 56): string {
  let t = (raw || '').trim().replace(/\s+/g, ' ');
  if (!t) return '';

  // Une seule proposition (pas le titre long multi-phrases)
  t = (t.split(/[.!?|\n]/)[0] || t).trim();
  t = t.replace(/[?¿!¡]+$/g, '').trim();
  const loc = locale === 'es' ? 'es-ES' : 'fr-FR';
  t = t.toLocaleUpperCase(loc);

  if (t.length <= max && !isIncompleteOverlay(t)) return t;

  const words = t.split(/\s+/).filter(Boolean);
  for (let n = words.length; n >= 2; n -= 1) {
    const candidate = words.slice(0, n).join(' ');
    if (candidate.length <= max && !isIncompleteOverlay(candidate)) return candidate;
  }

  // Dernier recours : 3–5 mots forts, sans fin pendante (mieux qu’une coupe « …en »)
  for (let n = Math.min(5, words.length); n >= 2; n -= 1) {
    const candidate = words.slice(0, n).join(' ');
    if (!isIncompleteOverlay(candidate)) return candidate;
  }
  return words.slice(0, 3).join(' ');
}

/** Few-shot titres bankables (FR) — reconnaissance concrète d’abord. */
export const TITLE_FEW_SHOT_FR = [
  'Tu te lèves de ta chaise et tes hanches sont raides ? Elles ne sont pas vieilles, elles sont restées pliées 8h.',
  'Ce coup de barre de 15h ? Ce n’est pas le café qui te manque, c’est ta respiration coincée depuis le déjeuner.',
  'Tes hanches craquent quand tu te lèves ? Ce n’est pas l’usure, c’est la position d’hier.',
  'Tu te redresses dès qu’on te regarde, puis tu t’avachis. Se tenir droite ne devrait pas demander d’effort.',
  'Après une journée assise, ton bassin ne bouge plus. Ce n’est pas un manque de souplesse, c’est un manque de mouvement.',
  'Ce n’est pas de la fatigue. C’est ton corps qui n’a jamais reçu le signal de relâcher.',
] as const;

/** Few-shot titres bankables (ES) — misma regla. */
export const TITLE_FEW_SHOT_ES = [
  'Te levantas de la silla y tus caderas están rígidas. No están viejas: llevan 8h dobladas.',
  '¿Ese bajón de las 15h? No es el café que te falta: es tu respiración trabada desde la comida.',
  '¿Tus caderas crujen al levantarte? No es el desgaste: es la postura de ayer.',
  'Te enderezas en cuanto te miran y luego te encoges. Mantenerte erecta no debería costar esfuerzo.',
  'Tras un día sentada, tu pelvis ya no se mueve. No es falta de flexibilidad: es falta de movimiento.',
  'No es cansancio. Es tu cuerpo que nunca recibió la señal de soltar.',
] as const;

export function withCarouselSlideCount(title: string, slideCount: number): string {
  const base = title.replace(/\(\s*\d+\s*slides?\s*\)/gi, '').trim();
  if (slideCount <= 0) return base.slice(0, 120);
  return `${base} (${slideCount} slides)`.slice(0, 120);
}

export function fallbackReelBrief(
  hookTitle: string,
  title: string,
  locale: SocialLocale = 'fr',
): { reelScript: string; shotList: string } {
  const topic = (hookTitle || title || (locale === 'es' ? 'Tema Pilates' : 'Sujet Pilates')).trim();
  if (locale === 'es') {
    return {
      reelScript: [
        'IDEAS:',
        `1) Gancho ligado a: ${topic}`,
        '2) Un error frecuente + la sensación / gesto clave (1 sola idea clara) — EXPLICAR face cam, no demostrar en plano ejercicio',
        '3) Invitación suave FitMangas / fitmangas.com',
        '',
        'BRIEF (decir con naturalidad, no leer palabra por palabra):',
        `« ¿Te suena esto: ${topic.toLowerCase()}… »`,
        '« Esto es lo que cambio en 20 segundos — sin forzar. »',
        '« Si quieres profundizar con suavidad, únete a una clase en fitmangas.com. »',
      ].join('\n'),
      shotList: FACE_CAM_SHOT_LIST_ES,
    };
  }
  return {
    reelScript: [
      'IDÉES:',
      `1) Accroche liée à : ${topic}`,
      '2) Une erreur fréquente + la sensation / geste clé (1 seule idée claire) — à EXPLIQUER face cam, pas à démontrer en plan exercice',
      '3) Invitation douce FitMangas / fitmangas.com',
      '',
      'BRIEF (à dire naturellement, pas à lire mot à mot):',
      `« Tu reconnais ça : ${topic.toLowerCase()}… »`,
      '« Voici ce que je change en 20 secondes — sans forcer. »',
      '« Si tu veux creuser en douceur, rejoins une classe sur fitmangas.com. »',
    ].join('\n'),
    shotList: FACE_CAM_SHOT_LIST,
  };
}

export function statusLabelForPost(status: string, format: SocialPostFormat): string {
  if (status === 'idea') {
    return format === 'reel' ? 'Idée — à filmer' : 'Idée — à préparer';
  }
  if (status === 'ready') {
    return format === 'reel' ? 'Prêt — MP4 OK' : 'Prêt — visuel OK';
  }
  if (status === 'scheduled') return 'Programmé — en file';
  if (status === 'published') return 'Publié';
  if (status === 'skipped') return 'Ignoré';
  return status;
}

export function statusOptionsForFormat(format: SocialPostFormat): { value: string; label: string }[] {
  return [
    {
      value: 'idea',
      label: format === 'reel' ? 'Idée — à filmer' : 'Idée — à préparer',
    },
    {
      value: 'ready',
      label: format === 'reel' ? 'Prêt — MP4 OK' : 'Prêt — visuel OK',
    },
    { value: 'scheduled', label: 'Programmé — en file' },
    { value: 'published', label: 'Publié (manuel)' },
    { value: 'skipped', label: 'Ignoré' },
  ];
}

/** Adapte un post IG/autre vers une légende LinkedIn (sans appel IA). */
export function adaptCaptionToLinkedIn(source: {
  title: string;
  caption: string;
  cta: string;
  hookTitle?: string;
}): { title: string; caption: string; cta: string; hashtags: string[] } {
  const hook = (source.hookTitle || source.title || '').trim();
  const body = source.caption.replace(/#\w+/g, '').trim();
  const caption = [
    hook ? `${hook.charAt(0)}${hook.slice(1).toLowerCase()}` : source.title,
    '',
    body,
    '',
    'Dans mon quotidien de coach Pilates / Barre en visio, je vois beaucoup de femmes coincées entre charge mentale et corps tendu.',
    'Le Pilates doux n’est pas une mode : c’est un outil pour tenir la journée sans s’épuiser.',
    '',
    'Et toi — qu’est-ce qui te fatigue le plus en ce moment : le dos, l’énergie, ou la tête qui n’arrête pas ?',
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 1200);

  return {
    title: source.title.slice(0, 120),
    caption,
    cta: source.cta || 'Découvrir FitMangas : fitmangas.com',
    hashtags: ['Pilates', 'BienEtreAuTravail'],
  };
}

export function analyzeCaptionForPost(
  caption: string,
  network: SocialNetwork,
  format: SocialPostFormat,
  hashtagCount = 0,
) {
  const g = SOCIAL_CM_GUIDELINES[network];
  const band =
    network === 'facebook'
      ? { min: 30, idealMin: 40, idealMax: 180, max: 500, hint: 'Facebook = miroir IG : légende IG OK.' }
      : network === 'whatsapp'
        ? CAPTION_BY_FORMAT.text
        : network === 'linkedin'
          ? {
              min: 200,
              idealMin: 400,
              idealMax: 900,
              max: 1300,
              hint: 'LinkedIn : hook + 2–4 courts paragraphes + question ouverte.',
            }
          : CAPTION_BY_FORMAT[format] ?? CAPTION_BY_FORMAT.feed;

  const len = caption.trim().length;
  const warnings: string[] = [];
  if (len > band.max) warnings.push(`Trop longue (${len}/${band.max}). ${band.hint}`);
  else if (len < band.min) warnings.push(`Trop courte (${len}). ${band.hint}`);
  else if (len < band.idealMin || len > band.idealMax) {
    warnings.push(`Hors zone idéale ${band.idealMin}–${band.idealMax} car. ${band.hint}`);
  }
  if (hashtagCount > g.hashtagMax) warnings.push(`Trop de hashtags (${hashtagCount}/${g.hashtagMax}).`);
  return {
    length: len,
    max: band.max,
    ideal: Math.round((band.idealMin + band.idealMax) / 2),
    idealMin: band.idealMin,
    idealMax: band.idealMax,
    warnings,
    ok: warnings.length === 0,
    hint: band.hint,
  };
}

/** @deprecated préfère analyzeCaptionForPost */
export function analyzeCaptionForNetwork(caption: string, network: SocialNetwork, hashtagCount = 0) {
  return analyzeCaptionForPost(caption, network, network === 'whatsapp' ? 'text' : 'feed', hashtagCount);
}

export function formatBestHours(network: SocialNetwork): string {
  return SOCIAL_CM_GUIDELINES[network].bestHours.map((h) => `${String(h).padStart(2, '0')}h`).join(', ');
}

export function suggestedPlannedAt(network: SocialNetwork, dayOffset: number, slotIndex = 0): string {
  const g = SOCIAL_CM_GUIDELINES[network];
  const hour = g.bestHours[slotIndex % g.bestHours.length] ?? 10;
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export function startOfMonth(date = new Date()): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function monthGridDays(month: Date): Date[] {
  const first = startOfMonth(month);
  const start = new Date(first);
  const dow = start.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  start.setDate(start.getDate() + diff);
  const days: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

export const REEL_HOOK_STYLE = {
  font: 'Inter, system-ui, sans-serif',
  color: '#FFFFFF',
  outline: '#000000',
  accent: '#C45D3E',
  placement: 'upper_third' as const,
};

export const ACTION_BUTTON_HELP = {
  copy: 'Copie la légende + CTA + hashtags.',
  save: 'Enregistre la légende.',
  ready: 'Validé en interne.',
  schedule: 'Programme Meta / file IG / rappel WhatsApp.',
  publish: 'Publication immédiate IG/FB.',
  publishedManual: 'Déjà publié à la main.',
  delete: 'Retire du plan.',
};
