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

/** Seuils sur échelle ECR-S 1–7 */
function bandAttachment(mean: number): 'low' | 'mid' | 'high' {
  if (mean <= 2.5) return 'low';
  if (mean <= 4.5) return 'mid';
  return 'high';
}

function topStrengths(
  def: SelfTestDefinition,
  scores: SelfTestScores,
  lang: SelfTestLang
): string[] {
  if (def.slug === 'big-five') {
    const ranked = (['O', 'C', 'E', 'A', 'ES'] as const)
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
  if (anxiety <= 3) {
    out.push(
      lang === 'fr'
        ? 'Anxiété d’attachement plutôt basse — tu te sens souvent en sécurité dans le lien'
        : 'Ansiedad de apego más bien baja — sueles sentirte segura en el vínculo'
    );
  }
  if (avoidance <= 3) {
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

/** Puces FitMangas cohérentes avec les scores (pas de contradiction ES haute ↔ anxiété). */
function fitmangasBullets(
  def: SelfTestDefinition,
  scores: SelfTestScores,
  lang: SelfTestLang
): string[] {
  if (def.slug === 'big-five') {
    const c = scores.C ?? 30;
    const es = scores.ES ?? 30;
    const e = scores.E ?? 30;
    const bullets: string[] = [];
    if (lang === 'fr') {
      if (c >= 36) {
        bullets.push(
          '- Ta Conscience élevée aime un cadre clair : les cours collectifs à horaires fixes t’aident à tenir sans tout porter seule.'
        );
      } else if (c <= 20) {
        bullets.push(
          '- Si la régularité te coûte, le rendez-vous collectif (être attendue) remplace la motivation solo.'
        );
      }
      if (es >= 36) {
        bullets.push(
          '- Ta Stabilité émotionnelle plutôt haute est une ressource : le cours live peut la nourrir sans te surcharger.'
        );
      } else if (es <= 20) {
        bullets.push(
          '- Quand le stress monte vite, la correction en direct et le fait d’être vue aident à redescendre — ce que le gratuit ne donne pas.'
        );
      }
      if (e <= 20) {
        bullets.push(
          '- Si tu te tiens plus en retrait, un petit groupe en visio peut être plus doux qu’une salle bondée.'
        );
      }
      if (!bullets.length) {
        bullets.push(
          '- Un cours collectif à horaires fixes + correction en direct : le produit répond au besoin de ne plus être seule dans l’effort.'
        );
      }
    } else {
      if (c >= 36) {
        bullets.push(
          '- Tu Responsabilidad alta agradece un marco claro: los cursos colectivos a horarios fijos te ayudan a sostener sin cargar sola.'
        );
      } else if (c <= 20) {
        bullets.push(
          '- Si la regularidad te cuesta, la cita colectiva (que te esperen) sustituye la motivación en solitario.'
        );
      }
      if (es >= 36) {
        bullets.push(
          '- Tu Estabilidad emocional más bien alta es un recurso: el curso en vivo puede alimentarla sin sobrecargarte.'
        );
      } else if (es <= 20) {
        bullets.push(
          '- Cuando el estrés sube rápido, la corrección en directo y ser vista ayudan a bajar — lo que lo gratuito no da.'
        );
      }
      if (!bullets.length) {
        bullets.push(
          '- Curso colectivo a horarios fijos + corrección en directo: el producto responde a no estar sola en el esfuerzo.'
        );
      }
    }
    return bullets.slice(0, 3);
  }

  const anxiety = scores.anxiety ?? 4;
  const avoidance = scores.avoidance ?? 4;
  if (lang === 'fr') {
    const out: string[] = [];
    if (anxiety >= 4.5) {
      out.push(
        '- Une anxiété d’attachement plus haute peut gagner à un cadre prévisible : horaires fixes, même coach, présence régulière.'
      );
    }
    if (avoidance >= 4.5) {
      out.push(
        '- Un évitement plus haut n’empêche pas de progresser : la visio à petit groupe laisse de la distance tout en étant vue.'
      );
    }
    if (!out.length) {
      out.push(
        '- Le lien (être attendue, corrigée) est le cœur FitMangas — aligné avec ce que ton profil relationnel cherche déjà.'
      );
    }
    return out;
  }
  const out: string[] = [];
  if (anxiety >= 4.5) {
    out.push(
      '- Una ansiedad de apego más alta gana con un marco previsible: horarios fijos, misma coach, presencia regular.'
    );
  }
  if (avoidance >= 4.5) {
    out.push(
      '- Una evitación más alta no impide progresar: la visio en grupo pequeño deja distancia y a la vez te hace visible.'
    );
  }
  if (!out.length) {
    out.push(
      '- El vínculo (que te esperen, te corrijan) es el núcleo FitMangas — alineado con lo que tu perfil relacional ya busca.'
    );
  }
  return out;
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
      lines.push(`${label}: ${v}/7 (${bandText}).`);
    }
  }

  const bullets = fitmangasBullets(def, scores, lang);

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
          ...bullets,
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
          ...bullets,
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

  const scoreHints =
    def.slug === 'big-five'
      ? `Rappels scores Big Five (chacun 10–50) : E Extraversion, A Agréabilité, C Conscience, ES Stabilité émotionnelle (HAUT = calme/stable, PAS de l’anxiété), O Ouverture. Ne jamais décrire une ES haute comme de l’anxiété ou de la nervosité.`
      : `Rappels ECR-S (moyennes 1–7) : anxiety = anxiété d’abandon ; avoidance = évitement de l’intimité. Haut = plus du trait nommé.`;

  const system =
    lang === 'fr'
      ? `Tu es coach bien-être pour FitMangas (Pilates/Barre en visio). Tu écris une analyse claire, bienveillante, sans jargon clinique, sans diagnostic médical. ${scoreHints} Structure JSON strict: {"teaser":"...","full":"...","strengths":["...","..."]}. Teaser = 2-3 phrases + 1-2 forces (aperçu public). Full = 4-6 courts paragraphes (espace membre). Cohérence stricte avec les scores numérique. Pas de jugement sur le corps. Accords au féminin.`
      : `Eres coach de bienestar para FitMangas. ${scoreHints} JSON estricto: {"teaser":"...","full":"...","strengths":["...","..."]}. Teaser corto (público); full completo (miembro). Coherencia estricta con las puntuaciones. Sin juicio sobre el cuerpo.`;

  const user = `Test: ${def.slug} (${def.version})\nScores: ${JSON.stringify(scores)}\nLangue: ${lang}\nSource: ${def.source}\nRègle: teaser COURT ; full LONG et distinct du teaser.`;

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

/** Exporté pour tests de cohérence */
export { bandBigFive, bandAttachment, topStrengths, fitmangasBullets };
