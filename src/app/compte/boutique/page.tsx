import Link from 'next/link';

import { BoutiqueOrderComposer } from '@/components/Compte/BoutiqueOrderComposer';
import { GlassCard } from '@/components/ui/GlassCard';
import { getClientLang } from '@/lib/compte/i18n';
import { sortPrintfulProducts } from '@/lib/printful-product-order';
import { getPrintfulOrders, getPrintfulProducts, mapProductImage } from '@/lib/printful';
import { createClient } from '@/lib/supabase/server';

const ACTIVE_ORDER_STATUSES = new Set(['pending', 'draft', 'inprocess', 'onhold', 'fulfilled', 'partial']);

export default async function CompteBoutiquePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const lang = await getClientLang(supabase, user.id);
  const t =
    lang === 'en'
      ? {
          title: 'FitMangas Shop',
          inProgress: 'In progress',
          orders: 'My orders',
          seeTracking: 'See tracking',
          seeHistory: 'See history',
          noProducts: 'No products returned by Printful. Check PRINTFUL_API_TOKEN / PRINTFUL_STORE_ID then refresh.',
        }
      : lang === 'es'
        ? {
            title: 'Tienda FitMangas',
            inProgress: 'En curso',
            orders: 'Mis pedidos',
            seeTracking: 'Ver seguimiento',
            seeHistory: 'Ver historial',
            noProducts: 'Printful no devolvió productos. Verifica PRINTFUL_API_TOKEN / PRINTFUL_STORE_ID y recarga.',
          }
        : {
            title: 'Boutique FitMangas',
            inProgress: 'En cours',
            orders: 'Mes commandes',
            seeTracking: 'Voir le suivi',
            seeHistory: 'Voir l’historique',
            noProducts: 'Aucun produit n’est remonté par Printful. Vérifie PRINTFUL_API_TOKEN / PRINTFUL_STORE_ID puis recharge la page.',
          };

  const [productsRaw, orders] = await Promise.all([
    getPrintfulProducts().catch(() => []),
    getPrintfulOrders(80).catch(() => []),
  ]);
  const products = await sortPrintfulProducts(productsRaw);

  const email = user.email?.toLowerCase() ?? '';
  const myOrders = orders.filter((o) => {
    const recipientEmail = o.recipient?.email?.toLowerCase() ?? o.packing_slip?.email?.toLowerCase() ?? '';
    return recipientEmail && recipientEmail === email;
  });
  const myInProgress = myOrders.filter((o) => ACTIVE_ORDER_STATUSES.has((o.status ?? '').toLowerCase()));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-5 pb-16 pt-3 md:px-8">
      <section className="flex flex-wrap justify-center gap-3">
        <Link
          href="/compte/boutique/en-cours"
          className="rounded-full border border-black/8 bg-white/65 px-5 py-3 text-center shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-luxury-orange/35 hover:bg-white/85"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">{t.inProgress}</span>
          <span className="ml-2 rounded-full bg-luxury-ink/8 px-2 py-0.5 text-xs font-semibold text-luxury-ink">{myInProgress.length}</span>
        </Link>
        <Link
          href="/compte/boutique/commandes"
          className="rounded-full border border-black/8 bg-white/65 px-5 py-3 text-center shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-luxury-orange/35 hover:bg-white/85"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">{t.orders}</span>
          <span className="ml-2 rounded-full bg-luxury-ink/8 px-2 py-0.5 text-xs font-semibold text-luxury-ink">{myOrders.length}</span>
        </Link>
      </section>

      {products.length === 0 ? (
        <GlassCard className="p-5 text-sm text-luxury-muted">
          {t.noProducts}
        </GlassCard>
      ) : (
        <BoutiqueOrderComposer
          lang={lang}
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            image: mapProductImage(p),
          }))}
        />
      )}
    </div>
  );
}
