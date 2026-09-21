import type { SelfTestDefinition, SelfTestItem } from './types';

/**
 * IPIP-50 (Goldberg, 1999) — 50 public-domain items, 10 per Big Five trait.
 * Source: International Personality Item Pool — https://ipip.ori.org/
 * Scoring: 1–5 Likert; reverse items inverted to 6 − raw before summing.
 * Trait totals: 10–50 each (O, C, E, A, N).
 */
const ITEM = (
  id: string,
  key: string,
  fr: string,
  es: string,
  reverse = false
): SelfTestItem => ({ id, key, text: { fr, es }, reverse });

export const IPIP50_ITEMS: SelfTestItem[] = [
  // Extraversion (E)
  ITEM('E1', 'E', 'Je suis le centre d’attention des fêtes.', 'Soy el alma de las fiestas.'),
  ITEM('E2r', 'E', 'Je parle peu.', 'Hablo poco.', true),
  ITEM('E3', 'E', 'Je me sens à l’aise avec les gens.', 'Me siento cómoda con la gente.'),
  ITEM('E4r', 'E', 'Je reste en retrait.', 'Me quedo en segundo plano.', true),
  ITEM('E5', 'E', 'Je démarre les conversations.', 'Inicio las conversaciones.'),
  ITEM('E6', 'E', 'J’ai beaucoup à dire.', 'Tengo mucho que decir.'),
  ITEM('E7r', 'E', 'Je n’aime pas attirer l’attention sur moi.', 'No me gusta llamar la atención.', true),
  ITEM('E8r', 'E', 'Je suis silencieuse avec les inconnus.', 'Soy silenciosa con desconocidos.', true),
  ITEM('E9', 'E', 'Je n’ai pas peur de m’exprimer.', 'No me da miedo expresarme.'),
  ITEM('E10', 'E', 'Je suis la vie de la fête.', 'Soy la vida de la fiesta.'),
  // Agreeableness (A)
  ITEM('A1r', 'A', 'Je m’intéresse peu aux autres.', 'Me interesan poco los demás.', true),
  ITEM('A2', 'A', 'Je m’intéresse aux gens.', 'Me interesan las personas.'),
  ITEM('A3r', 'A', 'J’insulte les gens.', 'Insulto a la gente.', true),
  ITEM('A4', 'A', 'Je compatis avec les sentiments des autres.', 'Simpatizo con los sentimientos ajenos.'),
  ITEM('A5r', 'A', 'Je ne suis pas intéressée par les problèmes des autres.', 'No me interesan los problemas ajenos.', true),
  ITEM('A6', 'A', 'J’ai un cœur tendre.', 'Tengo un corazón tierno.'),
  ITEM('A7r', 'A', 'Je ne me sens vraiment pas concernée par les autres.', 'Realmente no me importan los demás.', true),
  ITEM('A8', 'A', 'Je prends du temps pour les autres.', 'Dedico tiempo a los demás.'),
  ITEM('A9', 'A', 'Je ressens les émotions des autres.', 'Siento las emociones de los demás.'),
  ITEM('A10', 'A', 'Je mets les gens à l’aise.', 'Hago que la gente se sienta cómoda.'),
  // Conscientiousness (C)
  ITEM('C1', 'C', 'Je suis toujours préparée.', 'Siempre estoy preparada.'),
  ITEM('C2r', 'C', 'Je laisse mes affaires traîner.', 'Dejo mis cosas tiradas.', true),
  ITEM('C3', 'C', 'Je fais attention aux détails.', 'Presto atención a los detalles.'),
  ITEM('C4r', 'C', 'Je fais des dégâts.', 'Hago un desastre.', true),
  ITEM('C5', 'C', 'Je m’acquitte rapidement des tâches.', 'Cumplo las tareas de inmediato.'),
  ITEM('C6r', 'C', 'J’oublie souvent de ranger les choses.', 'A menudo olvido poner las cosas en su sitio.', true),
  ITEM('C7', 'C', 'J’aime l’ordre.', 'Me gusta el orden.'),
  ITEM('C8r', 'C', 'Je néglige mes devoirs.', 'Eludo mis responsabilidades.', true),
  ITEM('C9', 'C', 'Je suis une travailleuse appliquée.', 'Soy una trabajadora aplicada.'),
  ITEM('C10', 'C', 'Je suis organisée.', 'Soy organizada.'),
  // Neuroticism (N)
  ITEM('N1', 'N', 'Je me stresse facilement.', 'Me estreso con facilidad.'),
  ITEM('N2r', 'N', 'Je suis détendue la plupart du temps.', 'Estoy relajada la mayor parte del tiempo.', true),
  ITEM('N3', 'N', 'Je m’inquiète pour les choses.', 'Me preocupo por las cosas.'),
  ITEM('N4r', 'N', 'Je suis rarement triste.', 'Rara vez estoy triste.', true),
  ITEM('N5', 'N', 'Je me perturbe facilement.', 'Me perturbo con facilidad.'),
  ITEM('N6', 'N', 'Je change souvent d’humeur.', 'Cambio de humor a menudo.'),
  ITEM('N7r', 'N', 'Je me sens rarement bleue.', 'Rara vez me siento deprimida.', true),
  ITEM('N8', 'N', 'Je me sens facilement menacée.', 'Me siento amenazada con facilidad.'),
  ITEM('N9', 'N', 'Je me fâche facilement.', 'Me enfado con facilidad.'),
  ITEM('N10r', 'N', 'Je reste souvent calme.', 'Suelo mantenerme calmada.', true),
  // Openness (O)
  ITEM('O1', 'O', 'J’ai un vocabulaire riche.', 'Tengo un vocabulario rico.'),
  ITEM('O2r', 'O', 'J’ai du mal à comprendre les idées abstraites.', 'Me cuesta entender ideas abstractas.', true),
  ITEM('O3', 'O', 'J’ai une imagination vive.', 'Tengo una imaginación viva.'),
  ITEM('O4r', 'O', 'Je ne m’intéresse pas aux idées abstraites.', 'No me interesan las ideas abstractas.', true),
  ITEM('O5', 'O', 'J’ai d’excellentes idées.', 'Tengo excelentes ideas.'),
  ITEM('O6r', 'O', 'Je n’ai pas une bonne imagination.', 'No tengo buena imaginación.', true),
  ITEM('O7', 'O', 'Je comprends vite les choses.', 'Entiendo las cosas rápido.'),
  ITEM('O8', 'O', 'J’utilise des mots difficiles.', 'Uso palabras difíciles.'),
  ITEM('O9', 'O', 'Je passe du temps à réfléchir.', 'Paso tiempo reflexionando.'),
  ITEM('O10r', 'O', 'Je suis peu créative.', 'Soy poco creativa.', true),
];

