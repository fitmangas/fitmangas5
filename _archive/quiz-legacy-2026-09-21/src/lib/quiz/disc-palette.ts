/**
 * 4 profils FitMangas — inspiration libre (pas Wiley / Everything DiSC®).
 * Lettres = initiales des noms FR : Directe · Enthousiaste · Assidue · Méthodique.
 *
 * Axes (lecture pédagogique, pas un test certifié) :
 * - D / M : cadre perçu exigeant → tu te tends ou tu analyses
 * - E / A : cadre perçu confortable → tu t’ouvres ou tu stabilises
 * - D / E : tu prends les rênes
 * - A / M : tu t’adaptes au cadre
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

/** Position sur 2 axes (−1…+1) pour placer le point « mix » — pas un profil unique. */
export const DISC_AXIS: Record<DiscLetter, { x: number; y: number }> = {
  D: { x: 0.72, y: 0.72 }, // rênes + cadre exigeant
  E: { x: 0.72, y: -0.72 }, // rênes + cadre confortable
  A: { x: -0.72, y: -0.72 }, // s’adapte + confortable
  M: { x: -0.72, y: 0.72 }, // s’adapte + exigeant
};

export type MixReading = {
  intensity: 'marked' | 'clear' | 'balanced';
  headline: { fr: string; es: string };
  detail: { fr: string; es: string };
};

/** Lecture du mix : jamais « 100 % d’un profil » — nuances selon écart primaire / secondaire. */
export function readMix(
  primaryLetter: DiscLetter,
  primaryPct: number,
  secondaryLetter: DiscLetter | null,
  secondaryPct: number,
): MixReading {
  const p = DISC_LETTER_LABEL.fr[primaryLetter].short;
  const pe = DISC_LETTER_LABEL.es[primaryLetter].short;
  const s = secondaryLetter ? DISC_LETTER_LABEL.fr[secondaryLetter].short : null;
  const se = secondaryLetter ? DISC_LETTER_LABEL.es[secondaryLetter].short : null;

  if (primaryPct >= 48 && (!secondaryLetter || secondaryPct < 22)) {
    return {
      intensity: 'marked',
      headline: {
        fr: `Style assez marqué : ${p} (${primaryPct}%)`,
        es: `Estilo bastante marcado: ${pe} (${primaryPct}%)`,
      },
      detail: {
        fr: `Ce n’est pas « tout ${p} ». Les autres couleurs restent présentes — elles apparaissent surtout sous stress ou quand le cadre change.`,
        es: `No eres « todo ${pe} ». Los otros colores siguen ahí — aparecen sobre todo bajo estrés o cuando el marco cambia.`,
      },
    };
  }

  if (secondaryLetter && secondaryPct >= 22) {
    return {
      intensity: primaryPct - secondaryPct <= 12 ? 'balanced' : 'clear',
      headline: {
        fr: `Ton mix : ${p} ${primaryPct}% + ${s} ${secondaryPct}%`,
        es: `Tu mix: ${pe} ${primaryPct}% + ${se} ${secondaryPct}%`,
      },
      detail: {
        fr: `Tu n’es pas un seul profil. Le premier style domine dans le quotidien ; le second colore tes choix (lien, précision, cadence…).`,
        es: `No eres un solo perfil. El primero domina en el día a día; el segundo colorea tus elecciones (vínculo, precisión, ritmo…).`,
      },
    };
  }

  return {
    intensity: 'balanced',
    headline: {
      fr: `Profil nuancé — ${p} un peu devant (${primaryPct}%)`,
      es: `Perfil matizado — ${pe} un poco por delante (${primaryPct}%)`,
    },
    detail: {
      fr: `Les écarts sont faibles : tu changes de mode selon le jour, le groupe et la fatigue. Le rapport décrit ta tendance principale, pas une case fermée.`,
      es: `Las diferencias son pequeñas: cambias de modo según el día, el grupo y el cansancio. El informe describe tu tendencia principal, no una casilla cerrada.`,
    },
  };
}

/** Point pondéré sur les axes à partir des % — pour le schéma 2×2. */
export function mixPoint(slices: { letter: DiscLetter; percent: number }[]) {
  let x = 0;
  let y = 0;
  let w = 0;
  for (const s of slices) {
    const a = DISC_AXIS[s.letter];
    const p = Math.max(s.percent, 0);
    x += a.x * p;
    y += a.y * p;
    w += p;
  }
  if (w <= 0) return { x: 0, y: 0 };
  return { x: x / w, y: y / w };
}
