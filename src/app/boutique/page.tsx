import type { Metadata } from 'next';
import Link from 'next/link';

import { PublicSiteHeader } from '@/components/Marketing/PublicSiteHeader';
import { formatBoutiquePrice, getBoutiqueCatalogue, type BoutiqueItem } from '@/lib/printful-catalogue';

/** Catalogue en cache 1 h (prix lus dans le détail Printful) : la page peut être régénérée toutes les heures. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Boutique FitMangas — tapis, tenues et accessoires de Pilates',
  description: 'Les pièces FitMangas pour bouger : fabriquées à la demande, livrées chez toi. Commande depuis ton espace cliente.',
  alternates: { canonical: '/boutique' },
};

const CATEGORY_LABEL: Record<BoutiqueItem['category'], string> = {
  bouger: 'Pour bouger',
  accessoires: 'Accessoires',
  quotidien: 'Au quotidien',
};

export default async function BoutiquePage() {
  let catalogueUnavailable = false;
  let products: BoutiqueItem[] = [];
  try {
    products = await getBoutiqueCatalogue();
  } catch (e) {
    console.error('[boutique] Printful catalogue indisponible', e);
    catalogueUnavailable = true;
  }

  return (
    <>
      <PublicSiteHeader lang="FR" />
      <main className="mx-auto max-w-6xl px-5 pb-20 pt-10 md:px-8">
        <header className="mb-8 px-1">
          <p className="fm-kicker">Boutique FitMangas</p>
          <h1 className="fm-display mt-2 text-[2.6rem] leading-[1.05] text-brand-ink md:text-[3.6rem]">La boutique</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-luxury-muted">
            Des pièces pensées pour bouger, fabriquées à la demande et livrées chez toi. Tu commandes depuis ton espace cliente.
          </p>
        </header>

        {catalogueUnavailable ? (
          <div className="rounded-3xl border border-red-200 bg-red-50/80 p-10 text-center text-red-800 shadow-sm">
            Catalogue indisponible — Printful ne répond pas. Réessaie plus tard.
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl bg-white/70 p-10 text-center text-luxury-muted shadow-sm">Aucun produit pour le moment.</div>
        ) : (
          <section className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {products.map((product) => {
              const price = formatBoutiquePrice(product);
              return (
                <Link
                  key={product.id}
                  href={`/boutique/${product.slug}`}
                  className="group flex flex-col overflow-hidden rounded-[1.6rem] bg-white shadow-[0_14px_34px_-20px_rgba(29,26,23,0.32)] transition duration-200 hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[4/4.1] overflow-hidden bg-[#efe6dc]">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[12px] text-luxury-soft">Image indisponible</div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="line-clamp-2 text-[14px] font-semibold leading-snug text-luxury-ink">{product.name}</h2>
                    <p className="mt-0.5 text-[12px] text-luxury-muted">{CATEGORY_LABEL[product.category]}</p>
                    {price ? <p className="mt-auto pt-3 text-[15px] font-bold text-luxury-ink">{price}</p> : null}
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </main>
    </>
  );
}
