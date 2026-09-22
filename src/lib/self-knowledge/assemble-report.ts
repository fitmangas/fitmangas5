import { ATTACHMENT_LABELS } from './ecr-short';
import { BIG_FIVE_LABELS } from './ipip50';
import { IPIP120_FACET_IDS } from './ipip120';
import {
  ATTACHMENT_DIMENSION_BANK,
  bandFromAttachmentMean,
  fallbackAttachmentStylePortrait,
} from './banks/attachment-bank';
import {
  BIG_FIVE_FACET_BANK,
  bandFromFacetScore,
  FACET_LABELS,
  type FacetId,
} from './banks/big-five-facets';
import {
  BIG_FIVE_TRAIT_BANK,
  bandFromTraitScore,
  matchingCombinationInsights,
  type BigFiveTraitKey,
  type Level,
} from './banks/big-five-traits';
import {
  BALANCED_PROFILE_COPY,
  deriveAttachmentPortrait,
  deriveBigFivePortrait,
  isBalancedBands,
} from './banks/portraits';
import {
  ATTACHMENT_BAND_PHRASE,
  ATTACHMENT_PRACTICE_IMPACT,
  TRAIT_BAND_PHRASE,
  assemblePracticeImpactBlock,
  bandWord,
  microRecoText,
  pickAttachmentMicroReco,
  pickBigFiveMicroReco,
} from './banks/practice-impact';
import type {
  BigFiveFormat,
  SelfTestAnalysis,
  SelfTestFacetSection,
  SelfTestLang,
  SelfTestScorePhrase,
  SelfTestScores,
} from './types';

const TRAIT_ORDER: BigFiveTraitKey[] = ['E', 'A', 'C', 'ES', 'O'];

export type TraitBundle = {
  key: BigFiveTraitKey;
  score: number;
  band: Level;
  label: string;
  narrative: string;
  force: string;
  limit: string;
};

function sourceBadge(lang: SelfTestLang, withClaude = false): string {
  if (lang === 'fr') {
    return withClaude ? 'Banque + Claude' : 'Banque FitMangas';
  }
  return withClaude ? 'Banco + Claude' : 'Banco FitMangas';
}

function firstSentences(text: string, count: number): string {
  const sentences = text.match(/[^.!?…]+[.!?…]+/g);
  if (!sentences?.length) return text.slice(0, 220).trim();
  return sentences.slice(0, count).join(' ').trim();
}

