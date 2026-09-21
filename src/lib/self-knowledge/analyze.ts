import type {
  AnalysisMode,
  SelfTestAnalysis,
  SelfTestDefinition,
  SelfTestLang,
  SelfTestScores,
} from './types';
import { BIG_FIVE_LABELS } from './ipip50';
import { ATTACHMENT_LABELS } from './ecr-short';

function bandBigFive(score: number): 'low' | 'mid' | 'high' {
  if (score <= 20) return 'low';
  if (score <= 35) return 'mid';
  return 'high';
}

function bandAttachment(mean: number): 'low' | 'mid' | 'high' {
  if (mean <= 2.2) return 'low';
  if (mean <= 3.4) return 'mid';
  return 'high';
}

function topStrengths(
  def: SelfTestDefinition,
  scores: SelfTestScores,
  lang: SelfTestLang
): string[] {
  if (def.slug === 'big-five') {
    const ranked = (['O', 'C', 'E', 'A'] as const)
      .map((k) => ({ k, v: scores[k] ?? 0 }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 2);
    return ranked.map((r) => {
      const label = BIG_FIVE_LABELS[r.k]![lang];
      return lang === 'fr'
        ? `${label} (${r.v}/50) — une de tes forces relatives`
        : `${label} (${r.v}/50) — una de tus fuerzas relativas`;
    });
  }
  const anxiety = scores.anxiety ?? 0;
  const avoidance = scores.avoidance ?? 0;
  const out: string[] = [];
  if (anxiety <= 2.5) {
    out.push(
      lang === 'fr'
        ? 'Anxiété d’attachement plutôt basse — tu te sens souvent en sécurité dans le lien'
        : 'Ansiedad de apego más bien baja — sueles sentirte segura en el vínculo'
    );
  }
  if (avoidance <= 2.5) {
    out.push(
      lang === 'fr'
        ? 'Évitement plutôt bas — tu peux te rapprocher sans trop te protéger'
        : 'Evitación más bien baja — puedes acercarte sin protegerte demasiado'
    );
  }
  if (!out.length) {
    out.push(
      lang === 'fr'
        ? 'Tu as une carte claire de tes besoins relationnels — c’est déjà un levier'
        : 'Tienes un mapa claro de tus necesidades relacionales — ya es un recurso'
    );
  }
  return out.slice(0, 2);
}

export function buildTemplateAnalysis(
  def: SelfTestDefinition,
  scores: SelfTestScores,
  lang: SelfTestLang
): SelfTestAnalysis {
  const strengths = topStrengths(def, scores, lang);
  const lines: string[] = [];

  if (def.slug === 'big-five') {
    for (const key of def.scoreKeys) {
      const label = BIG_FIVE_LABELS[key]![lang];
      const v = scores[key] ?? 0;
      const band = bandBigFive(v);
      const bandText =
        lang === 'fr'
          ? band === 'low'
            ? 'plutôt bas'
            : band === 'mid'
              ? 'dans la moyenne'
              : 'plutôt élevé'
          : band === 'low'
            ? 'más bien bajo'
            : band === 'mid'
              ? 'en la media'
              : 'más bien alto';
      lines.push(`${label}: ${v}/50 (${bandText}).`);
    }
  } else {
    for (const key of def.scoreKeys) {
      const label = ATTACHMENT_LABELS[key]![lang];
      const v = scores[key] ?? 0;
      const band = bandAttachment(v);
      const bandText =
        lang === 'fr'
          ? band === 'low'
            ? 'plutôt bas'
            : band === 'mid'
              ? 'modéré'
              : 'plutôt élevé'
          : band === 'low'
            ? 'más bien bajo'
            : band === 'mid'
              ? 'moderado'
              : 'más bien alto';
      lines.push(`${label}: ${v}/5 (${bandText}).`);
    }
  }

  const teaser =
    lang === 'fr'
      ? `Voici tes grandes lignes. Forces : ${strengths.join(' · ')}. L’analyse complète relie ces scores à ton rythme de pratique et à ce que tu cherches vraiment (ne plus être seule dans l’effort).`
      : `Estas son tus grandes líneas. Fortalezas: ${strengths.join(' · ')}. El análisis completo relaciona estas puntuaciones con tu ritmo de práctica y con lo que realmente buscas.`;

  const full =
    lang === 'fr'
      ? [
          'Analyse indicative (mode modèle, sans Claude API).',
          '',
          ...lines,
          '',
          'Ce que ça peut vouloir dire pour toi chez FitMangas :',
          '- Un cours collectif à horaires fixes te donne un cadre — utile si la Conscience ou l’anxiété d’attachement demandent de la régularité.',
          '- La correction en direct et le fait d’être vue répondent à ce que le gratuit ne donne pas : ne plus être seule.',
          '',
          `Forces relatives : ${strengths.join(' · ')}`,
          '',
          `Source des items : ${def.source}`,
        ].join('\n')
      : [
          'Análisis indicativo (modo plantilla, sin Claude API).',
          '',
          ...lines,
          '',
          'Qué puede significar para ti en FitMangas:',
          '- Un curso colectivo a horarios fijos te da un marco — útil si la Responsabilidad o la ansiedad de apego piden regularidad.',
          '- La corrección en directo y el hecho de ser vista responden a lo que lo gratuito no da: no estar sola.',
          '',
          `Fortalezas relativas: ${strengths.join(' · ')}`,
          '',
          `Fuente de los ítems: ${def.source}`,
        ].join('\n');

  return {
    mode: 'template',
    teaser,
    full,
    strengths,
    generatedAt: new Date().toISOString(),
  };
}

async function callClaudeAnalysis(
  def: SelfTestDefinition,
  scores: SelfTestScores,
  lang: SelfTestLang
): Promise<SelfTestAnalysis | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;

  const system =
    lang === 'fr'
      ? `Tu es coach bien-être pour FitMangas (Pilates/Barre en visio). Tu écris une analyse claire, bienveillante, sans jargon clinique, sans diagnostic médical. Structure JSON strict: {"teaser":"...","full":"...","strengths":["...","..."]}. Teaser = 2-3 phrases + 1-2 forces. Full = 4-6 courts paragraphes. Pas de jugement sur le corps.`
      : `Eres coach de bienestar para FitMangas. Análisis claro, amable, sin jerga clínica ni diagnóstico. JSON estricto: {"teaser":"...","full":"...","strengths":["...","..."]}.`;

  const user = `Test: ${def.slug} (${def.version})\nScores: ${JSON.stringify(scores)}\nLangue: ${lang}\nSource: ${def.source}`;

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
        max_tokens: 1200,
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
    if (!parsed.teaser || !parsed.full) return null;
    return {
      mode: 'claude' as AnalysisMode,
      teaser: parsed.teaser,
      full: parsed.full,
      strengths: Array.isArray(parsed.strengths)
        ? parsed.strengths.slice(0, 3)
        : topStrengths(def, scores, lang),
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/** Claude si clé OK, sinon template — jamais d’erreur bloquante */
export async function generateSelfTestAnalysis(
  def: SelfTestDefinition,
  scores: SelfTestScores,
  lang: SelfTestLang
): Promise<SelfTestAnalysis> {
  const claude = await callClaudeAnalysis(def, scores, lang);
  if (claude) return claude;
  return buildTemplateAnalysis(def, scores, lang);
}
