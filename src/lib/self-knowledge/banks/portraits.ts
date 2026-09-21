/**
 * Portraits nommés Big Five & attachement — dérivés des bandes de scores.
 *
 * Inspiré des descriptions publiques IPIP-NEO (John A. Johnson, domaine public).
 * Voix FitMangas : chaleureux, direct, féminin FR/ES, orienté pratique régulière.
 * Pas de diagnostic clinique.
 */

import type { SelfTestLang } from '../types';
import type { BigFiveTraitKey, Level } from './big-five-traits';
import {
  fallbackAttachmentStylePortrait,
  type AttachmentStyleId,
} from './attachment-bank';

export type BigFiveBands = Record<BigFiveTraitKey, Level>;

export type DerivedPortrait = {
  name: string;
  tagline: string;
  disclaimer: string;
};

const DISCLAIMER: Record<SelfTestLang, string> = {
  fr: 'Portrait indicatif basé sur tes réponses — pas un diagnostic, pas une étiquette. Ton profil évolue avec le temps, le contexte et ta pratique.',
  es: 'Retrato orientativo basado en tus respuestas — no es un diagnóstico ni una etiqueta. Tu perfil evoluciona con el tiempo, el contexto y tu práctica.',
};

type PortraitRule = {
  id: string;
  /** Toutes les conditions doivent matcher ; priorité = ordre du tableau (premier gagnant) */
  when: Partial<Record<BigFiveTraitKey, Level>>;
  name: { fr: string; es: string };
  tagline: { fr: string; es: string };
};

/** ~8 portraits nommés — combinaisons dominantes */
const BIG_FIVE_PORTRAIT_RULES: PortraitRule[] = [
  {
    id: 'regular',
    when: { C: 'high', ES: 'high' },
    name: { fr: 'La Régulière', es: 'La Regular' },
    tagline: {
      fr: 'Le cadre te libère — les cours collectifs à horaires fixes sont ton allié naturel.',
      es: 'El marco te libera — los cursos colectivos a horarios fijos son tu aliado natural.',
    },
  },
  {
    id: 'explorer',
    when: { E: 'high', O: 'high' },
    name: { fr: 'L’Exploratrice', es: 'La Exploradora' },
    tagline: {
      fr: 'Tu as besoin de mouvement et de lien — varie les formats, reste dans le collectif.',
      es: 'Necesitas movimiento y vínculo — varía formatos, quédate en el colectivo.',
    },
  },
  {
    id: 'faithful',
    when: { A: 'high', C: 'high' },
    name: { fr: 'La Fidèle engagée', es: 'La Fiel comprometida' },
    tagline: {
      fr: 'Tu tiens parole — envers les autres et envers ton corps.',
      es: 'Cumples tu palabra — con las demás y con tu cuerpo.',
    },
  },
  {
    id: 'tenace',
    when: { ES: 'low', C: 'high' },
    name: { fr: 'La Tenace sous pression', es: 'La Tenaz bajo presión' },
    tagline: {
      fr: 'Tu veux tenir, le stress te rattrape — être vue en live t’aide à ne pas porter seule.',
      es: 'Quieres sostener, el estrés te alcanza — ser vista en live te ayuda a no cargar sola.',
    },
  },
  {
    id: 'serene',
    when: { A: 'high', ES: 'high' },
    name: { fr: 'La Sereine bienveillante', es: 'La Serena benevolente' },
    tagline: {
      fr: 'Tu apportes du calme au collectif — n’oublie pas ton propre créneau.',
      es: 'Aportas calma al colectivo — no olvides tu propio horario.',
    },
  },
  {
    id: 'connected',
    when: { E: 'high', A: 'high' },
    name: { fr: 'La Connectée', es: 'La Conectada' },
    tagline: {
      fr: 'Le groupe te recharge — la visio est faite pour toi.',
      es: 'El grupo te recarga — la visio está hecha para ti.',
    },
  },
  {
    id: 'curious-structured',
    when: { O: 'high', C: 'high' },
    name: { fr: 'La Curieuse structurée', es: 'La Curiosa estructurada' },
    tagline: {
      fr: 'Tu explores avec méthode — progresse sans te disperser.',
      es: 'Exploras con método — progresa sin dispersarte.',
    },
  },
  {
    id: 'dynamic-organized',
    when: { E: 'high', C: 'high' },
    name: { fr: 'La Dynamique organisée', es: 'La Dinámica organizada' },
    tagline: {
      fr: 'Énergie + cadre = tu enchaînes les semaines sans te cramer.',
      es: 'Energía + marco = encadenas semanas sin quemarte.',
    },
  },
  {
    id: 'quiet-depth',
    when: { E: 'low', O: 'high' },
    name: { fr: 'La Profonde discrète', es: 'La Profunda discreta' },
    tagline: {
      fr: 'Petit groupe, regard de qualité — tu n’as pas besoin de bruit pour progresser.',
      es: 'Grupo pequeño, mirada de calidad — no necesitas ruido para progresar.',
    },
  },
  {
    id: 'needs-frame',
    when: { C: 'low', ES: 'mid' },
    name: { fr: 'La Spontanée à encadrer', es: 'La Espontánea a encuadrar' },
    tagline: {
      fr: 'Tu bouges au feeling — le créneau fixe remplace la willpower.',
      es: 'Te mueves por sensación — el horario fijo sustituye la fuerza de voluntad.',
    },
  },
];

