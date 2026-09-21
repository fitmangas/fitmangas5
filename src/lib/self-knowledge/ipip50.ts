import type { SelfTestDefinition, SelfTestItem } from './types';

/**
 * IPIP-50 — Big-Five Factor Markers (10 items × 5 factors).
 *
 * Source (items EN + keying officiel) :
 * - Scoring key : https://ipip.ori.org/newBigFive5broadKey.htm
 * - Administration sample : https://ipip.ori.org/New_IPIP-50-item-scale.htm
 * - Goldberg, L. R. (1992). The development of markers for the Big-Five factor structure.
 *   Psychological Assessment, 4, 26–42.
 * Domaine public IPIP (https://ipip.ori.org/).
 *
 * Factor IV officiel = Emotional Stability (+keyed = plus stable).
 * On conserve la clé `ES` (Stabilité émotionnelle), pas Neuroticisme inversé.
 *
 * Traductions FR/ES : littérales item-par-item (non validées psychométriquement).
 * Chaque item : commentaire « traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement) » + texte EN officiel.
 *
 * Scoring : Likert 1–5 ; reverse (−keyed) → (6 − raw) puis somme 10–50 par facteur.
 */
const ITEM = (
  id: string,
  key: string,
  en: string,
  fr: string,
  es: string,
  reverse = false
): SelfTestItem => ({
  id,
  key,
  text: { fr, es },
  /** Texte officiel EN (référence de vérité, non affiché) */
  en,
  reverse,
});

