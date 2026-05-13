import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { AdminViewSwitch } from '@/components/Admin/AdminViewSwitch';
import { CompteSidebar } from '@/components/Compte/CompteSidebar';
import { compteNavLabels, getClientLang } from '@/lib/compte/i18n';
import { createClient } from '@/lib/supabase/server';

export default async function BlogLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const lang = user ? await getClientLang(supabase, user.id) : 'fr';
  const labels = compteNavLabels[lang];
  const a11y =
    lang === 'es'
      ? { shop: 'Abrir la tienda', shopLogo: 'Logo tienda FitMangas' }
      : { shop: 'Ouvrir la boutique', shopLogo: 'Logo boutique FitMangas' };

  return (
    <div className="luxury-shell relative min-h-screen" lang={lang}>
      <div className="luxury-bg-orbs" aria-hidden />
      <div className="luxury-grain" aria-hidden />
      <div className="relative z-10">
        {user ? (
          <>
            <CompteSidebar lang={lang} />
            <AdminViewSwitch />
            <nav className="mx-4 mb-4 mt-4 md:hidden">
              <div className="glass-card flex flex-wrap gap-3 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-luxury-muted">
                <Link
                  href="/compte/boutique"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/70 shadow-[0_6px_14px_rgba(15,23,42,0.1)]"
                  aria-label={a11y.shop}
                >
                  <Image
                    src="/Spreadshop Logo (1800 x 1800 px)-2.png"
                    alt={a11y.shopLogo}
                    width={22}
                    height={22}
                    className="h-[22px] w-[22px] object-contain"
                  />
                </Link>
                <Link href="/compte" className="rounded-full px-3 py-1.5 hover:bg-white/40 hover:text-luxury-ink">
                  {labels.dashboard}
                </Link>
                <Link href="/compte#planning" className="rounded-full px-3 py-1.5 hover:bg-white/40 hover:text-luxury-ink">
                  {labels.planning}
                </Link>
                <Link href="/compte/blog" className="rounded-full px-3 py-1.5 hover:bg-white/40 hover:text-luxury-ink">
                  {labels.blog}
                </Link>
                <Link href="/compte/replays" className="rounded-full px-3 py-1.5 hover:bg-white/40 hover:text-luxury-ink">
                  {labels.videos}
                </Link>
                <Link href="/compte/profil" className="rounded-full px-3 py-1.5 hover:bg-white/40 hover:text-luxury-ink">
                  {labels.profile}
                </Link>
              </div>
            </nav>
          </>
        ) : null}
        <div className={user ? 'px-4 pb-16 md:pl-24' : ''}>{children}</div>
      </div>
    </div>
  );
}
