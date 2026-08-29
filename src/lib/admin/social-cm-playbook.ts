import type { SocialLocale, SocialNetwork, SocialPostFormat } from '@/lib/admin/social-comms';
import { SOCIAL_EDITORIAL_IMAGE_BASE_PROMPT } from '@/lib/admin/social-image-prompt';
import { sanitizeOverlayBrandTerms } from '@/lib/admin/social-overlay-text-shared';

export { SOCIAL_EDITORIAL_IMAGE_BASE_PROMPT };

/** Type média produit — le format dicte le média. */
export type SocialMediaKind = 'video_brief' | 'photo' | 'carousel';

export type CaptionBand = {
  min: number;
  idealMin: number;
  idealMax: number;
  max: number;
  /** Caractères (reel/WA) ou mots (feed/carousel algo 2026). */
  unit: 'chars' | 'words';
  hint: string;
};

export function countCaptionWords(text: string): number {
  return (text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Légendes par format — seuils algo 2026 (feed/carousel en MOTS). */
export const CAPTION_BY_FORMAT: Record<SocialPostFormat, CaptionBand> = {
  reel: {
    min: 70,
    idealMin: 70,
    idealMax: 150,
    max: 150,
    unit: 'chars',
    hint: 'Reel : 70–150 car. (hook + CTA). Le message est dans la vidéo.',
  },
  feed: {
    min: 120,
    idealMin: 150,
    idealMax: 220,
    max: 280,
    unit: 'words',
    hint: 'Feed : 150–220 mots (~800–1200 car.). Mini-histoire / valeur. Hook dans les 125 premiers car. CTA une seule fois en fin.',
  },
  carousel: {
    min: 120,
    idealMin: 150,
    idealMax: 300,
    max: 400,
    unit: 'words',
    hint: 'Carousel : 150–300 mots, 1 paragraphe par slide. Hook dans les 125 premiers car.',
  },
  story: {
    min: 0,
    idealMin: 0,
    idealMax: 40,
    max: 80,
    unit: 'chars',
    hint: 'Story : texte minimal.',
  },
  text: {
    min: 120,
    idealMin: 160,
    idealMax: 320,
    max: 420,
    unit: 'chars',
    hint: 'WhatsApp communauté : résumé d’article chaleureux + lien. Pas d’acquisition.',
  },
};

/** Approx. caractères pour un plafond en mots (sanitizer / troncature). */
export function captionBandCharCeiling(band: CaptionBand): number {
  if (band.unit === 'chars') return band.max;
  return Math.round(band.max * 6.5);
}

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
    captionIdeal: 900,
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
  'Carousels = LISTE de points autonomes chiffrés (5 RAISONS… / 1. … 2. …). JAMAIS une histoire découpée (« CE QU’UNE MANGITA A COMPRIS »).',
  'Feed légende = 150–220 MOTS (algo 2026), pas 150 car. Hook dans les 125 premiers caractères. CTA une seule fois.',
  'INTERDIT de répéter le calque « Tu paies pour X, pas pour Y » plus d’une fois par semaine — préférer des formulations françaises variées.',
  'Anti-répétition semaine : un thème unique par post ; overlays à structures différentes (pas deux « TU PAIES… PAS POUR… »).',
  'Une idée-pilier / semaine (dos, stress, bassin, hanches, sommeil, confiance, énergie) — pas deux semaines de suite le même.',
  'Cascade image : Gemini (payant, carousels éducatifs) → fond de marque local → bibliothèque Alejandra. Jamais Pollinations. Unsplash = blog seulement.',
  'Format viral Reel : Claude Code + HyperFrames local — parole naturelle, Whisper local, sous-titres blanc/contour + mot-clé terracotta.',
  'Carousel = 6 slides (couverture chiffrée + 4 points autonomes + CTA). Voir CAROUSEL_LIST_FORMAT_RULES.',
  'CTA carousel : dashboard desktop ENTIER en contain dans une carte flottante (`espace cliente dashboard.jpg`). Jamais crop/zoom.',
  'Slides 2–5 = images IA (formule 10 composants), slide 1 = vraie photo Alejandra. Jamais du lifestyle hors sujet en slide pédagogique.',
];

/** Calque « tu paies pour X, pas pour Y » — max 1 post / semaine. */
export const PAY_FOR_NOT_PATTERN =
  /\b(tu\s+paies|elle\s+paie|on\s+paie|paga[s]?)\s+pour\b.{0,40}\bpas\s+pour\b/i;

export const OVERLAY_PAY_FOR_SKELETON =
  /^TU\s+PAIES\s+POUR\b.{0,48}\bPAS\s+POUR\b/i;

/** Formulations FR naturelles recommandées à la place du calque. */
export const NATURAL_VALUE_FRAMINGS_FR = [
  'Ce que tu paies, ce n’est pas le cours. C’est le fait que quelqu’un t’attende.',
  'Un tapis ne t’a jamais rappelée à l’ordre.',
  'Le mardi 19h est déjà pris — ce n’est pas une intention, c’est un créneau.',
  'Après 8h de chaise, le bassin ne se déverrouille pas tout seul.',
  'À 22h le corps est encore en réunion. Un cours fixe lui donne l’heure de sortir.',
  'Tu n’as pas besoin d’un 8e tuto. Tu as besoin qu’on te voie ce soir.',
] as const;

/** Punchlines trop collées — max 1 par semaine (hooks + overlays). */
export const WEEKLY_PUNCHLINE_CAPS: Array<{ id: string; re: RegExp; label: string }> = [
  { id: 'trop_tard', re: /trop tard|demasiado tarde/i, label: '« trop tard »' },
  { id: 'youtube_video', re: /youtube|vid[eé]o ne (te |l['’e])|tuto|le replay ne/i, label: 'YouTube / la vidéo ne…' },
  { id: 'prenom', re: /pr[eé]nom/i, label: '« dit ton prénom »' },
  { id: 'corrige_pas', re: /ne te corrige|no te corrige/i, label: '« la vidéo ne te corrige pas »' },
];

export function punchlineFamilyOf(text: string): string | null {
  const t = text || '';
  for (const cap of WEEKLY_PUNCHLINE_CAPS) {
    if (cap.re.test(t)) return cap.id;
  }
  return null;
}

export function isPayForNotFraming(text: string): boolean {
  return PAY_FOR_NOT_PATTERN.test(text || '') || OVERLAY_PAY_FOR_SKELETON.test((text || '').trim());
}

/** Ossature d’overlay pour détecter les quasi-doublons (ex. PAS POUR UN TAPIS / REPLAY). */
export function overlaySkeleton(text: string): string {
  return (text || '')
    .toLocaleUpperCase('fr-FR')
    .replace(/[^A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ0-9\s]/g, ' ')
    .replace(/\b(UN|UNE|LE|LA|LES|DES|DU|DE|D|POUR|QU|QUE|QUON|PAS|TON|TA|TES)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function overlaysShareSkeleton(a: string, b: string): boolean {
  const sa = overlaySkeleton(a);
  const sb = overlaySkeleton(b);
  if (!sa || !sb) return false;
  if (sa === sb) return true;
  // Même tête « PAIES … PAS » = même ossature
  const head = (s: string) => s.split(' ').slice(0, 4).join(' ');
  if (isPayForNotFraming(a) && isPayForNotFraming(b) && head(sa) === head(sb)) return true;
  // Similarité Jaccard sur tokens
  const ta = new Set(sa.split(' ').filter((w) => w.length > 2));
  const tb = new Set(sb.split(' ').filter((w) => w.length > 2));
  if (ta.size < 2 || tb.size < 2) return false;
  let inter = 0;
  for (const w of ta) if (tb.has(w)) inter += 1;
  const union = ta.size + tb.size - inter;
  return union > 0 && inter / union >= 0.55;
}

export function themeKeyFromPost(input: {
  pillarId?: string | null;
  title?: string;
  overlayText?: string | null;
  hookTitle?: string;
}): string {
  if (input.pillarId) return `pillar:${input.pillarId}`;
  const base = (input.title || input.overlayText || input.hookTitle || '')
    .toLocaleLowerCase('fr-FR')
    .replace(/[^a-zàâäéèêëïîôùûüç0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48);
  return `title:${base}`;
}

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

/** Hook Reel Instagrammable (MAJUSCULES, max 8 mots, bénéfice). Jamais de filler. */
export function polishInstagramHook(raw: string, fallbackTitle: string, locale: SocialLocale = 'fr'): string {
  let h = (raw || '').trim().replace(/\s+/g, ' ');
  const fallback = (fallbackTitle || '').trim();
  if (!h || looksLikeExerciseTitle(h)) {
    h = looksLikeExerciseTitle(fallback) ? '' : fallback;
  }
  if (!h) {
    return locale === 'es' ? 'HOOK A REVISAR' : 'HOOK À REVOIR';
  }
  h = h.replace(/[🚀🧘💪🔥✨]/g, '').trim();
  const polished = polishOverlayText(h, locale, 56);
  return polished || (locale === 'es' ? 'HOOK A REVISAR' : 'HOOK À REVOIR');
}

export function hookNeedsReview(hook: string): boolean {
  return /hook\s*à\s*revoir|hook\s*a\s*revisar/i.test(hook || '');
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
  /\b(hurle|hurler|sauvage|guerri[eè]re|plume|fant[oô]me|inébranlable|rayonne|doux|douce|suave|d[eé]verrouille|prestance|trop\s+vieille|demasiado\s+vieja|paresseuse|perezosa)\b|un geste qui|lib[eè]re ta|éveille ta|sculpte ta|active ton noyau|force invisible|en douceur|gesto suave|un gesto que/i;

/**
 * TRASH-TALK FitMangas (CM v7) :
 * On tape sur LE MENSONGE DE L’INDUSTRIE, L’EXCUSE, ou LA SITUATION ABSURDE —
 * JAMAIS sur le corps, l’âge, le poids ou un défaut personnel de la femme.
 * Elle doit se sentir COMPRISE et du bon côté, jamais jugée.
 */
export const TRASH_TALK_BODY_SHAME =
  /\b(trop\s+vieille|vieille|viej[ao]s?|grosse|gorda|molle|floja|paresseuse|perezosa|nulle|inútil|obèse|obesa|flasque|flácid[ao]|moche|fea|ridicule)\b/i;

export function violatesTrashTalkDignity(text: string): boolean {
  return TRASH_TALK_BODY_SHAME.test(text || '');
}

/** Remplace les overlays/titres qui nomment une insécurité physique/âge. */
export function sanitizeTrashTalkCopy(raw: string, locale: SocialLocale = 'fr'): string {
  const t = (raw || '').trim();
  if (!t) return t;
  if (!violatesTrashTalkDignity(t)) return t;
  if (/trop\s+vieille|vieille|viej/i.test(t)) {
    return locale === 'es'
      ? 'TE VENDIERON QUE ERA EL FINAL. ES FALSO.'
      : "ON T'A VENDU QUE C'ÉTAIT FINI. C'EST FAUX.";
  }
  if (/grosse|gorda|molle|floja|obèse|obesa|flasque/i.test(t)) {
    return locale === 'es'
      ? 'EL PROBLEMA NO ERES TÚ: ES LA PROMESA IMPOSIBLE.'
      : "LE PROBLÈME N'EST PAS TOI : C'EST LA PROMESSE IMPOSSIBLE.";
  }
  if (/paresseuse|perezosa|nulle|inútil/i.test(t)) {
    return locale === 'es'
      ? 'NO ES FALTA DE VOLUNTAD: ES FALTA DE CITA FIJA.'
      : "CE N'EST PAS UN MANQUE DE VOLONTÉ : C'EST UN MANQUE DE RENDEZ-VOUS.";
  }
  return locale === 'es'
    ? 'TE VENDIERON UNA HISTORIA FALSA. AQUÍ ESTÁ LA REAL.'
    : 'ON T’A VENDU UNE HISTOIRE FAUSSE. VOICI LA VRAIE.';
}

/** Mots / fragments sur lesquels un overlay ne doit JAMAIS se terminer (troncature). */
const OVERLAY_HANGING_END =
  /(?:^|\s)(EN|DU|DE|DES|LE|LA|LES|UN|UNE|ET|OU|À|A|AU|AUX|POUR|PAR|SUR|DANS|AVEC|SANS|QUE|QUI|SI|TU|TE|TON|TA|TES|JE|ME|MON|MA|MES|ON|NOUS|VOUS|SE|SA|SON|SES|CE|CET|CETTE|CES|PAS|PLUS|D'|L'|N'|QU'|C'|Y|EL|LOS|LAS|UNA|POR|PARA|CON|SIN|SU|SUS|AL|DEL)$/i;

export function isIncompleteOverlay(text: string): boolean {
  const t = (text || '').trim();
  if (!t) return true;
  if (/[,;:–—\-…]\s*$/.test(t)) return true;
  // « NE … PAS » = négation complète FR, pas une troncature
  if (/\bne\b[\s\S]{1,40}\bpas$/i.test(t)) return false;
  if (OVERLAY_HANGING_END.test(t)) return true;
  // Phrase coupée : « IL CHERCHE » / « ELLE ATTEND » sans complément
  if (/\b(IL|ELLE|TU|ON)\s+(CHERCHE|ATTEND|VEUT|MANQUE|DEMANDE)$/i.test(t)) return true;
  return false;
}

export function polishOverlayText(raw: string, locale: SocialLocale = 'fr', max = 56): string {
  let t = (raw || '').trim().replace(/\s+/g, ' ');
  if (!t) return '';

  t = sanitizeTrashTalkCopy(t, locale);

  // Préserver « 1. PERSONNE NE T’ATTEND » — ne pas couper au point après le numéro
  // (sinon le titre devient juste « 1 »).
  const numbered = t.match(/^(\d+[.)]\s+)(.+)$/);
  if (numbered) {
    const rest = (numbered[2]!.split(/[!?|\n]/)[0] || numbered[2]!).trim();
    // Couper les phrases suivantes, garder le point du numéro
    const firstSentence = rest.split(/(?<=\w)[.!?]/)[0] || rest;
    t = `${numbered[1]}${firstSentence}`.trim();
  } else {
    t = (t.split(/[.!?|\n]/)[0] || t).trim();
  }
  t = t.replace(/[?¿!¡]+$/g, '').trim();
  t = sanitizeOverlayBrandTerms(t);
  const loc = locale === 'es' ? 'es-ES' : 'fr-FR';
  t = t.toLocaleUpperCase(loc);

  if (t.length <= max && !isIncompleteOverlay(t) && !isBareNumericSlideTitle(t)) return t;

  const words = t.split(/\s+/).filter(Boolean);
  for (let n = words.length; n >= 2; n -= 1) {
    const candidate = words.slice(0, n).join(' ');
    if (candidate.length <= max && !isIncompleteOverlay(candidate) && !isBareNumericSlideTitle(candidate)) {
      return candidate;
    }
  }

  for (let n = Math.min(5, words.length); n >= 2; n -= 1) {
    const candidate = words.slice(0, n).join(' ');
    if (!isIncompleteOverlay(candidate) && !isBareNumericSlideTitle(candidate)) return candidate;
  }
  return words.slice(0, 3).join(' ');
}

/** Titre slide = numéro nu (« 1 », « 2. ») → invalide. */
export function isBareNumericSlideTitle(text: string): boolean {
  return /^\d+[.)]?$/.test((text || '').trim());
}

/** Intègre le CTA à la fin de la légende (une seule fois). */
export function mergeCaptionWithCta(caption: string, cta: string): string {
  const base = (caption || '').trim();
  const tip = (cta || '').trim();
  if (!tip) return base;
  if (!base) return tip;
  const tipKey = tip.toLowerCase();
  const tipHead = tipKey.slice(0, Math.min(24, tip.length));
  if (tipHead && base.toLowerCase().includes(tipHead)) return base;
  const lastLine = base.split(/\n/).pop()?.trim().toLowerCase() ?? '';
  if (lastLine && (lastLine === tipKey || (tipHead && lastLine.includes(tipHead)))) return base;
  return `${base.replace(/\s+$/, '')}\n\n${tip}`;
}

/** Légende Meta / copie = caption (+ CTA une fois) + hashtags. Un seul champ éditable. */
export function captionForPublish(post: {
  title?: string;
  caption: string;
  cta: string;
  hashtags: string[];
}): string {
  const body = mergeCaptionWithCta(post.caption, post.cta);
  const hashtags = post.hashtags.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)).join(' ');
  return [body, hashtags].filter(Boolean).join('\n\n');
}

/** Correcteur orthographe FR/ES pour titres/légendes carousel (fautes fréquentes IA). */
export function proofreadCarouselCopy(text: string, locale: SocialLocale = 'fr'): string {
  let t = text || '';
  if (locale === 'es') {
    t = t.replace(/\berrori\b/gi, 'errores');
    t = t.replace(/\bmotivacion\b/gi, 'motivación');
    t = t.replace(/\bdias\b/gi, 'días');
    t = t.replace(/\brazones?\b/gi, (m) => (/s$/i.test(m) ? 'razones' : 'razón'));
    t = t.replace(/\bpilates de youtube\b/gi, 'Pilates de YouTube');
    return t;
  }
  t = t.replace(/\bERROURS\b/g, 'ERREURS');
  t = t.replace(/\berrours\b/gi, 'erreurs');
  t = t.replace(/\bATTENDES\b/g, 'ATTEND');
  t = t.replace(/\bRAISON D['’ ]?ARR[ÊE]TER\b/gi, 'RAISONS D’ARRÊTER');
  t = t.replace(/\bSEPT JOURS\b/g, '7 JOURS');
  t = t.replace(/\bpilates youtube\b/gi, (m) =>
    m === m.toUpperCase() ? 'PILATES YOUTUBE' : 'Pilates YouTube',
  );
  return sanitizeOverlayBrandTerms(t);
}

/** Nombre de slides carousel (couverture + 4 points + CTA). Plus de slide « citation » vide. */
export const CAROUSEL_SLIDE_COUNT = 6;

/**
 * RÈGLE PERMANENTE — format carousel FitMangas (ne jamais dériver).
 * Le carousel est TOUJOURS une LISTE de points autonomes, JAMAIS une narration découpée.
 */
export const CAROUSEL_LIST_FORMAT_RULES = `
CAROUSEL = LISTE de points AUTONOMES (JAMAIS une histoire / récit découpé en slides).
- Slide 1 = titre-promesse CHIFFRÉ : « 5 RAISONS DE… », « 5 CHOSES QUE PERSONNE NE TE DIT SUR… ».
  INTERDIT de recopier le pack « 5 RAISONS D'ARRÊTER LE PILATES YOUTUBE » — inventer une liste LIÉE AU THÈME DU SLOT.
- Slides 2–5 = UN point complet AUTONOME numéroté (« 1. LE MARDI EST DÉJÀ PRIS »).
  Chaque titre a du SENS lu SEUL, hors contexte.
  INTERDIT fragments de récit : « CE QU'UNE MANGITA A COMPRIS », « LA COACH DIT SON PRÉNOM »,
  « AVANT PERSONNE NE L'ATTENDAIT », « ELLE NE RATE PLUS LE MARDI », cliffhangers, suite d'histoire.
  OBLIGATOIRE affirmations autonomes à la 2e personne, SPÉCIFIQUES au thème (pas toujours « TU NE VOIS PAS TES ERREURS »).
- Slide 6 = CTA (« ESSAI 7 JOURS — ON T'ATTEND EN VISIO »).
- Légende = 1 paragraphe développé PAR point, MÊME ORDRE que les slides (150–300 mots).
  Hook dans les 125 premiers car. CTA essai 7 jours UNE seule fois en dernière ligne.
- INTERDIT « Mangitas » / « MANGITAS » dans slideTitles, overlayText et titres visibles : dire « FitMangas » ou « la communauté » / « la comunidad » (sans suffixe Mangitas).
`.trim();

/** Couverture chiffrée type « 5 RAISONS… » / « 5 CHOSES… ». */
const COVER_NUMBERED_PROMISE =
  /\b\d+\s*(RAISONS?|CHOSES?|SIGNES?|HABITUDES?|ERREURS?|MYTHES?|RAZONES|COSAS|SEÑALES|HÁBITOS)\b/i;

/** Fragments narratifs interdits (histoire découpée, 3e personne récit). */
const NARRATIVE_FRAGMENT_RE =
  /\b(CE QU['']UNE MANGITA|ELLE A |ELLE NE |AVANT,?\s*PERSONNE|LA COACH DIT|SON PR[ÉE]NOM|NE L['']ATTENDAIT|A COMPRIS|PREMI[ÈE]RE SEMAINE|DEUXI[ÈE]ME MOIS|AUJOURD['']HUI ELLE)\b/i;

/**
 * Détecte un titre carousel hors format LISTE (narration / fragment / non numéroté).
 * slideIndex 0 = couverture · 1–4 = points · 5 = CTA.
 */
export function looksLikeNarrativeCarouselFragment(title: string, slideIndex: number): boolean {
  const t = (title || '').trim();
  if (!t || isBareNumericSlideTitle(t)) return true;
  if (slideIndex === 0) {
    if (NARRATIVE_FRAGMENT_RE.test(t)) return true;
    if (!COVER_NUMBERED_PROMISE.test(t)) return true;
    return false;
  }
  if (slideIndex >= 1 && slideIndex <= 4) {
    if (!/^\d+[.)]\s+\S/.test(t)) return true;
    if (NARRATIVE_FRAGMENT_RE.test(t)) return true;
    const up = t.toLocaleUpperCase('fr-FR');
    // 3e personne / possessif récit sans « tu »
    if (/\b(ELLE|SON|SA|SES)\b/.test(up) && !/\b(TU|TES|TON|TA)\b/.test(up)) return true;
    return false;
  }
  // CTA : doit mentionner essai / prueba
  if (slideIndex === 5) {
    return !/(ESSAI|PRUEBA|7\s*JOURS|7\s*D[IÍ]AS)/i.test(t);
  }
  return false;
}

const OVERLAY_REVIEW_MARKERS = {
  fr: [
    'OVERLAY À REVOIR — COUVERTURE',
    '1. OVERLAY À REVOIR',
    '2. OVERLAY À REVOIR',
    '3. OVERLAY À REVOIR',
    '4. OVERLAY À REVOIR',
    'OVERLAY À REVOIR — CTA',
  ],
  es: [
    'OVERLAY A REVISAR — PORTADA',
    '1. OVERLAY A REVISAR',
    '2. OVERLAY A REVISAR',
    '3. OVERLAY A REVISAR',
    '4. OVERLAY A REVISAR',
    'OVERLAY A REVISAR — CTA',
  ],
} as const;

export function overlaysNeedReviewFromTitles(titles: string[]): boolean {
  return titles.some((t) => isOverlayReviewMarker(t || ''));
}

/** Marqueur admin — ne doit jamais être gravé sur une image publiée. */
export function isOverlayReviewMarker(text: string): boolean {
  return /overlay\s*à\s*revoir|overlay\s*a\s*revisar/i.test((text || '').trim());
}

/**
 * Titres overlay carousel — JAMAIS le pack figé « 5 RAISONS… YOUTUBE ».
 * Slide IA invalide / vide → marqueur « overlays à revoir ».
 */
export function normalizeCarouselSlideTitles(
  raw: unknown,
  fallbackOverlay: string,
  locale: SocialLocale = 'fr',
): { titles: string[]; overlaysNeedReview: boolean } {
  const fromAi = Array.isArray(raw)
    ? raw.map((x) => proofreadCarouselCopy(String(x || '').trim(), locale))
    : [];
  const markers = locale === 'es' ? OVERLAY_REVIEW_MARKERS.es : OVERLAY_REVIEW_MARKERS.fr;
  const coverFallback =
    fallbackOverlay && !looksLikeNarrativeCarouselFragment(fallbackOverlay, 0)
      ? proofreadCarouselCopy(fallbackOverlay, locale)
      : '';

  const out: string[] = [];
  let needsReview = false;
  for (let i = 0; i < CAROUSEL_SLIDE_COUNT; i += 1) {
    let candidate = fromAi[i] || (i === 0 ? coverFallback : '');
    let polished = polishOverlayText(candidate, locale, 56);
    if (
      !polished ||
      isBareNumericSlideTitle(polished) ||
      looksLikeNarrativeCarouselFragment(polished, i) ||
      (candidate && looksLikeNarrativeCarouselFragment(candidate, i))
    ) {
      polished = markers[i]!;
      needsReview = true;
    }
    out.push(proofreadCarouselCopy(polished, locale));
  }
  if (overlaysNeedReviewFromTitles(out)) needsReview = true;
  if (out.some((t) => /PILATES\s+(DE\s+)?YOUTUBE/i.test(t))) needsReview = true;
  return { titles: out, overlaysNeedReview: needsReview };
}

/**
 * Exemple canonique du format carousel LISTE (6 slides).
 * Slide 1 = promesse · 2–5 = points autonomes · 6 = CTA.
 */
export function exampleListCarouselCopy(locale: SocialLocale = 'fr'): {
  slideTitles: string[];
  caption: string;
  note: string;
} {
  if (locale === 'es') {
    const slideTitles = [
      '5 RAZONES POR LAS QUE UN GRUPO AGUANTA',
      '1. ALGUIEN NOTA SI FALTAS',
      '2. EL MARTES A LAS 19H YA ESTÁ PILLADO',
      '3. YA NO IMPROVISAS SOLA',
      '4. VES QUE LAS OTRAS TAMBIÉN AGUANTAN',
      'PRUEBA 7 DÍAS — TE ESPERAMOS EN VISIO',
    ];
    const caption = buildCarouselMappedCaption({
      slideTitles,
      bodyParagraphs: [
        '5 razones por las que un grupo aguanta — y por qué no es una cuestión de voluntad aislada.',
        '1. Alguien nota si faltas. Sin cita fija, el mat vuelve al armario en cuanto llega el correo.',
        '2. El martes a las 19h ya está pillado. Ya no es una intención: es un hueco, como una cita médica.',
        '3. Ya no improvisas sola. No tienes que elegir « qué vídeo esta noche » a las 21h, agotada.',
        '4. Ves que las otras también aguantan. El grupo enseña que el problema no eres tú.',
        'Prueba gratis 7 días → fitmangas.com',
      ],
      cta: 'Prueba gratis 7 días → fitmangas.com',
      locale: 'es',
    });
    return { slideTitles, caption, note: 'Formato LISTA — 6 slides, no narrativa troceada.' };
  }
  const slideTitles = [
    '5 RAISONS POUR LESQUELLES UN GROUPE TIENT',
    '1. QUELQU’UN REMARQUE TON ABSENCE',
    '2. LE MARDI 19H EST DÉJÀ PRIS',
    '3. TU N’IMPROVISES PLUS SEULE',
    '4. TU VOIS QUE LES AUTRES TIENTENT AUSSI',
    'ESSAI 7 JOURS — ON T’ATTEND EN VISIO',
  ];
  const caption = buildCarouselMappedCaption({
    slideTitles,
        bodyParagraphs: [
          '5 raisons pour lesquelles un groupe tient — et pourquoi ce n’est pas une question de volonté isolée.',
          '1. Quelqu’un remarque ton absence. Sans rendez-vous, le tapis retourne au placard dès que le mail arrive.',
          '2. Le mardi 19h est déjà pris. Ce n’est plus une intention : c’est un créneau, comme un rendez-vous médical.',
          '3. Tu n’improvises plus seule. Tu n’as plus à choisir « quelle vidéo ce soir » à 21h, épuisée.',
          '4. Tu vois que les autres tiennent aussi. Le groupe rend visible que ce n’est pas toi le problème.',
          'Essai gratuit 7 jours → fitmangas.com',
        ],
    cta: 'Essai gratuit 7 jours → fitmangas.com',
    locale: 'fr',
  });
  return {
    slideTitles,
    caption,
    note: 'Format LISTE — 6 slides. Chaque titre a du sens seul. Pas d’histoire découpée.',
  };
}

/**
 * Texte LISTE pour le carousel « progrès / confiance Mangita » (sans narration découpée).
 * À valider humainement avant toute régénération d’images.
 */
export function mangitaProgressListCarouselCopy(locale: SocialLocale = 'fr'): {
  slideTitles: string[];
  caption: string;
  title: string;
} {
  if (locale === 'es') {
    const slideTitles = [
      '5 RAZONES POR LAS QUE UN GRUPO AGUANTA',
      '1. ALGUIEN NOTA SI FALTAS',
      '2. EL MARTES A LAS 19H YA ESTÁ PILLADO',
      '3. YA NO IMPROVISAS SOLA',
      '4. VES QUE LAS OTRAS TAMBIÉN AGUANTAN',
      'PRUEBA 7 DÍAS — TE ESPERAMOS EN VISIO',
    ];
    return {
      slideTitles,
      title: '5 razones por las que un grupo aguanta',
      caption: buildCarouselMappedCaption({
        slideTitles,
        bodyParagraphs: [
          '5 razones por las que un grupo aguanta cuando lo que buscas es sostenerte — no acumular favoritos.',
          '1. Alguien nota si faltas. Sin cita fija, el mat vuelve al armario en cuanto llega el correo o la carga mental.',
          '2. El martes a las 19h ya está pillado. Ya no es una intención: es un hueco en la semana.',
          '3. Ya no improvisas sola. No eliges un vídeo a las 21h, agotada.',
          '4. Ves que las otras también aguantan. El grupo enseña que el problema no eres tú.',
          'Prueba gratis 7 días → fitmangas.com',
        ],
        cta: 'Prueba gratis 7 días → fitmangas.com',
        locale: 'es',
      }),
    };
  }
  // Même ossature LISTE que le carousel qui marchait — thème progrès / solo vs live.
  const base = exampleListCarouselCopy('fr');
  return {
    slideTitles: base.slideTitles,
    caption: base.caption,
    title: '5 raisons pour lesquelles un groupe tient',
  };
}

export function buildCarouselMappedCaption(params: {
  slideTitles: string[];
  bodyParagraphs?: string[];
  cta: string;
  locale?: SocialLocale;
}): string {
  const locale = params.locale ?? 'fr';
  const titles = params.slideTitles.slice(0, CAROUSEL_SLIDE_COUNT);
  const paras = params.bodyParagraphs ?? [];
  const lines: string[] = [];
  const last = titles.length - 1;
  for (let i = 0; i < titles.length; i += 1) {
    const title = titles[i]!;
    const body = (paras[i] || '').trim();
    if (i === 0) {
      lines.push(body || `${title}.`);
    } else if (i === last) {
      lines.push(
        body ||
          params.cta ||
          (locale === 'es' ? 'Prueba gratis 7 días → fitmangas.com' : 'Essai gratuit 7 jours → fitmangas.com'),
      );
    } else {
      lines.push(body || `${title}.`);
    }
  }
  let caption = lines.filter(Boolean).join('\n\n');
  caption = mergeCaptionWithCta(caption, params.cta);
  caption = proofreadCarouselCopy(caption, locale);
  const ceiling = captionBandCharCeiling(CAPTION_BY_FORMAT.carousel);
  if (caption.length > ceiling) caption = caption.slice(0, ceiling - 1).trimEnd() + '…';
  return caption;
}

/** Légende carousel mappée aux slides (1 paragraphe par point, pas un bloc narratif unique). */
export function carouselCaptionHasSlideStructure(caption: string, slideTitles: string[]): boolean {
  const paras = caption
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paras.length < 5) return false;

  for (let i = 1; i <= 4; i += 1) {
    const title = (slideTitles[i] || '').trim();
    if (!title || isOverlayReviewMarker(title)) continue;
    const numbered = title.match(/^(\d+[.)])\s*/);
    const needle = numbered
      ? numbered[1]!
      : title
          .split(/\s+/)
          .slice(0, 4)
          .join(' ')
          .toLocaleUpperCase('fr-FR');
    const hit = paras.some((p) => {
      const up = p.toLocaleUpperCase('fr-FR');
      return up.includes(needle) || (numbered && p.includes(numbered[1]!));
    });
    if (!hit) return false;
  }
  return true;
}

/** Ouverture « X n’est pas Y » sans scène concrète = rejet. */
const OPENS_WITH_NEGATION_NO_SCENE =
  /^(ce n['’]est pas|no es|eso no es|no es falta de|el problema no es)\b/i;

const HAS_CONCRETE_SCENE =
  /\b(tu |te |tes |ton |ta |tú |te |tus |cuando |quand |après |tras |à \d|las \d|heure|chaise|silla|bureau|lèves|levantas|redresses|journée|día sentada|corps|cuerpo)\b/i;

export function titleFailsQualityGate(title: string): boolean {
  const t = (title || '').trim();
  if (!t || t.length < 12) return true;
  if (TITLE_BLACKLIST.test(t)) return true;
  if (violatesTrashTalkDignity(t) && /trop\s+vieille|paresseuse|grosse|nulle/i.test(t)) return true;
  if (/^(titre à revoir|título a revisar)/i.test(t)) return true;
  if (OPENS_WITH_NEGATION_NO_SCENE.test(t) && !HAS_CONCRETE_SCENE.test(t)) return true;
  return false;
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

/** @deprecated Ne plus injecter silencieusement — brief vide = échec explicite. */
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

/**
 * Brouillon LinkedIn minimal (hook + corps source) — PAS les 3 paragraphes figés.
 * L’adaptation réelle passe par adaptCaptionToLinkedInViaLlm (cascade texte).
 * Si LLM échoue → needsManual: true.
 */
export function adaptCaptionToLinkedInDraft(source: {
  title: string;
  caption: string;
  cta: string;
  hookTitle?: string;
}): { title: string; caption: string; cta: string; hashtags: string[]; needsManual: boolean } {
  const hook = (source.hookTitle || source.title || '').trim();
  const body = source.caption.replace(/#\w+/g, '').trim();
  const caption = [
    '[LÉGENDE LINKEDIN À RÉDIGER / RÉGÉNÉRER]',
    hook ? `${hook.charAt(0)}${hook.slice(1).toLowerCase()}` : source.title,
    '',
    body.slice(0, 600),
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 1200);

  return {
    title: source.title.slice(0, 120),
    caption,
    cta: source.cta || 'Découvrir FitMangas : fitmangas.com',
    hashtags: ['Pilates', 'BienEtreAuTravail'],
    needsManual: true,
  };
}

/** @deprecated Utiliser adaptCaptionToLinkedInViaLlm — conserve un draft marqué manuel. */
export function adaptCaptionToLinkedIn(source: {
  title: string;
  caption: string;
  cta: string;
  hookTitle?: string;
}): { title: string; caption: string; cta: string; hashtags: string[]; needsManual: boolean } {
  return adaptCaptionToLinkedInDraft(source);
}

export function analyzeCaptionForPost(
  caption: string,
  network: SocialNetwork,
  format: SocialPostFormat,
  hashtagCount = 0,
) {
  const g = SOCIAL_CM_GUIDELINES[network];
  const band: CaptionBand =
    network === 'facebook'
      ? {
          min: 30,
          idealMin: 40,
          idealMax: 180,
          max: 500,
          unit: 'chars',
          hint: 'Facebook = miroir IG : légende IG OK.',
        }
      : network === 'whatsapp'
        ? CAPTION_BY_FORMAT.text
        : network === 'linkedin'
          ? {
              min: 200,
              idealMin: 400,
              idealMax: 900,
              max: 1300,
              unit: 'chars',
              hint: 'LinkedIn : hook + 2–4 courts paragraphes + question ouverte.',
            }
          : CAPTION_BY_FORMAT[format] ?? CAPTION_BY_FORMAT.feed;

  const trimmed = caption.trim();
  const length = band.unit === 'words' ? countCaptionWords(trimmed) : trimmed.length;
  const unitLabel = band.unit === 'words' ? 'mots' : 'car.';
  const warnings: string[] = [];
  if (length > band.max) warnings.push(`Trop longue (${length}/${band.max} ${unitLabel}). ${band.hint}`);
  else if (length < band.min) warnings.push(`Trop courte (${length} ${unitLabel}). ${band.hint}`);
  else if (length < band.idealMin || length > band.idealMax) {
    warnings.push(`Hors zone idéale ${band.idealMin}–${band.idealMax} ${unitLabel}. ${band.hint}`);
  }
  if (trimmed.length >= 40 && (format === 'feed' || format === 'carousel' || format === 'reel')) {
    const hookWindow = trimmed.slice(0, 125);
    if (hookWindow.length < 40) {
      warnings.push('Hook trop court dans les 125 premiers caractères (texte visible avant « …plus »).');
    }
  }
  const ctaHits = (trimmed.match(/essai\s+gratuit\s+7\s+jours|prueba\s+gratis\s+7\s+d[ií]as/gi) || []).length;
  if (ctaHits > 1) warnings.push('CTA « essai 7 jours » répété — une seule fois en fin de légende.');
  if (hashtagCount > g.hashtagMax) warnings.push(`Trop de hashtags (${hashtagCount}/${g.hashtagMax}).`);
  return {
    length,
    max: band.max,
    ideal: Math.round((band.idealMin + band.idealMax) / 2),
    idealMin: band.idealMin,
    idealMax: band.idealMax,
    unit: band.unit,
    unitLabel,
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