export const IPIP50_ITEMS: SelfTestItem[] = [
  // ——— Extraversion (E) — 5 +keyed / 5 −keyed ———
  // EN: Am the life of the party. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('E1', 'E', 'Am the life of the party.', 'Je suis l’âme de la fête.', 'Soy el alma de la fiesta.'),
  // EN: Don't talk a lot. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('E2r', 'E', "Don't talk a lot.", 'Je ne parle pas beaucoup.', 'No hablo mucho.', true),
  // EN: Feel comfortable around people. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('E3', 'E', 'Feel comfortable around people.', 'Je me sens à l’aise avec les gens.', 'Me siento cómoda con la gente.'),
  // EN: Keep in the background. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('E4r', 'E', 'Keep in the background.', 'Je reste en retrait.', 'Me quedo en segundo plano.', true),
  // EN: Start conversations. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('E5', 'E', 'Start conversations.', 'Je lance les conversations.', 'Empiezo las conversaciones.'),
  // EN: Have little to say. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('E6r', 'E', 'Have little to say.', 'J’ai peu de choses à dire.', 'Tengo poco que decir.', true),
  // EN: Talk to a lot of different people at parties. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM(
    'E7',
    'E',
    'Talk to a lot of different people at parties.',
    'Dans les soirées, je parle à beaucoup de gens différents.',
    'En las fiestas hablo con mucha gente distinta.'
  ),
  // EN: Don't like to draw attention to myself. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM(
    'E8r',
    'E',
    "Don't like to draw attention to myself.",
    'Je n’aime pas attirer l’attention sur moi.',
    'No me gusta atraer la atención sobre mí.',
    true
  ),
  // EN: Don't mind being the center of attention. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM(
    'E9',
    'E',
    "Don't mind being the center of attention.",
    'Ça ne me gêne pas d’être au centre de l’attention.',
    'No me importa ser el centro de atención.'
  ),
  // EN: Am quiet around strangers. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('E10r', 'E', 'Am quiet around strangers.', 'Je suis silencieuse avec les inconnus.', 'Soy silenciosa con desconocidos.', true),

  // ——— Agreeableness (A) — 6 +keyed / 4 −keyed ———
  // EN: Am interested in people. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('A1', 'A', 'Am interested in people.', 'Je m’intéresse aux gens.', 'Me interesan las personas.'),
  // EN: Sympathize with others' feelings. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM(
    'A2',
    'A',
    "Sympathize with others' feelings.",
    'Je compatis avec les sentiments des autres.',
    'Simpatizo con los sentimientos de los demás.'
  ),
  // EN: Have a soft heart. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('A3', 'A', 'Have a soft heart.', 'J’ai un cœur tendre.', 'Tengo un corazón tierno.'),
  // EN: Take time out for others. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('A4', 'A', 'Take time out for others.', 'Je prends du temps pour les autres.', 'Dedico tiempo a los demás.'),
  // EN: Feel others' emotions. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('A5', 'A', "Feel others' emotions.", 'Je ressens les émotions des autres.', 'Siento las emociones de los demás.'),
  // EN: Make people feel at ease. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('A6', 'A', 'Make people feel at ease.', 'Je mets les gens à l’aise.', 'Hago que la gente se sienta a gusto.'),
  // EN: Am not really interested in others. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM(
    'A7r',
    'A',
    'Am not really interested in others.',
    'Je ne m’intéresse pas vraiment aux autres.',
    'Realmente no me interesan los demás.',
    true
  ),
  // EN: Insult people. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('A8r', 'A', 'Insult people.', 'J’insulte les gens.', 'Insulto a la gente.', true),
  // EN: Am not interested in other people's problems. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM(
    'A9r',
    'A',
    "Am not interested in other people's problems.",
    'Je ne m’intéresse pas aux problèmes des autres.',
    'No me interesan los problemas de otras personas.',
    true
  ),
  // EN: Feel little concern for others. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM(
    'A10r',
    'A',
    'Feel little concern for others.',
    'Je me soucie peu des autres.',
    'Me preocupo poco por los demás.',
    true
  ),

  // ——— Conscientiousness (C) — 6 +keyed / 4 −keyed ———
  // EN: Am always prepared. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('C1', 'C', 'Am always prepared.', 'Je suis toujours préparée.', 'Siempre estoy preparada.'),
  // EN: Pay attention to details. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('C2', 'C', 'Pay attention to details.', 'Je fais attention aux détails.', 'Presto atención a los detalles.'),
  // EN: Get chores done right away. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM(
    'C3',
    'C',
    'Get chores done right away.',
    'Je fais les tâches tout de suite.',
    'Hago las tareas enseguida.'
  ),
  // EN: Like order. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('C4', 'C', 'Like order.', 'J’aime l’ordre.', 'Me gusta el orden.'),
  // EN: Follow a schedule. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('C5', 'C', 'Follow a schedule.', 'Je suis mon emploi du temps.', 'Sigo un horario.'),
  // EN: Am exacting in my work. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('C6', 'C', 'Am exacting in my work.', 'Je suis exigeante dans mon travail.', 'Soy exigente en mi trabajo.'),
  // EN: Leave my belongings around. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM(
    'C7r',
    'C',
    'Leave my belongings around.',
    'Je laisse mes affaires traîner.',
    'Dejo mis pertenencias tiradas.',
    true
  ),
  // EN: Make a mess of things. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('C8r', 'C', 'Make a mess of things.', 'Je mets le bazar.', 'Lo dejo todo hecho un desastre.', true),
  // EN: Often forget to put things back in their proper place. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM(
    'C9r',
    'C',
    'Often forget to put things back in their proper place.',
    'J’oublie souvent de remettre les choses à leur place.',
    'A menudo olvido poner las cosas en su sitio.',
    true
  ),
  // EN: Shirk my duties. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('C10r', 'C', 'Shirk my duties.', 'Je néglige mes devoirs.', 'Eludo mis responsabilidades.', true),

  // ——— Emotional Stability (ES) — 2 +keyed / 8 −keyed ———
  // EN: Am relaxed most of the time. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM(
    'ES1',
    'ES',
    'Am relaxed most of the time.',
    'Je suis détendue la plupart du temps.',
    'Estoy relajada la mayor parte del tiempo.'
  ),
  // EN: Seldom feel blue. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('ES2', 'ES', 'Seldom feel blue.', 'Je me sens rarement déprimée.', 'Rara vez me siento triste.'),
  // EN: Get stressed out easily. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('ES3r', 'ES', 'Get stressed out easily.', 'Je me stresse facilement.', 'Me estreso con facilidad.', true),
  // EN: Worry about things. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('ES4r', 'ES', 'Worry about things.', 'Je m’inquiète pour les choses.', 'Me preocupo por las cosas.', true),
  // EN: Am easily disturbed. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('ES5r', 'ES', 'Am easily disturbed.', 'Je me perturbe facilement.', 'Me perturbo con facilidad.', true),
  // EN: Get upset easily. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('ES6r', 'ES', 'Get upset easily.', 'Je m’énerve facilement.', 'Me enfado con facilidad.', true),
  // EN: Change my mood a lot. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('ES7r', 'ES', 'Change my mood a lot.', 'Je change beaucoup d’humeur.', 'Cambio mucho de humor.', true),
  // EN: Have frequent mood swings. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM(
    'ES8r',
    'ES',
    'Have frequent mood swings.',
    'J’ai souvent des sautes d’humeur.',
    'Tengo cambios de humor a menudo.',
    true
  ),
  // EN: Get irritated easily. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('ES9r', 'ES', 'Get irritated easily.', 'Je m’irrite facilement.', 'Me irrito con facilidad.', true),
  // EN: Often feel blue. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('ES10r', 'ES', 'Often feel blue.', 'Je me sens souvent déprimée.', 'A menudo me siento triste.', true),

  // ——— Intellect / Imagination (O = Openness) — 7 +keyed / 3 −keyed ———
  // EN: Have a rich vocabulary. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('O1', 'O', 'Have a rich vocabulary.', 'J’ai un vocabulaire riche.', 'Tengo un vocabulario rico.'),
  // EN: Have a vivid imagination. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('O2', 'O', 'Have a vivid imagination.', 'J’ai une imagination vive.', 'Tengo una imaginación viva.'),
  // EN: Have excellent ideas. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('O3', 'O', 'Have excellent ideas.', 'J’ai d’excellentes idées.', 'Tengo excelentes ideas.'),
  // EN: Am quick to understand things. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('O4', 'O', 'Am quick to understand things.', 'Je comprends vite les choses.', 'Entiendo las cosas rápido.'),
  // EN: Use difficult words. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('O5', 'O', 'Use difficult words.', 'J’utilise des mots difficiles.', 'Uso palabras difíciles.'),
  // EN: Spend time reflecting on things. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM(
    'O6',
    'O',
    'Spend time reflecting on things.',
    'Je prends le temps de réfléchir.',
    'Paso tiempo reflexionando.'
  ),
  // EN: Am full of ideas. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM('O7', 'O', 'Am full of ideas.', 'Je suis pleine d’idées.', 'Estoy llena de ideas.'),
  // EN: Have difficulty understanding abstract ideas. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM(
    'O8r',
    'O',
    'Have difficulty understanding abstract ideas.',
    'J’ai du mal à comprendre les idées abstraites.',
    'Tengo dificultad para entender ideas abstractas.',
    true
  ),
  // EN: Am not interested in abstract ideas. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM(
    'O9r',
    'O',
    'Am not interested in abstract ideas.',
    'Je ne m’intéresse pas aux idées abstraites.',
    'No me interesan las ideas abstractas.',
    true
  ),
  // EN: Do not have a good imagination. — traduction naturelle, sens fidèle à l’EN officiel (non validée psychométriquement)
  ITEM(
    'O10r',
    'O',
    'Do not have a good imagination.',
    'Je n’ai pas une bonne imagination.',
    'No tengo buena imaginación.',
    true
  ),
];

