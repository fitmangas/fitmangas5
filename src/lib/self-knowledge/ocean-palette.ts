/** Palette OCEAN / Big Five pour radar (DA cream/terracotta FitMangas). */
export const OCEAN_TRAIT_ORDER = ['E', 'A', 'C', 'ES', 'O'] as const;
export type OceanTraitKey = (typeof OCEAN_TRAIT_ORDER)[number];

export const OCEAN_TRAIT_COLOR: Record<OceanTraitKey, string> = {
  E: '#C45D3E',
  A: '#6B8F71',
  C: '#5B7C8D',
  ES: '#8B6A9F',
  O: '#C9A227',
};

export const OCEAN_TRAIT_SHORT: Record<
  OceanTraitKey,
  { fr: string; es: string }
> = {
  E: { fr: 'E', es: 'E' },
  A: { fr: 'A', es: 'A' },
  C: { fr: 'C', es: 'C' },
  ES: { fr: 'SE', es: 'EE' },
  O: { fr: 'O', es: 'A' },
};
