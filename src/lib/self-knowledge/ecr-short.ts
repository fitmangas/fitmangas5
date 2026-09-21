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
  // EN: It helps to turn to my romantic partner in times of need. — traduction naturelle, sens fidèle à l’EN officiel
  ITEM(
    'ECR1r',
    'avoidance',
    'It helps to turn to my romantic partner in times of need.',
    'En cas de besoin, je me tourne volontiers vers mon partenaire amoureux.',
    'En momentos de necesidad, recurrir a mi pareja romántica me ayuda.',
    true
  ),
  // 2 — Anxiety
  // EN: I need a lot of reassurance that I am loved by my partner. — traduction naturelle, sens fidèle à l’EN officiel
  ITEM(
    'ECR2',
    'anxiety',
    'I need a lot of reassurance that I am loved by my partner.',
    'J’ai besoin qu’on me rassure beaucoup sur le fait que mon partenaire m’aime.',
    'Necesito que me reafirmen mucho que mi pareja me ama.'
  ),
  // 3 — Avoidance
  // EN: I want to get close to my partner, but I keep pulling back. — traduction naturelle, sens fidèle à l’EN officiel
  ITEM(
    'ECR3',
    'avoidance',
    'I want to get close to my partner, but I keep pulling back.',
    'Je veux me rapprocher de mon partenaire, mais je me retire sans cesse.',
    'Quiero acercarme a mi pareja, pero no dejo de alejarme.'
  ),
  // 4 — Anxiety
  // EN: I find that my partner(s) don't want to get as close as I would like. — traduction naturelle, sens fidèle à l’EN officiel
  ITEM(
    'ECR4',
    'anxiety',
    "I find that my partner(s) don't want to get as close as I would like.",
    'J’ai l’impression que mon partenaire ne veut pas se rapprocher autant que je le voudrais.',
    'Siento que mi pareja no quiere acercarse tanto como a mí me gustaría.'
  ),
  // 5 — Avoidance, reverse
  // EN: I turn to my partner for many things, including comfort and reassurance. — traduction naturelle, sens fidèle à l’EN officiel
  ITEM(
    'ECR5r',
    'avoidance',
    'I turn to my partner for many things, including comfort and reassurance.',
    'Je compte sur mon partenaire pour beaucoup de choses, y compris le réconfort et la rassurance.',
    'Recurro a mi pareja para muchas cosas, incluido el consuelo y la seguridad emocional.',
    true
  ),
  // 6 — Anxiety
  // EN: My desire to be very close sometimes scares people away. — traduction naturelle, sens fidèle à l’EN officiel
  ITEM(
    'ECR6',
    'anxiety',
    'My desire to be very close sometimes scares people away.',
    'Mon envie d’être très proche fait parfois fuir les gens.',
    'Mi deseo de estar muy cerca a veces espanta a la gente.'
  ),
  // 7 — Avoidance
  // EN: I try to avoid getting too close to my partner. — traduction naturelle, sens fidèle à l’EN officiel
  ITEM(
    'ECR7',
    'avoidance',
    'I try to avoid getting too close to my partner.',
    'J’essaie d’éviter de trop me rapprocher de mon partenaire.',
    'Intento no acercarme demasiado a mi pareja.'
  ),
  // 8 — Anxiety, reverse
  // EN: I do not often worry about being abandoned. — traduction naturelle, sens fidèle à l’EN officiel
  ITEM(
    'ECR8r',
    'anxiety',
    'I do not often worry about being abandoned.',
    'Je ne m’inquiète pas souvent d’être abandonnée.',
    'No me preocupo a menudo por ser abandonada.',
    true
  ),
  // 9 — Avoidance, reverse
  // EN: I usually discuss my problems and concerns with my partner. — traduction naturelle, sens fidèle à l’EN officiel
  ITEM(
    'ECR9r',
    'avoidance',
    'I usually discuss my problems and concerns with my partner.',
    'En général, je parle de mes problèmes et de mes soucis avec mon partenaire.',
    'Suelo hablar con mi pareja de mis problemas y preocupaciones.',
    true
  ),
  // 10 — Anxiety
  // EN: I get frustrated if romantic partners are not available when I need them. — traduction naturelle, sens fidèle à l’EN officiel
  ITEM(
    'ECR10',
    'anxiety',
    'I get frustrated if romantic partners are not available when I need them.',
    'Je suis frustrée quand mon partenaire n’est pas disponible quand j’en ai besoin.',
    'Me frustro si mi pareja no está disponible cuando la necesito.'
  ),
  // 11 — Avoidance
  // EN: I am nervous when partners get too close to me. — traduction naturelle, sens fidèle à l’EN officiel
  ITEM(
    'ECR11',
    'avoidance',
    'I am nervous when partners get too close to me.',
    'Je suis nerveuse quand mon partenaire se rapproche trop de moi.',
    'Me pongo nerviosa cuando mi pareja se acerca demasiado a mí.'
  ),
  // 12 — Anxiety
  // EN: I worry that romantic partners won't care about me as much as I care about them. — traduction naturelle, sens fidèle à l’EN officiel
  ITEM(
    'ECR12',
    'anxiety',
    "I worry that romantic partners won't care about me as much as I care about them.",
    'J’ai peur que mon partenaire ne tienne pas autant à moi que moi à lui.',
    'Me preocupa que mi pareja no se preocupe por mí tanto como yo por ella.'
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
