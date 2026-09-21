import {
  assembleAttachmentReport,
  assembleBigFiveReport,
} from './assemble-report';
import { bandFromAttachmentMean } from './banks/attachment-bank';
import { bandFromTraitScore } from './banks/big-five-traits';
import type {
  AnalysisMode,
  SelfTestAnalysis,
  SelfTestDefinition,
  SelfTestLang,
  SelfTestScores,
} from './types';

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function fuzzyIncludes(haystack: string, needle: string): boolean {
  const h = normalizeForMatch(haystack);
  const n = normalizeForMatch(needle);
  if (!n) return true;
  if (h.includes(n) || n.includes(h)) return true;
  const words = n.split(' ').filter((w) => w.length > 3);
  if (!words.length) return h.includes(n);
  const matched = words.filter((w) => h.includes(w));
  return matched.length >= Math.ceil(words.length * 0.5);
}

/** Vérifie que la réponse Claude reste dans le périmètre banque. */
export function assertAnalysisWithinBank(
  assembled: SelfTestAnalysis,
  parsed: { teaser?: string; full?: string; strengths?: string[] }
): boolean {
  if (!parsed.teaser?.trim() || !parsed.full?.trim()) return false;

  const portraitName = assembled.portrait?.name;
  if (portraitName) {
    const nameOk =
      fuzzyIncludes(parsed.teaser, portraitName) ||
      fuzzyIncludes(parsed.full, portraitName);
    if (!nameOk) return false;
  }

  const bankForces = [
    ...assembled.strengths,
    ...(assembled.sections?.forces ?? []),
  ];

  const parsedStrengths = Array.isArray(parsed.strengths)
    ? parsed.strengths.filter(Boolean)
    : [];

  if (parsedStrengths.length) {
    for (const s of parsedStrengths) {
      const ok = bankForces.some(
        (f) => fuzzyIncludes(f, s) || fuzzyIncludes(s, f)
      );
      if (!ok) return false;
    }
  }

  return true;
}

export function buildTemplateAnalysis(
  def: SelfTestDefinition,
  scores: SelfTestScores,
  lang: SelfTestLang
): SelfTestAnalysis {
  if (def.slug === 'big-five') {
    const format = def.format ?? 'ipip-50';
    return assembleBigFiveReport(scores, lang, format);
  }
  return assembleAttachmentReport(scores, lang);
}

function claudeSourceBadge(lang: SelfTestLang): string {
  return lang === 'fr' ? 'Banque + Claude' : 'Banco + Claude';
}

function buildClaudePayload(
  assembled: SelfTestAnalysis,
  lang: SelfTestLang
): string {
  const s = assembled.sections;
  const p = assembled.portrait;
  return JSON.stringify(
    {
      lang,
      portrait: p,
      whoYouAre: s?.whoYouAre,
      howYouWork: s?.howYouWork,
      forces: s?.forces,
      limits: s?.limits,
      combinations: s?.combinations,
      strengthsFromBank: assembled.strengths,
    },
    null,
    2
  );
}

async function callClaudeAnalysis(
  assembled: SelfTestAnalysis,
  lang: SelfTestLang
): Promise<SelfTestAnalysis | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;

  const system =
    lang === 'fr'
      ? `Tu ne fais QUE fluidifier/assembler les textes fournis à la voix FitMangas (Pilates/Barre en visio, accords féminins). INTERDICTION d'ajouter faits, traits, conseils médicaux ou éléments absents du payload. Si tenté d'inventer, répète uniquement le contenu fourni. JSON strict: {"teaser":"...","full":"...","strengths":["...","..."]}. Teaser = 2-3 phrases (aperçu public). Full = texte complet fluide reprenant toutes les sections. strengths = sous-ensemble des forces banque (max 3).`
      : `Solo fluidificas/ensamblas los textos proporcionados con voz FitMangas. PROHIBIDO añadir hechos, rasgos, consejos médicos o elementos ausentes del payload. Si intentas inventar, repite solo el contenido dado. JSON estricto: {"teaser":"...","full":"...","strengths":["...","..."]}.`;

  const user = `Payload banque (source autoritaire — ne rien inventer):\n${buildClaudePayload(assembled, lang)}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1400,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.type === 'text')?.text ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as {
      teaser?: string;
      full?: string;
      strengths?: string[];
    };

    if (!assertAnalysisWithinBank(assembled, parsed)) return null;

    const strengths = Array.isArray(parsed.strengths)
      ? parsed.strengths.slice(0, 3)
      : assembled.strengths;

    return {
      ...assembled,
      mode: 'claude' as AnalysisMode,
      teaser: parsed.teaser!.trim(),
      full: parsed.full!.trim(),
      strengths,
      sourceBadge: claudeSourceBadge(lang),
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/** Claude si clé OK et garde passée, sinon banque assemblée — jamais d'erreur bloquante */
export async function generateSelfTestAnalysis(
  def: SelfTestDefinition,
  scores: SelfTestScores,
  lang: SelfTestLang
): Promise<SelfTestAnalysis> {
  const assembled = buildTemplateAnalysis(def, scores, lang);
  const claude = await callClaudeAnalysis(assembled, lang);
  if (claude) return claude;
  return assembled;
}

/** Réexport banque pour tests de cohérence */
export { bandFromTraitScore, bandFromAttachmentMean };
