/**
 * Palette 4 couleurs type DISC — inspiration libre uniquement.
 * Pas de licence Wiley / Everything DiSC®, pas leurs items officiels, pas leurs normes.
 */
export const DISC_LETTER_COLOR = {
  D: '#C45D3E',
  I: '#C9A227',
  S: '#6B8F71',
  C: '#5B7C8D',
} as const;

export type DiscLetter = keyof typeof DISC_LETTER_COLOR;

export const DISC_LETTER_LABEL = {
  fr: {
    D: { short: 'Directe', full: 'Dominant → Directe' },
    I: { short: 'Envolée', full: 'Influent → Envolée' },
    S: { short: 'Ancrée', full: 'Stable → Ancrée' },
    C: { short: 'Méthode', full: 'Conforme → Méthode' },
  },
  es: {
    D: { short: 'Directa', full: 'Dominante → Directa' },
    I: { short: 'Volada', full: 'Influyente → Volada' },
    S: { short: 'Anclada', full: 'Estable → Anclada' },
    C: { short: 'Método', full: 'Cumplidora → Método' },
  },
} as const;
