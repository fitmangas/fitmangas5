import type { SelfTestDefinition, SelfTestItem } from './types';

/**
 * ECR-S — Experiences in Close Relationships Scale, Short Form (12 items).
 *
 * Source officielle :
 * Wei, M., Russell, D. W., Mallinckrodt, B., & Vogel, D. L. (2007).
 * The Experiences in Close Relationship Scale (ECR)-Short Form:
 * Reliability, validity, and factor structure.
 * Journal of Personality Assessment, 88(2), 187–204.
 * DOI : https://doi.org/10.1080/00223890701268041
 *
 * Sous-échelles (Wei et al., 2007) :
 * - Anxiety  : items 2, 4, 6, 8(R), 10, 12
 * - Avoidance: items 1(R), 3, 5(R), 7, 9(R), 11
 *
 * Échelle Likert officielle : 1–7 (conservée telle quelle).
 * reverse (−keyed) → (8 − raw) avant moyenne de sous-échelle.
 *
 * Traductions FR/ES : littérales (non validées psychométriquement).
 */
const ITEM = (
  id: string,
  key: 'anxiety' | 'avoidance',
  en: string,
  fr: string,
  es: string,
  reverse = false
): SelfTestItem => ({
  id,
  key,
  text: { fr, es },
  en,
  reverse,
});

export const ECR_SHORT_ITEMS: SelfTestItem[] = [
  // 1 — Avoidance, reverse
  // EN: It helps to turn to my romantic partner in times of need. — traduction littérale, non validée
  ITEM(
    'ECR1r',
    'avoidance',
    'It helps to turn to my romantic partner in times of need.',
    'Cela m’aide de me tourner vers mon partenaire amoureux en cas de besoin.',
    'Me ayuda recurrir a mi pareja romántica en momentos de necesidad.',
    true
  ),
  // 2 — Anxiety
  // EN: I need a lot of reassurance that I am loved by my partner. — traduction littérale, non validée
  ITEM(
    'ECR2',
    'anxiety',
    'I need a lot of reassurance that I am loved by my partner.',
    'J’ai besoin de beaucoup de réassurance que mon partenaire m’aime.',
    'Necesito mucha reafirmación de que mi pareja me ama.'
  ),
  // 3 — Avoidance
  // EN: I want to get close to my partner, but I keep pulling back. — traduction littérale, non validée
  ITEM(
    'ECR3',
    'avoidance',
    'I want to get close to my partner, but I keep pulling back.',
    'Je veux me rapprocher de mon partenaire, mais je n’arrête pas de me retirer.',
    'Quiero acercarme a mi pareja, pero sigo alejándome.'
  ),
  // 4 — Anxiety
  // EN: I find that my partner(s) don't want to get as close as I would like. — traduction littérale, non validée
  ITEM(
    'ECR4',
    'anxiety',
    "I find that my partner(s) don't want to get as close as I would like.",
    'Je trouve que mon / mes partenaire(s) ne veulent pas se rapprocher autant que je le voudrais.',
    'Encuentro que mi(s) pareja(s) no quiere(n) acercarse tanto como a mí me gustaría.'
  ),
  // 5 — Avoidance, reverse
  // EN: I turn to my partner for many things, including comfort and reassurance. — traduction littérale, non validée
  ITEM(
    'ECR5r',
    'avoidance',
    'I turn to my partner for many things, including comfort and reassurance.',
    'Je me tourne vers mon partenaire pour beaucoup de choses, y compris le réconfort et la réassurance.',
    'Recurro a mi pareja para muchas cosas, incluido el consuelo y la reafirmación.',
    true
  ),
  // 6 — Anxiety
  // EN: My desire to be very close sometimes scares people away. — traduction littérale, non validée
  ITEM(
    'ECR6',
    'anxiety',
    'My desire to be very close sometimes scares people away.',
    'Mon désir d’être très proche fait parfois fuir les gens.',
    'Mi deseo de estar muy cerca a veces ahuyenta a la gente.'
  ),
  // 7 — Avoidance
  // EN: I try to avoid getting too close to my partner. — traduction littérale, non validée
  ITEM(
    'ECR7',
    'avoidance',
    'I try to avoid getting too close to my partner.',
    'J’essaie d’éviter de me rapprocher trop de mon partenaire.',
    'Intento evitar acercarme demasiado a mi pareja.'
  ),
  // 8 — Anxiety, reverse
  // EN: I do not often worry about being abandoned. — traduction littérale, non validée
  ITEM(
    'ECR8r',
    'anxiety',
    'I do not often worry about being abandoned.',
    'Je ne m’inquiète pas souvent d’être abandonnée.',
    'No me preocupo a menudo por ser abandonada.',
    true
  ),
  // 9 — Avoidance, reverse
  // EN: I usually discuss my problems and concerns with my partner. — traduction littérale, non validée
  ITEM(
    'ECR9r',
    'avoidance',
    'I usually discuss my problems and concerns with my partner.',
    'Je discute en général de mes problèmes et préoccupations avec mon partenaire.',
    'Suelo hablar de mis problemas y preocupaciones con mi pareja.',
    true
  ),
  // 10 — Anxiety
  // EN: I get frustrated if romantic partners are not available when I need them. — traduction littérale, non validée
  ITEM(
    'ECR10',
    'anxiety',
    'I get frustrated if romantic partners are not available when I need them.',
    'Je suis frustrée si les partenaires amoureux ne sont pas disponibles quand j’en ai besoin.',
    'Me frustro si las parejas románticas no están disponibles cuando las necesito.'
  ),
  // 11 — Avoidance
  // EN: I am nervous when partners get too close to me. — traduction littérale, non validée
  ITEM(
    'ECR11',
    'avoidance',
    'I am nervous when partners get too close to me.',
    'Je suis nerveuse quand les partenaires se rapprochent trop de moi.',
    'Me pongo nerviosa cuando las parejas se acercan demasiado a mí.'
  ),
  // 12 — Anxiety
  // EN: I worry that romantic partners won't care about me as much as I care about them. — traduction littérale, non validée
  ITEM(
    'ECR12',
    'anxiety',
    "I worry that romantic partners won't care about me as much as I care about them.",
    'Je m’inquiète que les partenaires amoureux ne se soucient pas de moi autant que je me soucie d’eux.',
    'Me preocupa que las parejas románticas no se preocupen por mí tanto como yo por ellas.'
  ),
];

