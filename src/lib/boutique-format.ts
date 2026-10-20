/** Partie « affichage » de la boutique (D02), utilisable côté navigateur (aucune dépendance serveur). */

export type BoutiqueCategory = 'bouger' | 'accessoires' | 'quotidien';

const CATEGORY_RULES: Array<{ category: BoutiqueCategory; words: string[] }> = [
  {
    category: 'accessoires',
    words: ['tapis', 'mat', 'gourde', 'bouteille', 'bottle', 'tumbler', 'bande', 'band', 'ballon', 'ball', 'sac de sport', 'gym bag', 'duffle', 'serviette', 'towel'],
  },
  {
    category: 'bouger',
    words: ['brassière', 'bra', 'legging', 'short', 't-shirt', 'tee', 'top', 'débardeur', 'tank', 'sweat', 'hoodie', 'jogger', 'chaussette', 'sock', 'veste', 'jacket', 'crop'],
  },
];

export function boutiqueCategoryFor(name: string): BoutiqueCategory {
  const n = name.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.words.some((w) => n.includes(w))) return rule.category;
  }
  return 'quotidien';
}

export function formatBoutiquePrice(
  item: { minPrice: number | null; maxPrice: number | null; currency: string },
  locale = 'fr-FR',
): string | null {
  if (item.minPrice == null) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: item.currency || 'EUR',
      minimumFractionDigits: n % 1 === 0 ? 0 : 2,
      maximumFractionDigits: n % 1 === 0 ? 0 : 2,
    }).format(n);
  if (item.maxPrice != null && item.maxPrice > item.minPrice) {
    return locale.startsWith('es') ? `desde ${fmt(item.minPrice)}` : locale.startsWith('en') ? `from ${fmt(item.minPrice)}` : `dès ${fmt(item.minPrice)}`;
  }
  return fmt(item.minPrice);
}