export const BIG_FIVE_TEST: SelfTestDefinition = {
  slug: 'big-five',
  version: 'ipip-50-v1',
  source: 'IPIP-50 (Goldberg, 1999) — domaine public',
  sourceUrl: 'https://ipip.ori.org/',
  title: {
    fr: 'Big Five — personnalité (IPIP-50)',
    es: 'Big Five — personalidad (IPIP-50)',
  },
  description: {
    fr: '50 questions publiques pour cartographier Ouverture, Conscience, Extraversion, Agréabilité et Neuroticisme.',
    es: '50 preguntas públicas para mapear Apertura, Responsabilidad, Extraversión, Amabilidad y Neuroticismo.',
  },
  durationMin: 8,
  items: IPIP50_ITEMS,
  scoreKeys: ['O', 'C', 'E', 'A', 'N'],
  likertLabels: {
    fr: ['Pas du tout d’accord', 'Peu d’accord', 'Neutre', 'D’accord', 'Tout à fait d’accord'],
    es: ['Totalmente en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Totalmente de acuerdo'],
  },
};

export const BIG_FIVE_LABELS: Record<
  string,
  { fr: string; es: string; short: { fr: string; es: string } }
> = {
  O: {
    fr: 'Ouverture',
    es: 'Apertura',
    short: { fr: 'Ouverture', es: 'Apertura' },
  },
  C: {
    fr: 'Conscience',
    es: 'Responsabilidad',
    short: { fr: 'Conscience', es: 'Responsabilidad' },
  },
  E: {
    fr: 'Extraversion',
    es: 'Extraversión',
    short: { fr: 'Extraversion', es: 'Extraversión' },
  },
  A: {
    fr: 'Agréabilité',
    es: 'Amabilidad',
    short: { fr: 'Agréabilité', es: 'Amabilidad' },
  },
  N: {
    fr: 'Neuroticisme',
    es: 'Neuroticismo',
    short: { fr: 'Neuroticisme', es: 'Neuroticismo' },
  },
};
