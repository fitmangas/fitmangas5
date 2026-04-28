import Link from 'next/link';

import { getPrintfulProducts, mapProductImage } from '@/lib/printful';

function formatPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return 'Prix sur demande';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

export default async function BoutiquePage() {
  const products = await getPrintfulProducts().catch(() => []);

  return (
    <main className="mx-auto max-w-7xl px-6 pb-20 pt-10 md:px-10">
      <header className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">FitMangas Boutique</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-luxury-ink md:text-5xl">
          Boutique Pilates x Manga
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-luxury-muted md:text-base">
          Découvre les produits officiels FitMangas. Sélectionne ton article, puis passe commande depuis ton espace client.
        </p>
      </header>

      {products.length === 0 ? (
        <div className="rounded-3xl border border-white/40 bg-white/55 p-10 text-center text-luxury-muted shadow-sm backdrop-blur">
          Aucun produit synchronisé pour le moment.
        </div>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const image = mapProductImage(product);
            const price = Number((product as unknown as { retail_price?: string }).retail_price ?? 0);
            return (
              <article
                key={product.id}
                className="group overflow-hidden rounded-3xl border border-white/45 bg-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.14)]"
              >
                <div className="relative aspect-[4/3] bg-gradient-to-br from-[#f8f3ee] via-white to-[#f1ede8]">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-medium text-luxury-soft">
                      Mockup indisponible
                    </div>
                  )}
                </div>
                <div className="space-y-4 p-5">
                  <h2 className="line-clamp-2 text-lg font-semibold tracking-tight text-luxury-ink">{product.name}</h2>
                  <p className="text-sm font-medium text-luxury-muted">{formatPrice(price)}</p>
                  <Link
                    href="/compte/boutique"
                    className="inline-flex items-center justify-center rounded-full border border-luxury-orange/35 bg-luxury-orange px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:brightness-95"
                  >
                    Voir le produit
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
