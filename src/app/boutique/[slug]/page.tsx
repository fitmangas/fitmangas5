import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PublicSiteHeader } from '@/components/Marketing/PublicSiteHeader';
import { slugifyProductName } from '@/lib/marketing/public-nav';
import { getPrintfulProductDetail, getPrintfulProducts, mapProductImage } from '@/lib/printful';
import { sortPrintfulProducts } from '@/lib/printful-product-order';

export const dynamic = 'force-dynamic';

function formatPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

export default async function BoutiqueProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let products: Awaited<ReturnType<typeof getPrintfulProducts>> = [];
  try {
    products = await sortPrintfulProducts(await getPrintfulProducts());
  } catch {
    notFound();
  }
  const product = products.find((p) => slugifyProductName(p.name, p.id) === slug);
  if (!product) notFound();
  const detail = await getPrintfulProductDetail(product.id).catch(() => null);
  const image = mapProductImage(product);
  const price = Number((product as unknown as { retail_price?: string }).retail_price ?? 0);
  if (!price) notFound();

  return (
    <>
      <PublicSiteHeader lang="FR" />
      <main className="mx-auto max-w-4xl px-6 pb-20 pt-10">
        <Link href="/boutique" className="text-[13px] font-semibold text-luxury-orange">
          ← Boutique
        </Link>
        <div className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow-[0_14px_36px_-18px_rgba(29,26,23,0.2)]">
          <div className="relative aspect-[4/3] bg-[#f8f3ee]">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={product.name} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="p-6 md:p-10">
            <h1 className="font-serif text-3xl text-luxury-ink">{detail?.name ?? product.name}</h1>
            <p className="mt-4 text-2xl font-semibold text-luxury-ink">{formatPrice(price)}</p>
            <Link href="/compte/boutique" className="btn-luxury-primary mt-8 inline-flex px-6 py-3 text-[11px]">
              Commander depuis l’espace cliente
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
