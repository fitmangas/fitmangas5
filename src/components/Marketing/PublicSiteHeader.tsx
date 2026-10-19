'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CircleUserRound, Menu, X } from 'lucide-react';

import { publicNavItems } from '@/lib/marketing/public-nav';
import { isGiftsEnabled } from '@/lib/gifts/flag';

type Props = {
  lang: 'FR' | 'ES';
  onToggleLang?: (next: 'FR' | 'ES') => void;
  onLogin?: () => void;
  onTrial?: () => void;
  homeHref?: string;
};

export function PublicSiteHeader({ lang, onToggleLang, onLogin, onTrial, homeHref = '/' }: Props) {
  const [open, setOpen] = useState(false);
  const items = publicNavItems({ gifts: isGiftsEnabled() });
  const isEs = lang === 'ES';

  return (
    <header className="sticky top-0 z-50 border-b border-brand-ink/[0.05] bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center gap-6 px-5 md:px-8">
        <Link href={homeHref} className="flex shrink-0 items-center gap-2.5">
          <Image src="/logo.png" alt="FitMangas" width={36} height={36} className="h-9 w-9 object-contain" />
          <span className="fm-display text-[21px] text-brand-ink">FitMangas</span>
        </Link>
        <nav className="relative hidden flex-1 items-center justify-center gap-7 text-[13px] font-medium text-brand-ink/70 lg:flex" aria-label="Menu principal">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="relative py-1 hover:text-brand-ink">
              {isEs ? item.labelEs : item.labelFr}
              {item.badge ? (
                <span className="ml-1.5 rounded-full bg-[#fbf1ec] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-luxury-orange">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          {onToggleLang ? (
            <div className="hidden items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] md:flex">
              <button type="button" onClick={() => onToggleLang('FR')} className={lang === 'FR' ? 'border-b border-[#F5C58D] pb-0.5 text-brand-accent' : 'text-brand-ink/30'}>
                FR
              </button>
              <button type="button" onClick={() => onToggleLang('ES')} className={lang === 'ES' ? 'border-b border-[#F5C58D] pb-0.5 text-brand-accent' : 'text-brand-ink/30'}>
                ES
              </button>
            </div>
          ) : null}
          {onLogin ? (
            <button
              type="button"
              onClick={onLogin}
              className="hidden items-center gap-1.5 rounded-full border border-brand-ink/15 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/75 md:inline-flex"
            >
              <CircleUserRound size={14} />
              {isEs ? 'Conexión' : 'Connexion'}
            </button>
          ) : (
            <Link
              href="/connexion"
              className="hidden items-center gap-1.5 rounded-full border border-brand-ink/15 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/75 md:inline-flex"
            >
              <CircleUserRound size={14} />
              {isEs ? 'Conexión' : 'Connexion'}
            </Link>
          )}
          {onTrial ? (
            <button type="button" onClick={onTrial} className="btn-luxury-primary !px-4 !py-2.5 !text-[10px] md:!px-5">
              {isEs ? 'Prueba gratis' : 'Essai gratuit'}
            </button>
          ) : (
            <Link href="/?offer=v-coll" className="btn-luxury-primary !px-4 !py-2.5 !text-[10px] md:!px-5">
              {isEs ? 'Prueba gratis' : 'Essai gratuit'}
            </Link>
          )}
          <button type="button" aria-label="Menu" className="flex h-10 w-10 items-center justify-center rounded-full text-brand-ink lg:hidden" onClick={() => setOpen((v) => !v)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-brand-ink/[0.06] bg-white px-5 py-4 lg:hidden">
          <nav className="flex flex-col gap-3 text-[15px] font-medium text-brand-ink/80">
            {items.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {isEs ? item.labelEs : item.labelFr}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