/** Fallbacks par trait dominant élevé */
const SINGLE_HIGH_FALLBACKS: Array<{
  trait: BigFiveTraitKey;
  name: { fr: string; es: string };
  tagline: { fr: string; es: string };
}> = [
  {
    trait: 'C',
    name: { fr: 'La Structurée', es: 'La Estructurada' },
    tagline: {
      fr: 'Tu avances mieux quand le cadre est posé — horaires fixes, progression visible.',
      es: 'Avanzas mejor cuando el marco está puesto — horarios fijos, progreso visible.',
    },
  },
  {
    trait: 'E',
    name: { fr: 'L’Énergique sociale', es: 'La Energética social' },
    tagline: {
      fr: 'Le collectif te porte — seule, tu décroches plus vite.',
      es: 'El colectivo te impulsa — sola, abandonas más rápido.',
    },
  },
  {
    trait: 'A',
    name: { fr: 'L’Accueillante', es: 'La Acogedora' },
    tagline: {
      fr: 'Tu crées du lien — pense à recevoir autant que tu donnes.',
      es: 'Creas vínculo — piensa en recibir tanto como das.',
    },
  },
  {
    trait: 'ES',
    name: { fr: 'L’Ancrée', es: 'La Anclada' },
    tagline: {
      fr: 'Tu restes stable — le mouvement te nourrit sans te surcharger.',
      es: 'Permaneces estable — el movimiento te nutre sin sobrecargarte.',
    },
  },
  {
    trait: 'O',
    name: { fr: 'L’Ouverte', es: 'La Abierta' },
    tagline: {
      fr: 'La curiosité te fait tenir — ose varier les cours.',
      es: 'La curiosidad te hace sostener — atrévete a variar los cursos.',
    },
  },
];

function matchesRule(rule: PortraitRule, bands: BigFiveBands): boolean {
  return Object.entries(rule.when).every(
    ([key, level]) => bands[key as BigFiveTraitKey] === level
  );
}

function countHighTraits(bands: BigFiveBands): BigFiveTraitKey[] {
  return (['E', 'A', 'C', 'ES', 'O'] as const).filter((k) => bands[k] === 'high');
}

function pickDominantHigh(bands: BigFiveBands): BigFiveTraitKey | undefined {
  const highs = countHighTraits(bands);
  if (!highs.length) return undefined;
  // Priorité C puis ES puis E — leviers FitMangas (régularité, stabilité, lien)
  const priority: BigFiveTraitKey[] = ['C', 'ES', 'E', 'A', 'O'];
  for (const p of priority) {
    if (highs.includes(p)) return p;
  }
  return highs[0];
}

const GENERIC_PORTRAIT: PortraitRule = {
  id: 'balanced',
  when: {},
  name: { fr: 'Le profil équilibré', es: 'El perfil equilibrado' },
  tagline: {
    fr: 'Aucun trait ne domine — tu t’adaptes au cadre du cours collectif.',
    es: 'Ningún rasgo domina — te adaptas al marco del curso colectivo.',
  },
};

/**
 * Dérive un portrait nommé à partir des bandes Big Five.
 * Priorité : combinaisons spécifiques → trait élevé dominant → profil équilibré.
 */
export function deriveBigFivePortrait(
  bands: BigFiveBands,
  lang: SelfTestLang
): DerivedPortrait {
  for (const rule of BIG_FIVE_PORTRAIT_RULES) {
    if (matchesRule(rule, bands)) {
      return {
        name: rule.name[lang],
        tagline: rule.tagline[lang],
        disclaimer: DISCLAIMER[lang],
      };
    }
  }

  const dominant = pickDominantHigh(bands);
  if (dominant) {
    const fallback = SINGLE_HIGH_FALLBACKS.find((f) => f.trait === dominant)!;
    return {
      name: fallback.name[lang],
      tagline: fallback.tagline[lang],
      disclaimer: DISCLAIMER[lang],
    };
  }

  return {
    name: GENERIC_PORTRAIT.name[lang],
    tagline: GENERIC_PORTRAIT.tagline[lang],
    disclaimer: DISCLAIMER[lang],
  };
}

/**
 * Dérive un portrait attachement à partir des bandes anxiété × évitement.
 */
export function deriveAttachmentPortrait(
  anxietyBand: Level,
  avoidanceBand: Level,
  lang: SelfTestLang
): DerivedPortrait & { styleId: AttachmentStyleId } {
  const style = fallbackAttachmentStylePortrait(anxietyBand, avoidanceBand);
  return {
    name: style.portraitName[lang],
    tagline: style.tagline[lang],
    disclaimer: DISCLAIMER[lang],
    styleId: style.id,
  };
}

/** Exporte l’identifiant de règle Big Five matchée (debug / UI) */
export function matchBigFivePortraitId(bands: BigFiveBands): string {
  for (const rule of BIG_FIVE_PORTRAIT_RULES) {
    if (matchesRule(rule, bands)) return rule.id;
  }
  const dominant = pickDominantHigh(bands);
  if (dominant) return `single-high-${dominant}`;
  return GENERIC_PORTRAIT.id;
}