/** Normalise pour comparer phrases (dédoublonnage). */
export function normalizePhrase(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Retire les phrases déjà utilisées (fuzzy : inclusion ≥ 60 % des mots longs). */
export function dedupeAgainstUsed(candidates: string[], used: Set<string>): string[] {
  const out: string[] = [];
  for (const raw of candidates) {
    const text = raw.trim();
    if (!text) continue;
    const norm = normalizePhrase(text);
    if (!norm) continue;
    let duplicate = false;
    for (const u of used) {
      if (u === norm || u.includes(norm) || norm.includes(u)) {
        duplicate = true;
        break;
      }
      const words = norm.split(' ').filter((w) => w.length > 4);
      if (words.length >= 4) {
        const hit = words.filter((w) => u.includes(w)).length;
        if (hit / words.length >= 0.6) {
          duplicate = true;
          break;
        }
      }
    }
    if (duplicate) continue;
    used.add(norm);
    out.push(text);
  }
  return out;
}

function buildTraitBands(scores: SelfTestScores): Record<BigFiveTraitKey, Level> {
  const bands = {} as Record<BigFiveTraitKey, Level>;
  for (const key of TRAIT_ORDER) {
    bands[key] = bandFromTraitScore(scores[key] ?? 30);
  }
  return bands;
}

/** Sélectionne le contenu banque pour chaque trait Big Five. */
export function selectTraitBundle(
  scores: SelfTestScores,
  lang: SelfTestLang
): TraitBundle[] {
  return TRAIT_ORDER.map((key) => {
    const score = scores[key] ?? 30;
    const band = bandFromTraitScore(score);
    const bank = BIG_FIVE_TRAIT_BANK[key][band];
    return {
      key,
      score,
      band,
      label: BIG_FIVE_LABELS[key]![lang],
      narrative: bank.narrative[lang],
      force: bank.force[lang],
      limit: bank.limit[lang],
    };
  });
}

/** N (névrosisme IPIP) → ES (stabilité émotionnelle) pour l’UI FitMangas. */
function facetParentTrait(facetId: string): string {
  const letter = facetId.charAt(0);
  if (letter === 'N') return 'ES';
  return letter;
}

function buildFacetSections(
  scores: SelfTestScores,
  lang: SelfTestLang
): SelfTestFacetSection[] {
  const sections: SelfTestFacetSection[] = [];
  for (const id of IPIP120_FACET_IDS) {
    const raw = scores[id];
    if (raw == null) continue;
    const band = bandFromFacetScore(raw);
    const bank = BIG_FIVE_FACET_BANK[id as FacetId][band];
    sections.push({
      id,
      label: FACET_LABELS[id as FacetId][lang],
      score: raw,
      band,
      bandLabel: bandWord(lang, band),
      parentTrait: facetParentTrait(id),
      narrative: bank.narrative[lang],
      force: bank.force[lang],
      limit: bank.limit[lang],
    });
  }
  return sections;
}

function buildBigFiveScorePhrases(
  scores: SelfTestScores,
  lang: SelfTestLang
): SelfTestScorePhrase[] {
  return TRAIT_ORDER.map((key) => {
    const score = scores[key] ?? 30;
    const band = bandFromTraitScore(score);
    const percent = Math.round(((score - 10) / 40) * 100);
    return {
      key,
      label: BIG_FIVE_LABELS[key]![lang],
      percent: Math.min(100, Math.max(0, percent)),
      phrase: TRAIT_BAND_PHRASE[key][band][lang],
      band,
    };
  });
}

function buildFullText(
  lang: SelfTestLang,
  portrait: SelfTestAnalysis['portrait'],
  sections: NonNullable<SelfTestAnalysis['sections']>,
  instrumentVersion: string
): string {
  const h = lang === 'fr';
  const lines: string[] = [];

  lines.push(h ? `Portrait — ${portrait!.name}` : `Retrato — ${portrait!.name}`);
  lines.push(portrait!.tagline);
  lines.push('');
  lines.push(h ? 'Qui tu es' : 'Quién eres');
  lines.push(sections.whoYouAre);
  lines.push('');
  lines.push(h ? 'Comment tu fonctionnes' : 'Cómo funcionas');
  lines.push(sections.howYouWork);
  lines.push('');
  lines.push(h ? 'Forces' : 'Fortalezas');
  for (const f of sections.forces) lines.push(`• ${f}`);
  lines.push('');
  lines.push(h ? 'Limites' : 'Límites');
  for (const l of sections.limits) lines.push(`• ${l}`);
  if (sections.combinations.length) {
    lines.push('');
    lines.push(h ? 'Combinaisons repérées' : 'Combinaciones detectadas');
    for (const c of sections.combinations) lines.push(`• ${c}`);
  }
  if (sections.practiceImpact?.length) {
    lines.push('');
    lines.push(h ? 'Ce que ça change pour ta pratique' : 'Qué cambia para tu práctica');
    for (const p of sections.practiceImpact) lines.push(`• ${p}`);
  }
  if (sections.microRecommendation) {
    lines.push('');
    lines.push(sections.microRecommendation);
  }
  if (sections.facets?.length) {
    lines.push('');
    lines.push(h ? 'Facettes détaillées' : 'Facetas detalladas');
    for (const facet of sections.facets) {
      lines.push('');
      lines.push(`${facet.label} — ${facet.bandLabel}`);
      lines.push(facet.narrative);
    }
  }
  lines.push('');
  lines.push(portrait!.disclaimer);
  lines.push('');
  lines.push(h ? `Instrument : ${instrumentVersion}` : `Instrumento : ${instrumentVersion}`);

  return lines.join('\n');
}

function buildTeaser(
  portrait: SelfTestAnalysis['portrait'],
  forces: string[],
  whoYouAre: string,
  lang: SelfTestLang
): string {
  const excerpt = firstSentences(whoYouAre, 2);
  const forceText = forces.slice(0, 2).join(lang === 'fr' ? ' · ' : ' · ');
  return `${portrait!.name} — ${portrait!.tagline} ${forceText ? (lang === 'fr' ? `Forces : ${forceText}. ` : `Fortalezas: ${forceText}. `) : ''}${excerpt}`;
}

/**
 * Assemble le rapport Big Five : sections disjointes (zéro phrase dupliquée).
 * - Qui tu es = portrait + (équilibré OU 2–3 narratives distinctes)
 * - Comment tu fonctionnes = fonctionnement pratique (pas les mêmes phrases)
 * - Combinaisons = insights non déjà utilisés
 */
export function assembleBigFiveReport(
  scores: SelfTestScores,
  lang: SelfTestLang,
  format: BigFiveFormat = 'ipip-50'
): SelfTestAnalysis {
  const bundles = selectTraitBundle(scores, lang);
  const bands = buildTraitBands(scores);
  const portraitRaw = deriveBigFivePortrait(bands, lang);
  const balanced = isBalancedBands(bands);
  const used = new Set<string>();

  const portrait = {
    name: portraitRaw.name,
    tagline: portraitRaw.tagline,
    disclaimer: portraitRaw.disclaimer,
  };
  used.add(normalizePhrase(portrait.tagline));

  let whoYouAre: string;
  if (balanced) {
    whoYouAre = BALANCED_PROFILE_COPY.whoYouAre[lang];
    used.add(normalizePhrase(whoYouAre));
  } else {
    // 2 traits les plus marqués (éloignés du milieu 30) — pas les 5 narratifs collés
    const ranked = [...bundles].sort(
      (a, b) => Math.abs(b.score - 30) - Math.abs(a.score - 30)
    );
    const whoParts = dedupeAgainstUsed(
      ranked.slice(0, 3).map((b) => b.narrative),
      used
    );
    whoYouAre = whoParts.join(' ');
  }

  const howCandidates = balanced
    ? [BALANCED_PROFILE_COPY.howYouWork[lang]]
    : [
        lang === 'fr'
          ? 'En pratique, tu tiens mieux quand le cadre est clair : un créneau collectif à horaires fixes, une coach qui te voit, une progression simple.'
          : 'En la práctica, sostienes mejor cuando el marco es claro: un horario colectivo fijo, una coach que te ve, una progresión simple.',
        lang === 'fr'
          ? 'Ce que tu cherches vraiment : ne plus tout porter seule — le collectif te donne un rythme que la motivation solo ne remplace pas.'
          : 'Lo que realmente buscas: no cargar todo sola — el colectivo te da un ritmo que la motivación en solitario no sustituye.',
      ];
  const howParts = dedupeAgainstUsed(howCandidates, used);
  const howYouWork =
    howParts.join('\n\n') ||
    (lang === 'fr'
      ? 'Le collectif à horaires fixes te donne un rythme que la motivation solo ne remplace pas.'
      : 'El colectivo a horarios fijos te da un ritmo que la motivación en solitario no sustituye.');

  const comboRaw = matchingCombinationInsights(bands).map((i) => i.text[lang]);
  const combinations = dedupeAgainstUsed(comboRaw, used);

  // Forces / limites : dédoublonnage interne uniquement (pas vidé par howYouWork)
  const forceUsed = new Set<string>(used);
  const forces = dedupeAgainstUsed(
    balanced
      ? [BALANCED_PROFILE_COPY.force[lang], ...bundles.map((b) => b.force)]
      : bundles.map((b) => b.force),
    forceUsed
  );
  const limitUsed = new Set<string>(used);
  const limits = dedupeAgainstUsed(
    balanced
      ? [BALANCED_PROFILE_COPY.limit[lang], ...bundles.map((b) => b.limit)]
      : bundles.map((b) => b.limit),
    limitUsed
  );

  const strengths = (balanced
    ? [BALANCED_PROFILE_COPY.force[lang], ...forces]
    : [...bundles].sort((a, b) => b.score - a.score).map((b) => b.force)
  )
    .filter((s, i, arr) => arr.indexOf(s) === i)
    .slice(0, 2);

  const facets = format === 'ipip-120' ? buildFacetSections(scores, lang) : undefined;
  const scorePhrases = buildBigFiveScorePhrases(scores, lang);
  const practiceImpact = assemblePracticeImpactBlock(bands, lang);
  const microRecommendation = microRecoText(pickBigFiveMicroReco(bands, balanced), lang);

  const sections = {
    whoYouAre,
    howYouWork,
    forces: forces.slice(0, 5),
    limits: limits.slice(0, 5),
    combinations,
    scorePhrases,
    practiceImpact,
    microRecommendation,
    ...(facets?.length ? { facets } : {}),
  };

  const instrumentVersion = format;

  return {
    mode: 'template',
    teaser: buildTeaser(portrait, strengths, whoYouAre, lang),
    full: buildFullText(lang, portrait, sections, instrumentVersion),
    strengths,
    generatedAt: new Date().toISOString(),
    portrait,
    sections,
    sourceBadge: sourceBadge(lang),
    instrumentVersion,
  };
}

export function assembleAttachmentReport(
  scores: SelfTestScores,
  lang: SelfTestLang
): SelfTestAnalysis {
  const anxiety = scores.anxiety ?? 4;
  const avoidance = scores.avoidance ?? 4;
  const anxietyBand = bandFromAttachmentMean(anxiety);
  const avoidanceBand = bandFromAttachmentMean(avoidance);

  const portraitRaw = deriveAttachmentPortrait(anxietyBand, avoidanceBand, lang);
  const style = fallbackAttachmentStylePortrait(anxietyBand, avoidanceBand);
  const used = new Set<string>();

  const portrait = {
    name: portraitRaw.name,
    tagline: portraitRaw.tagline,
    disclaimer: portraitRaw.disclaimer,
  };
  used.add(normalizePhrase(portrait.tagline));

  const anxietyBank = ATTACHMENT_DIMENSION_BANK.anxiety[anxietyBand];
  const avoidanceBank = ATTACHMENT_DIMENSION_BANK.avoidance[avoidanceBand];

  const whoParts = dedupeAgainstUsed(
    [style.narrative[lang], anxietyBank.narrative[lang], avoidanceBank.narrative[lang]],
    used
  );
  const whoYouAre = whoParts.join(' ');

  const howParts = dedupeAgainstUsed(
    [
      lang === 'fr'
        ? 'Dans un cours collectif à horaires fixes, le lien (être attendue, corrigée) te donne un cadre relationnel prévisible — sans te demander d’être « toujours disponible ».'
        : 'En un curso colectivo a horarios fijos, el vínculo (que te esperen, te corrijan) te da un marco relacional previsible — sin pedirte estar « siempre disponible ».',
      lang === 'fr'
        ? 'Ce que tu cherches vraiment : un rythme relationnel clair — le collectif te voit sans te demander d’être « toujours disponible ».'
        : 'Lo que realmente buscas: un ritmo relacional claro — el colectivo te ve sin pedirte estar « siempre disponible ».',
    ],
    used
  );
  const howYouWork = howParts.join('\n\n');

  // Forces / limites : dédoublonnage interne — ne pas vider par howYouWork
  const forceUsed = new Set<string>();
  let forces = dedupeAgainstUsed(
    [anxietyBank.force[lang], avoidanceBank.force[lang], style.tagline[lang]].filter(Boolean),
    forceUsed
  );
  if (forces.length < 2) {
    const fallbacks = [anxietyBank.force[lang], avoidanceBank.force[lang]].filter(Boolean);
    for (const f of fallbacks) {
      if (!forces.includes(f)) forces.push(f);
    }
  }
  if (!forces.length) {
    forces = [
      lang === 'fr'
        ? 'Tu sais ce dont tu as besoin pour te sentir en sécurité dans le lien.'
        : 'Sabes lo que necesitas para sentirte segura en el vínculo.',
    ];
  }
  const limitUsed = new Set<string>();
  let limits = dedupeAgainstUsed(
    [anxietyBank.limit[lang], avoidanceBank.limit[lang]],
    limitUsed
  );
  if (!limits.length) {
    limits = [anxietyBank.limit[lang], avoidanceBank.limit[lang]].filter(Boolean);
  }
  const combinations: string[] = [];

  const strengths = [
    { score: anxiety, force: anxietyBank.force[lang] },
    { score: avoidance, force: avoidanceBank.force[lang] },
  ]
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map((d) => d.force);

  const styleId = style.id as keyof typeof ATTACHMENT_PRACTICE_IMPACT;
  const practiceImpact = [
    ATTACHMENT_PRACTICE_IMPACT[styleId]?.[lang] ?? ATTACHMENT_PRACTICE_IMPACT['secure-ish'][lang],
  ];
  const microRecommendation = microRecoText(pickAttachmentMicroReco(style.id), lang);

  const scorePhrases: SelfTestScorePhrase[] = [
    {
      key: 'anxiety',
      label: ATTACHMENT_LABELS.anxiety![lang],
      percent: Math.round(((anxiety - 1) / 6) * 100),
      phrase: ATTACHMENT_BAND_PHRASE.anxiety[anxietyBand][lang],
      band: anxietyBand,
    },
    {
      key: 'avoidance',
      label: ATTACHMENT_LABELS.avoidance![lang],
      percent: Math.round(((avoidance - 1) / 6) * 100),
      phrase: ATTACHMENT_BAND_PHRASE.avoidance[avoidanceBand][lang],
      band: avoidanceBand,
    },
  ];

  const sections = {
    whoYouAre,
    howYouWork,
    forces,
    limits,
    combinations,
    scorePhrases,
    practiceImpact,
    microRecommendation,
  };

  const instrumentVersion = 'ecr-s';

  const full = buildFullText(lang, portrait, sections, instrumentVersion);
  const teaser = buildTeaser(portrait, strengths, whoYouAre, lang);

  const scoreBlock =
    lang === 'fr'
      ? `\n${ATTACHMENT_LABELS.anxiety![lang]}: ${anxiety}/7 · ${ATTACHMENT_LABELS.avoidance![lang]}: ${avoidance}/7`
      : `\n${ATTACHMENT_LABELS.anxiety![lang]}: ${anxiety}/7 · ${ATTACHMENT_LABELS.avoidance![lang]}: ${avoidance}/7`;

  return {
    mode: 'template',
    teaser,
    full: full.replace(portrait.disclaimer, `${scoreBlock}\n\n${portrait.disclaimer}`),
    strengths,
    generatedAt: new Date().toISOString(),
    portrait,
    sections,
    sourceBadge: sourceBadge(lang),
    instrumentVersion,
  };
}