/** Comptage officiel reverse par sous-échelle (Wei et al., 2007) */
export const ECR_OFFICIAL_REVERSE_COUNTS: Record<string, number> = {
  anxiety: 1,
  avoidance: 3,
};

export const ATTACHMENT_TEST: SelfTestDefinition = {
  slug: 'attachement',
  version: 'ecr-s-v2-official',
  source:
    'ECR-S (Wei, Russell, Mallinckrodt & Vogel, 2007), Journal of Personality Assessment, 88(2), 187–204 — DOI 10.1080/00223890701268041 — Likert 1–7 conservée',
  sourceUrl: 'https://doi.org/10.1080/00223890701268041',
  title: {
    fr: 'Attachement — ECR-S (12 items)',
    es: 'Apego — ECR-S (12 ítems)',
  },
  description: {
    fr: '12 items officiels ECR-S : anxiété d’abandon et évitement de l’intimité (échelle 1–7).',
    es: '12 ítems oficiales ECR-S: ansiedad de abandono y evitación de la intimidad (escala 1–7).',
  },
  durationMin: 4,
  items: ECR_SHORT_ITEMS,
  scoreKeys: ['anxiety', 'avoidance'],
  likertMax: 7,
  likertLabels: {
    fr: [
      'Fortement en désaccord',
      'En désaccord',
      'Légèrement en désaccord',
      'Neutre',
      'Légèrement d’accord',
      'D’accord',
      'Fortement d’accord',
    ],
    es: [
      'Totalmente en desacuerdo',
      'En desacuerdo',
      'Ligeramente en desacuerdo',
      'Neutral',
      'Ligeramente de acuerdo',
      'De acuerdo',
      'Totalmente de acuerdo',
    ],
  },
};

export const ATTACHMENT_LABELS: Record<string, { fr: string; es: string }> = {
  anxiety: { fr: 'Anxiété d’attachement', es: 'Ansiedad de apego' },
  avoidance: { fr: 'Évitement', es: 'Evitación' },
};
