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
import { deriveAttachmentPortrait, deriveBigFivePortrait } from './banks/portraits';
import type {
  BigFiveFormat,
  SelfTestAnalysis,
  SelfTestFacetSection,
  SelfTestLang,
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
      narrative: bank.narrative[lang],
      force: bank.force[lang],
      limit: bank.limit[lang],
    });
  }
  return sections;
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
  if (sections.facets?.length) {
    lines.push('');
    lines.push(h ? 'Facettes détaillées' : 'Facetas detalladas');
    for (const facet of sections.facets) {
      lines.push('');
      lines.push(`${facet.label} (${facet.score}/20)`);
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

export function assembleBigFiveReport(
  scores: SelfTestScores,
  lang: SelfTestLang,
  format: BigFiveFormat = 'ipip-50'
): SelfTestAnalysis {
  const bundles = selectTraitBundle(scores, lang);
  const bands = buildTraitBands(scores);
  const portraitRaw = deriveBigFivePortrait(bands, lang);

  const portrait = {
    name: portraitRaw.name,
    tagline: portraitRaw.tagline,
    disclaimer: portraitRaw.disclaimer,
  };

  const whoYouAre = bundles.map((b) => b.narrative).join(' ');

  const combinations = matchingCombinationInsights(bands).map((i) => i.text[lang]);
  const midNarratives = bundles
    .filter((b) => b.band === 'mid')
    .map((b) => b.narrative);
  const howYouWork = [...combinations, ...midNarratives].filter(Boolean).join('\n\n');

  const forces = bundles.map((b) => b.force);
  const limits = bundles.map((b) => b.limit);
  const strengths = [...bundles]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((b) => b.force);

  const facets = format === 'ipip-120' ? buildFacetSections(scores, lang) : undefined;

  const sections = {
    whoYouAre,
    howYouWork,
    forces,
    limits,
    combinations,
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

  const portrait = {
    name: portraitRaw.name,
    tagline: portraitRaw.tagline,
    disclaimer: portraitRaw.disclaimer,
  };

  const anxietyBank = ATTACHMENT_DIMENSION_BANK.anxiety[anxietyBand];
  const avoidanceBank = ATTACHMENT_DIMENSION_BANK.avoidance[avoidanceBand];

  const whoYouAre = [style.narrative[lang], anxietyBank.narrative[lang], avoidanceBank.narrative[lang]]
    .filter(Boolean)
    .join(' ');

  const howYouWork = [portrait.tagline, style.narrative[lang]].filter(Boolean).join('\n\n');

  const forces = [anxietyBank.force[lang], avoidanceBank.force[lang]];
  const limits = [anxietyBank.limit[lang], avoidanceBank.limit[lang]];
  const combinations: string[] = [];

  const strengths = [
    { score: anxiety, force: anxietyBank.force[lang] },
    { score: avoidance, force: avoidanceBank.force[lang] },
  ]
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map((d) => d.force);

  const sections = {
    whoYouAre,
    howYouWork,
    forces,
    limits,
    combinations,
  };

  const instrumentVersion = 'ecr-s';

  const full = buildFullText(lang, portrait, sections, instrumentVersion);
  const teaser = buildTeaser(portrait, strengths, whoYouAre, lang);

  // Mention explicite des scores dans le full (attachement)
  const scoreBlock =
    lang === 'fr'
      ? `\n${ATTACHMENT_LABELS.anxiety![lang]}: ${anxiety}/7 · ${ATTACHMENT_LABELS.avoidance![lang]}: ${avoidance}/7`
      : `\n${ATTACHMENT_LABELS.anxiety![lang]}: ${anxiety}/7 · ${ATTACHMENT_LABELS.avoidance![lang]}: ${avoidance}/7`;

  return {
    mode: 'template',
    teaser,
    full: full.replace(
      portrait.disclaimer,
      `${scoreBlock}\n\n${portrait.disclaimer}`
    ),
    strengths,
    generatedAt: new Date().toISOString(),
    portrait,
    sections,
    sourceBadge: sourceBadge(lang),
    instrumentVersion,
  };
}
