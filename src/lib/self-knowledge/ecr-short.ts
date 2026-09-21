import type { SelfTestDefinition, SelfTestItem } from './types';

/**
 * ECR-S (Experiences in Close Relationships — Short Form, Wei et al., 2007)
 * 12 public research items used widely in attachment research.
 * Subscales: Anxiety (odd items in original order) / Avoidance.
 * Scoring: 1–7 Likert in original; we use 1–5 for UX consistency and scale
 * proportionally in analysis. Reverse items inverted before averaging.
 * Citation: Wei, M., Russell, D. W., Mallinckrodt, B., & Vogel, D. L. (2007).
 * The Experiences in Close Relationship Scale (ECR)-Short Form.
 */
const ITEM = (
  id: string,
  key: 'anxiety' | 'avoidance',
  fr: string,
  es: string,
  reverse = false
): SelfTestItem => ({ id, key, text: { fr, es }, reverse });

export const ECR_SHORT_ITEMS: SelfTestItem[] = [
  // Anxiety (6)
  ITEM(
    'ANX1',
    'anxiety',
    'J’ai peur d’être abandonnée.',
    'Temo que me abandonen.'
  ),
  ITEM(
    'ANX2',
    'anxiety',
    'Je m’inquiète beaucoup de mes relations.',
    'Me preocupo mucho por mis relaciones.'
  ),
  ITEM(
    'ANX3',
    'anxiety',
    'Quand je montre mes sentiments, j’ai peur qu’on ne me le rende pas.',
    'Cuando muestro mis sentimientos, temo que no me los devuelvan.'
  ),
  ITEM(
    'ANX4r',
    'anxiety',
    'Je me sens rarement inquiète d’être abandonnée.',
    'Rara vez me preocupa que me abandonen.',
    true
  ),
  ITEM(
    'ANX5',
    'anxiety',
    'Je m’inquiète que mon partenaire ne se soucie pas autant de moi.',
    'Me preocupa que mi pareja no se preocupe tanto por mí.'
  ),
  ITEM(
    'ANX6',
    'anxiety',
    'Je souhaite que le sentiment de mon partenaire pour moi soit aussi fort que le mien.',
    'Deseo que el sentimiento de mi pareja por mí sea tan fuerte como el mío.'
  ),
  // Avoidance (6)
  ITEM(
    'AVD1r',
    'avoidance',
    'Je me sens à l’aise de dépendre des autres.',
    'Me siento cómoda dependiendo de otras personas.',
    true
  ),
  ITEM(
    'AVD2',
    'avoidance',
    'Je préfère ne pas montrer à mon partenaire ce que je ressens au fond.',
    'Prefiero no mostrarle a mi pareja lo que siento en el fondo.'
  ),
  ITEM(
    'AVD3r',
    'avoidance',
    'Je me sens à l’aise d’être proche des autres.',
    'Me siento cómoda estando cerca de otras personas.',
    true
  ),
  ITEM(
    'AVD4',
    'avoidance',
    'Je trouve difficile de dépendre des autres.',
    'Me resulta difícil depender de otras personas.'
  ),
  ITEM(
    'AVD5r',
    'avoidance',
    'Je n’ai pas de problème à demander du soutien à mon partenaire.',
    'No tengo problema en pedirle apoyo a mi pareja.',
    true
  ),
  ITEM(
    'AVD6',
    'avoidance',
    'Je préfère ne pas trop me rapprocher des autres.',
    'Prefiero no acercarme demasiado a los demás.'
  ),
];

export const ATTACHMENT_TEST: SelfTestDefinition = {
  slug: 'attachement',
  version: 'ecr-s-v1',
  source: 'ECR-S (Wei et al., 2007) — échelle de recherche publique',
  sourceUrl: 'https://doi.org/10.1177/0011000006291095',
  title: {
    fr: 'Attachement — ECR court',
    es: 'Apego — ECR corto',
  },
  description: {
    fr: '12 questions pour estimer l’anxiété d’abandon et l’évitement de l’intimité dans les liens proches.',
    es: '12 preguntas para estimar la ansiedad de abandono y la evitación de la intimidad en vínculos cercanos.',
  },
  durationMin: 4,
  items: ECR_SHORT_ITEMS,
  scoreKeys: ['anxiety', 'avoidance'],
  likertLabels: {
    fr: ['Pas du tout d’accord', 'Peu d’accord', 'Neutre', 'D’accord', 'Tout à fait d’accord'],
    es: ['Totalmente en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Totalmente de acuerdo'],
  },
};

export const ATTACHMENT_LABELS: Record<
  string,
  { fr: string; es: string }
> = {
  anxiety: { fr: 'Anxiété d’attachement', es: 'Ansiedad de apego' },
  avoidance: { fr: 'Évitement', es: 'Evitación' },
};