export const BIG_FIVE_TEST: SelfTestDefinition = {
  slug: 'big-five',
  version: 'ipip-50-v2-official',
  source:
    'IPIP-50 Big-Five Factor Markers (Goldberg, 1992) — domaine public — keying https://ipip.ori.org/newBigFive5broadKey.htm',
  sourceUrl: 'https://ipip.ori.org/New_IPIP-50-item-scale.htm',
  title: {
    fr: 'Big Five — personnalité (IPIP-50)',
    es: 'Big Five — personalidad (IPIP-50)',
  },
  description: {
    fr: '50 items officiels IPIP pour Extraversion, Agréabilité, Conscience, Stabilité émotionnelle et Ouverture/Intellect.',
    es: '50 ítems oficiales IPIP para Extraversión, Amabilidad, Responsabilidad, Estabilidad emocional y Apertura/Intelecto.',
  },
  durationMin: 8,
  items: IPIP50_ITEMS,
  scoreKeys: ['E', 'A', 'C', 'ES', 'O'],
  likertMax: 5,
  likertLabels: {
    fr: ['Très inexact', 'Modérément inexact', 'Ni exact ni inexact', 'Modérément exact', 'Très exact'],
    es: ['Muy inexacto', 'Moderadamente inexacto', 'Ni exacto ni inexacto', 'Moderadamente exacto', 'Muy exacto'],
  },
};

/** Comptage officiel −keyed (reverse) attendu par facteur */
export const IPIP50_OFFICIAL_REVERSE_COUNTS: Record<string, number> = {
  E: 5,
  A: 4,
  C: 4,
  ES: 8,
  O: 3,
};

export const BIG_FIVE_LABELS: Record<
  string,
  { fr: string; es: string; short: { fr: string; es: string } }
> = {
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
  C: {
    fr: 'Conscience',
    es: 'Responsabilidad',
    short: { fr: 'Conscience', es: 'Responsabilidad' },
  },
  ES: {
    fr: 'Stabilité émotionnelle',
    es: 'Estabilidad emocional',
    short: { fr: 'Stabilité émotionnelle', es: 'Estabilidad emocional' },
  },
  O: {
    fr: 'Ouverture / Intellect',
    es: 'Apertura / Intelecto',
    short: { fr: 'Ouverture', es: 'Apertura' },
  },
};
