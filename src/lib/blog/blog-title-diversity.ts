/**
 * Anti-répétition des gabarits de titre et des angles éditoriaux (blog).
 * Même logique que la rotation des piliers CM : max 1 moule « N astuces » par lot / semaine,
 * pas deux fois le même gabarit d’affilée, pas le même angle deux fois de suite.
 */

import { enforceBlogSeoTitle } from '@/lib/blog/blog-seo-limits';

export type BlogTitleMold =
  | 'n_tips'
  | 'question'
  | 'benefit_claim'
  | 'myth_bust'
  | 'concrete_scene'
  | 'number_led'
  | 'other';

export const BLOG_TITLE_MOLD_LABELS: Record<BlogTitleMold, string> = {
  n_tips: 'N astuces/actions/conseils pour…',
  question: 'Question (Pourquoi / Comment… ?)',
  benefit_claim: 'Affirmation-bénéfice',
  myth_bust: 'Mythe cassé',
  concrete_scene: 'Scène concrète du quotidien',
  number_led: 'Chiffre en tête (durée, min) sans liste',
  other: 'Autre',
};

/** Max 1 titre « N astuces/actions/conseils pour » par lot de génération / fenêtre récente. */
export const MAX_N_TIPS_PER_BATCH = 1;

export type BlogAngleId =
  | 'respiration'
  | 'dos'
  | 'posture_bureau'
  | 'posture'
  | 'perimenopause'
  | 'debutante'
  | 'regularite'
  | 'nutrition'
  | 'renforcement_centre'
  | 'technique_exercice'
  | 'emploi_temps'
  | 'bassin'
  | 'energie'
  | 'general';

const ANGLE_RULES: Array<{ id: BlogAngleId; re: RegExp }> = [
  { id: 'respiration', re: /respir|souffle|diaphragm/i },
  { id: 'dos', re: /\bdos\b|lombaire|sciati|nuque raide/i },
  { id: 'posture_bureau', re: /bureau|écran|ordinateur|assise prolong/i },
  { id: 'perimenopause', re: /périménopause|perimenopause|ménopause|menopause/i },
  { id: 'debutante', re: /débutant|debutant|première séance|nouvelle élève/i },
  { id: 'nutrition', re: /soupe|agrum|nutrition|manger de saison|aliment/i },
  { id: 'renforcement_centre', re: /centre|abdos|core|gainage|renforc/i },
  { id: 'technique_exercice', re: /poignet|leg pull|avant-bras|exercice|roll.?up|teaser/i },
  { id: 'bassin', re: /bassin|pelvis|plancher pelvien/i },
  { id: 'posture', re: /posture|align/i },
  { id: 'energie', re: /énergie|energie|hiver|fatigue|fatigué|forces trop|15h/i },
  { id: 'regularite', re: /régularité|regularite|habitude|constance|motivation|décourag|stagn|progresser|freine|mythe/i },
  { id: 'emploi_temps', re: /emploi du temps|pas le temps|chargé|20\s*min|15\s*min/i },
];

export function detectBlogAngle(text: string): BlogAngleId {
  const hay = (text || '').trim();
  if (!hay) return 'general';
  for (const rule of ANGLE_RULES) {
    if (rule.re.test(hay)) return rule.id;
  }
  return 'general';
}

/**
 * Détecte le gabarit dominant d’un titre.
 * « N astuces/actions/conseils pour… » = moule cannibalisant à limiter.
 */
