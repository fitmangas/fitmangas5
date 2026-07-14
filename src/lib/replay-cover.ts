/**
 * Couverture visuelle d’un replay par type de séance (inféré du titre).
 * Sans colonne DB ni stock d’images vidéo : mapping CSS + photo coach existante.
 */

export type ReplayCoverType = 'pilates-mat' | 'yoga-flow' | 'postural' | 'renfo-core';

export function inferReplayCoverType(title: string): ReplayCoverType {
  const normalized = title.toLowerCase();
  if (normalized.includes('yoga')) return 'yoga-flow';
  if (normalized.includes('postural')) return 'postural';
  if (normalized.includes('renfo') || normalized.includes('core')) return 'renfo-core';
  return 'pilates-mat';
}

type CoverVisual = {
  label: string;
  /** Classes Tailwind pour le fond (charte terracotta / crème / beige). */
  gradientClass: string;
  /** Photo d’ambiance existante dans /public (pas de migration). */
  imageSrc: string;
  tintClass: string;
};

const COVERS: Record<ReplayCoverType, CoverVisual> = {
  'pilates-mat': {
    label: 'Pilates Mat',
    gradientClass: 'from-[#C45D3E]/90 via-[#D4A574]/55 to-[#F4E8D8]/70',
    imageSrc: '/coaches/coach-1.png',
    tintClass: 'bg-[#C45D3E]/35',
  },
  'yoga-flow': {
    label: 'Yoga Flow',
    gradientClass: 'from-[#8B6F5C]/85 via-[#E8D5C4]/50 to-[#F7F1EA]/75',
    imageSrc: '/coaches/coach-2.png',
    tintClass: 'bg-[#8B6F5C]/30',
  },
  postural: {
    label: 'Postural',
    gradientClass: 'from-[#A67C52]/80 via-[#D9C9B4]/55 to-[#FFF8F0]/70',
    imageSrc: '/alejandra.png',
    tintClass: 'bg-[#A67C52]/28',
  },
  'renfo-core': {
    label: 'Renfo Core',
    gradientClass: 'from-[#B5482E]/90 via-[#C9A96E]/45 to-[#F0E6D8]/65',
    imageSrc: '/landing/hero.jpg',
    tintClass: 'bg-[#B5482E]/40',
  },
};

export function getReplayCoverVisual(title: string): CoverVisual {
  return COVERS[inferReplayCoverType(title)];
}

/** Phrase descriptive de secours si le cours n’a pas de description. */
export function getReplayFallbackDescription(title: string, lang: 'fr' | 'en' | 'es' = 'fr'): string {
  const type = inferReplayCoverType(title);
  if (lang === 'en') {
    const map: Record<ReplayCoverType, string> = {
      'pilates-mat': 'A guided Pilates Mat session to strengthen your center with control and fluidity.',
      'yoga-flow': 'A Yoga Flow session to stretch, breathe, and reconnect with your body.',
      postural: 'A postural session to align the spine and release daily tension.',
      'renfo-core': 'A Core strengthening session for stability, tone, and lasting energy.',
    };
    return map[type];
  }
  if (lang === 'es') {
    const map: Record<ReplayCoverType, string> = {
      'pilates-mat': 'Una sesión de Pilates Mat guiada para fortalecer el centro con control y fluidez.',
      'yoga-flow': 'Una sesión de Yoga Flow para estirar, respirar y reconectar con el cuerpo.',
      postural: 'Una sesión postural para alinear la espalda y soltar las tensiones del día.',
      'renfo-core': 'Una sesión de refuerzo Core para estabilidad, tono y energía duradera.',
    };
    return map[type];
  }
  const map: Record<ReplayCoverType, string> = {
    'pilates-mat': 'Une séance de Pilates Mat guidée pour renforcer le centre du corps avec contrôle et fluidité.',
    'yoga-flow': 'Une séance de Yoga Flow pour s’étirer, respirer et se reconnecter au corps.',
    postural: 'Une séance posturale pour aligner le dos et relâcher les tensions du quotidien.',
    'renfo-core': 'Une séance de renfo Core pour gagner en stabilité, tonus et énergie durable.',
  };
  return map[type];
}
