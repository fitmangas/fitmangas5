import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PublicSiteHeader } from '@/components/Marketing/PublicSiteHeader';
import { getPrintfulProductDetail } from '@/lib/printful';
import { formatBoutiquePrice, getBoutiqueCatalogue, type BoutiqueItem } from '@/lib/printful-catalogue';

export const revalidate = 3600;

async function findProduct(slug: string): Promise<BoutiqueItem | null> {
  try {
    const products = await getBoutiqueCatalogue();
    return products.find((p) => p.slug === slug) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) return { title: { absolute: 'Boutique FitMangas' } };
  const price = formatBoutiquePrice(product);
  return {
    title: { absolute: `${product.name} — Boutique FitMangas` },
    description: `${product.name}${price ? ` · ${price}` : ''}. Fabriqué à la demande et livré chez toi.`,
    alternates: { canonical: `/boutique/${product.slug}` },
    openGraph: product.image ? { images: [product.image] } : undefined,
  };
}

export default async function BoutiqueProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) notFound();
  const detail = await getPrintfulProductDetail(product.id).catch(() => null);
  const price = formatBoutiquePrice(product);
  const gallery = [product.image, ...(detail?.galleryUrls ?? [])]
    .filter((u): u is string => Boolean(u))
    .filter((u, i, arr) => arr.indexOf(u) === i)
    .slice(0, 4);
  const sizes = (detail?.variants ?? [])
    .filter((v) => v.availability !== 'discontinued')
    .map((v) => v.name.split(' / ').pop() ?? v.name)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 12);

  return (
    <>
      <PublicSiteHeader lang="FR" />
      <main className="mx-auto max-w-5xl px-5 pb-20 pt-10 md:px-8">
        <Link href="/boutique" className="text-[13px] font-semibold text-luxury-orange">
          ← La boutique
        </Link>
        <div className="mt-6 grid gap-6 overflow-hidden rounded-[2rem] bg-white p-4 shadow-[0_14px_36px_-18px_rgba(29,26,23,0.2)] md:grid-cols-[1.1fr_0.9fr] md:p-6">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-[1.4rem] bg-[#efe6dc]">
              {gallery[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={gallery[0]} alt={product.name} className="h-full w-full object-cover" />
              ) : null}
            </div>
            {gallery.length > 1 ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {gallery.slice(1).map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="" loading="lazy" className="aspect-square w-full rounded-xl bg-[#efe6dc] object-cover" />
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col p-2 md:p-4">
            <p className="fm-kicker">Boutique FitMangas</p>
            <h1 className="fm-display mt-3 text-[2.2rem] leading-[1.08] text-brand-ink">{detail?.name ?? product.name}</h1>
            {price ? <p className="mt-4 text-[1.6rem] font-semibold text-luxury-ink">{price}</p> : null}
            {sizes.length > 1 ? (
              <div className="mt-5">
                <p className="text-[12px] font-semibold text-luxury-ink">Disponible en</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <span key={size} className="rounded-full bg-[#faf7f3] px-3 py-1.5 text-[12px] text-luxury-ink ring-1 ring-black/5">
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <p className="mt-5 text-[14px] leading-relaxed text-luxury-muted">
              Fabriqué à la demande et livré chez toi. La commande se fait depuis ton espace cliente.
            </p>
            <Link href="/compte/boutique" className="btn-luxury-primary mt-8 inline-flex justify-center px-6 py-3.5 text-[11px]">
              Commander depuis mon espace
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