export function detectTitleMold(title: string): BlogTitleMold {
  const t = (title || '').replace(/\s+/g, ' ').trim();
  if (!t) return 'other';

  // N astuces / N actions / N conseils … pour …
  if (/\b\d+\s*(astuces?|actions?|conseils?|clés?|erreurs?|raisons?)\b/i.test(t) && /\bpour\b/i.test(t)) {
    return 'n_tips';
  }
  if (/pilates\s*:?\s*\d+\s*(astuces?|actions?|conseils?)/i.test(t)) {
    return 'n_tips';
  }

  if (/\b(ne\s+\w+\s+pas|n['’]est\s+pas|vraiment\s*\?|mythe|faux\s*:)/i.test(t) || /—\s*vraiment\s*\?/i.test(t)) {
    return 'myth_bust';
  }

  if (/^(pourquoi|comment|et si|et toi)\b/i.test(t) || /\?\s*$/.test(t)) {
    return 'question';
  }

  if (/^\d+\s*(min|minutes?|semaines?|jours?)\b/i.test(t) || /\b\d+\s*min\b/i.test(t)) {
    return 'number_led';
  }

  if (
    /\b(quand|à\s+\d+h|au bureau|le soir|le matin|entre deux|après|avant)\b/i.test(t) ||
    /\b(ton dos|tes hanches|ton bassin|tes épaules)\b/i.test(t)
  ) {
    return 'concrete_scene';
  }

  if (/\b(change|améliore|vaut mieux|suffit|mieux que|plus que)\b/i.test(t)) {
    return 'benefit_claim';
  }

  return 'other';
}

export function isNTipsTitleMold(title: string): boolean {
  return detectTitleMold(title) === 'n_tips';
}

function normalizeTokens(title: string): string[] {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['les', 'des', 'une', 'pour', 'dans', 'avec', 'sans', 'plus', 'pilates'].includes(w));
}

/** Même structure + même bénéfice ≈ cannibalisation SEO. */
export function titlesTooSimilar(a: string, b: string): boolean {
  if (!a?.trim() || !b?.trim()) return false;
  if (a.trim().toLowerCase() === b.trim().toLowerCase()) return true;

  const moldA = detectTitleMold(a);
  const moldB = detectTitleMold(b);
  if (moldA !== moldB) return false;
  if (moldA === 'other') return false;

  const ta = new Set(normalizeTokens(a));
  const tb = new Set(normalizeTokens(b));
  if (ta.size === 0 || tb.size === 0) return false;
  let inter = 0;
  for (const tok of ta) {
    if (tb.has(tok)) inter += 1;
  }
  const union = ta.size + tb.size - inter;
  const jaccard = union === 0 ? 0 : inter / union;
  // Même moule + overlap fort de tokens → quasi-jumeau
  return jaccard >= 0.45;
}

export type TitleDiversityContext = {
  /** Titres déjà retenus dans le lot / la fenêtre récente (ordre chrono, plus ancien → plus récent). */
  recentTitles: string[];
  /** Angle de l’article précédent (rotation). */
  lastAngle?: BlogAngleId | null;
  /** Angles à éviter (déjà utilisés récemment). */
  recentAngles?: BlogAngleId[];
  /** Force l’interdiction du moule N astuces (ex. 2e passe après rejet). */
  forbidNTips?: boolean;
};

export type TitleDiversityResult =
  | { ok: true; mold: BlogTitleMold; angle: BlogAngleId }
  | { ok: false; reason: string; mold: BlogTitleMold; angle: BlogAngleId };

/**
 * Valide qu’un titre candidat respecte l’anti-répétition du lot / de la semaine.
 */
export function assertTitleDiversity(
  title: string,
  ctx: TitleDiversityContext,
  opts?: { angleHint?: string },
): TitleDiversityResult {
  const mold = detectTitleMold(title);
  const angle = detectBlogAngle(`${title} ${opts?.angleHint ?? ''}`);

  const recent = ctx.recentTitles.filter(Boolean);
  const nTipsCount = recent.filter((t) => isNTipsTitleMold(t)).length;
  if (mold === 'n_tips' && (ctx.forbidNTips || nTipsCount >= MAX_N_TIPS_PER_BATCH)) {
    return {
      ok: false,
      reason: ctx.forbidNTips
        ? 'Moule « N astuces/actions pour… » interdit pour cette passe — choisis un autre gabarit.'
        : `Moule « N astuces/actions pour… » déjà utilisé ${nTipsCount}× dans le lot — max ${MAX_N_TIPS_PER_BATCH}.`,
      mold,
      angle,
    };
  }

  // Pas le même gabarit d’affilée
  const lastTitle = recent[recent.length - 1];
  if (lastTitle && detectTitleMold(lastTitle) === mold && mold !== 'other') {
    return {
      ok: false,
      reason: `Même gabarit « ${BLOG_TITLE_MOLD_LABELS[mold]} » que le titre précédent — varie.`,
      mold,
      angle,
    };
  }

  for (const other of recent) {
    if (titlesTooSimilar(title, other)) {
      return {
        ok: false,
        reason: `Titre trop similaire à « ${other.slice(0, 48)} » (même structure + bénéfice).`,
        mold,
        angle,
      };
    }
  }

  if (ctx.lastAngle && angle !== 'general' && angle === ctx.lastAngle) {
    return {
      ok: false,
      reason: `Angle « ${angle} » identique à l’article précédent — change d’angle.`,
      mold,
      angle,
    };
  }

  return { ok: true, mold, angle };
}

/** Gabarits autorisés à proposer à l’IA (hors n_tips si déjà pris). */
export function preferredMoldsForContext(ctx: TitleDiversityContext): BlogTitleMold[] {
  const recent = ctx.recentTitles.filter(Boolean);
  const nTipsUsed = ctx.forbidNTips || recent.some((t) => isNTipsTitleMold(t));
  const lastMold = recent.length ? detectTitleMold(recent[recent.length - 1]!) : null;
  const all: BlogTitleMold[] = ['question', 'benefit_claim', 'myth_bust', 'concrete_scene', 'number_led', 'n_tips'];
  return all.filter((m) => {
    if (m === 'n_tips' && nTipsUsed) return false;
    if (lastMold && m === lastMold) return false;
    return true;
  });
}

export function buildTitleDiversityPromptBlock(ctx: TitleDiversityContext): string {
  const recent = ctx.recentTitles.slice(-12);
  const molds = preferredMoldsForContext(ctx);
  const moldLines = molds.map((m) => `- ${BLOG_TITLE_MOLD_LABELS[m]}`).join('\n');
  const recentLines = recent.length
    ? recent.map((t) => `- [${detectTitleMold(t)}] ${t}`).join('\n')
    : '(aucun)';

  return `ANTI-RÉPÉTITION (obligatoire):
- Varie le GABARIT de titre. Gabarits autorisés pour CE titre:
${moldLines}
- INTERDIT: réutiliser le moule "N astuces/actions/conseils pour [bénéfice]" s'il apparaît déjà dans les titres récents (max 1 par lot/semaine).
- INTERDIT: même structure + même bénéfice qu'un titre récent (cannibalisation SEO).
- Titres récents à ne pas pasticher:
${recentLines}
- Angles récents à ne pas répéter d'affilée: ${(ctx.recentAngles ?? []).slice(-6).join(', ') || '(aucun)'}
- lastAngle interdit pour ce titre: ${ctx.lastAngle ?? '(aucun)'}`;
}

/** Amorce générique de chapo / corps à rejeter. */
export function looksLikeGenericBlogOpener(text: string): boolean {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  return (
    /^un guide concret pour progresser en pilates/i.test(t) ||
    /autour de\s*["']?article pilates\s*\d+/i.test(t) ||
    /^pourquoi ce sujet change ta pratique/i.test(t) ||
    /^conseils pilates pratiques pour l/i.test(t)
  );
}

export function enforceDiverseTitle(title: string): string {
  return enforceBlogSeoTitle(title);
}
