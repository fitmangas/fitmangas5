/**
 * Contenu actionnable issu de docs/MARCHE_FEMMES.md (UI onglet Marché).
 * Ne remplace pas le MD — le MD reste la source éditoriale avec sources datées.
 */

export type MarcheMarketBlock = {
  id: 'fr' | 'mx';
  label: string;
  codes: string[];
  anglesPriority: string[];
  anglesSecondary: string[];
  avoid: string[];
};

export const MARCHE_WANTS = [
  {
    id: 'constance',
    title: 'Constance douce',
    detail: 'Rituel à horaires fixes, pas « motivation » punitive.',
  },
  {
    id: 'non-jugement',
    title: 'Non-jugement',
    detail: 'Espace safe — trash-talk industrie seulement, jamais le corps.',
  },
  {
    id: 'etre-vue',
    title: 'Être vue',
    detail: 'Correction en direct + coach qui te regarde (vs YouTube anonyme).',
  },
  {
    id: 'mind-body',
    title: 'Mind-body',
    detail: 'Dos, stress, énergie, sommeil — pas seulement « abdos ».',
  },
  {
    id: 'pour-la-vie',
    title: 'Pour la vie, pas pour le look',
    detail: 'Longévité / mobilité / midlife — pas transformation 6 semaines.',
  },
  {
    id: 'at-home',
    title: 'Convenance at-home',
    detail: 'Visio depuis chez soi, matériel minimal.',
  },
] as const;

export const MARCHE_TRENDS = [
  {
    title: 'Pilates & barre en demande (at-home + boutique)',
    implication: 'OK d’accrocher avec « Pilates » — promesse pub = communauté + live.',
  },
  {
    title: 'Midlife / périménopause / post-partum en hausse',
    implication: 'Angles PORTÉE : dos 15h, énergie, sommeil, 45+ sans jugement.',
  },
  {
    title: 'Fatigue du fitness « transformation »',
    implication: 'CTA anti-risque essai 7 j ; langage plat.',
  },
  {
    title: 'UGC vidéo courte > pubs léchées',
    implication: 'Voir docs/ADS_EXPERTISE.md — 15–30 s talking-head sous-titré.',
  },
] as const;

export const MARCHE_POSITIONING = {
  tooNiche: '« Studio Pilates & Barre en ligne pour expertes » → volume bas, auto-exclusion.',
  wideMessage:
    '« Tu as déjà essayé seule et tu as lâché ? Rejoins des cours collectifs à horaires fixes, avec une coach qui te corrige en direct. »',
  rule: 'Pilates / Barre = véhicule. Produit réel = ne pas être seule + correction + être vue.',
};

export const MARCHE_MARKETS: MarcheMarketBlock[] = [
  {
    id: 'fr',
    label: 'France (primaire)',
    codes: [
      'Direct, honnête, anti-Bullshit ; méfiance « miracle ».',
      'Prix 39 € groupe affirmé ; essai 7 j + carte = acquis.',
      'FR d’abord ; tutoiement OK ; jamais « Mangitas ».',
      'Douleurs concrètes : dos bureau, post-partum, 45+, stress, sommeil.',
    ],
    anglesPriority: [
      'Dos / 15h / bureau',
      'Essai 7 j sans pression',
      'Correction en direct (vs replay seul)',
      '« Envoie ça à une copine »',
      'Quiz → lead soft',
    ],
    anglesSecondary: ['Pilates technique pur', 'Présentiel Nantes (warm / local)'],
    avoid: ['Miracle minceur', 'Jugement corps / âge / poids'],
  },
  {
    id: 'mx',
    label: 'Mexique (secondaire)',
    codes: [
      'Relationnel, chaleur, communauté ; WhatsApp fort.',
      'ES naturel — pas de calques FR littéraux.',
      'Ne pas coller 39 € FR sans contexte local.',
      'Coach accessible ; IG / WhatsApp prioritaires.',
    ],
    anglesPriority: [
      'Comunidad + no estás sola',
      'Corrección en vivo',
      'En casa, cuando te conviene',
      'Prueba / essai expliqué clairement',
      'Quiz ES si funnel prêt',
    ],
    anglesSecondary: ['Facebook encore utile en warm'],
    avoid: ['Ton corporate froid FR', '« Bajar de peso » comme promesse centrale'],
  },
];

export const MARCHE_PUB_CONCLUSION = [
  'Promesse large : solitude / constance / être vue — Pilates = véhicule.',
  'Créatives : UGC 15–30 s, hook 3 s, PAS ou Hook-Problème-Solution-Preuve.',
  'CTA : essai 7 j ou quiz — anti-risque.',
  'FR d’abord en volume ; MX = créatives ES dédiées.',
  'Croiser démographie Meta réelle (âge / genre / pays) : qui te suit vs qui tu pourrais toucher.',
] as const;

export const DOC_SOURCES_NOTE =
  'Sources datées dans docs/MARCHE_FEMMES.md et docs/ADS_EXPERTISE.md (2024–2026).';
