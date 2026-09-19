/**
 * 4 profils FitMangas — inspiration libre (pas Wiley / Everything DiSC®).
 * Lettres = initiales des noms FR : Directe · Enthousiaste · Assidue · Méthodique.
 */
export const DISC_LETTER_COLOR = {
  D: '#C45D3E',
  E: '#C9A227',
  A: '#6B8F71',
  M: '#5B7C8D',
} as const;

export type DiscLetter = keyof typeof DISC_LETTER_COLOR;

export const DISC_LETTER_LABEL = {
  fr: {
    D: {
      short: 'Directe',
      plain: 'Tu veux un résultat clair, vite.',
    },
    E: {
      short: 'Enthousiaste',
      plain: 'Tu bouges quand y a de la vie et du lien.',
    },
    A: {
      short: 'Assidue',
      plain: 'Tu tiens quand quelqu’un t’attend.',
    },
    M: {
      short: 'Méthodique',
      plain: 'Tu as besoin de savoir que c’est juste.',
    },
  },
  es: {
    D: {
      short: 'Directa',
      plain: 'Quieres un resultado claro, ya.',
    },
    E: {
      short: 'Entusiasta',
      plain: 'Te mueves cuando hay vida y vínculo.',
    },
    A: {
      short: 'Constante',
      plain: 'Aguantas cuando alguien te espera.',
    },
    M: {
      short: 'Metódica',
      plain: 'Necesitas saber que lo haces bien.',
    },
  },
} as const;

export const DISC_LETTER_ORDER: DiscLetter[] = ['D', 'E', 'A', 'M'];
