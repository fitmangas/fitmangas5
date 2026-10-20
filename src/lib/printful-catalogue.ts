import { unstable_cache } from 'next/cache';

import { slugifyProductName } from '@/lib/marketing/public-nav';
import { getPrintfulProductDetail, getPrintfulProducts, mapProductImage, type PrintfulProduct } from '@/lib/printful';
import { sortPrintfulProducts } from '@/lib/printful-product-order';
import { boutiqueCategoryFor, type BoutiqueCategory } from '@/lib/boutique-format';

export { formatBoutiquePrice, type BoutiqueCategory } from '@/lib/boutique-format';

/**
 * Catalogue boutique avec les prix de vente Printful (D02).
 * La liste Printful (/store/products) ne contient AUCUN prix : il faut lire le détail de chaque produit
 * (/store/products/{id}, prix des variantes). Résultat mis en cache 1 h (limite d'appels Printful).
 * Produits sans prix : masqués (SPEC D02) — sauf si AUCUN prix n'a pu être lu (Printful partiellement en panne) :
 * on montre alors le catalogue sans prix plutôt qu'une boutique vide.
 */

export type BoutiqueItem = {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  currency: string;
  category: BoutiqueCategory;
};

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next;
      next += 1;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

async function buildCatalogue(): Promise<BoutiqueItem[]> {
  const products = (await sortPrintfulProducts(await getPrintfulProducts())).filter((p: PrintfulProduct) => !p.is_ignored);
  const details = await mapLimit(products, 4, (p) => getPrintfulProductDetail(p.id).catch(() => null));
  const items: BoutiqueItem[] = products.map((p, i) => {
    const variants = (details[i]?.variants ?? []).filter((v) => v.availability !== 'discontinued');
    const prices = variants.map((v) => v.retailPrice).filter((n) => Number.isFinite(n) && n > 0);
    return {
      id: p.id,
      name: p.name,
      slug: slugifyProductName(p.name, p.id),
      image: mapProductImage(p),
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
      currency: variants[0]?.currency || 'EUR',
      category: boutiqueCategoryFor(p.name),
    };
  });
  const priced = items.filter((item) => item.minPrice != null);
  return priced.length > 0 ? priced : items;
}

export const getBoutiqueCatalogue = unstable_cache(buildCatalogue, ['printful-boutique-catalogue-v1'], {
  revalidate: 3600,
  tags: ['printful-catalogue'],
});
