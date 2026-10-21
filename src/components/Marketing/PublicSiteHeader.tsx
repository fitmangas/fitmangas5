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
  /** Lien du menu à souligner (page en cours). */
  activeHref?: string;
};

export function PublicSiteHeader({ lang, onToggleLang, onLogin, onTrial, homeHref = '/', activeHref }: Props) {
  const [open, setOpen] = useState(false);
  const items = publicNavItems({ gifts: isGiftsEnabled() });
  const isEs = lang === 'ES';
  const loginLabel = isEs ? 'Conexión' : 'Connexion';
  // Téléphone : bouton rond (icône seule), visible sans ouvrir le menu ; le bouton texte prend le relais dès la tablette.
  // Sur téléphone, l'en-tête est resserré (espaces, logo, bouton d'essai) pour que tout tienne dès 360 px de large.
  const loginIconClass =
    'flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-brand-ink/15 bg-white text-brand-ink/75 md:hidden';
  const loginMenuClass =
    'mt-4 inline-flex items-center gap-2 rounded-full border border-brand-ink/15 bg-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-ink/80';

  return (
    <header className="sticky top-0 z-50 border-b border-brand-ink/[0.05] bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center gap-2 px-5 md:gap-6 md:px-8">
        <Link href={homeHref} className="flex shrink-0 items-center gap-2 md:gap-2.5">
          <Image src="/logo.png" alt="FitMangas" width={36} height={36} className="h-8 w-8 object-contain md:h-9 md:w-9" />
          <span className="fm-display text-[clamp(15px,4.4vw,21px)] text-brand-ink md:text-[21px]">FitMangas</span>
        </Link>
        <nav className="relative hidden flex-1 items-center justify-center gap-7 text-[13px] font-medium text-brand-ink/70 lg:flex" aria-label="Menu principal">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={activeHref === item.href ? 'page' : undefined}
              className={`relative py-1 hover:text-brand-ink ${
                activeHref === item.href ? 'text-brand-ink after:absolute after:inset-x-0 after:-bottom-1.5 after:h-[2px] after:rounded-full after:bg-luxury-orange' : ''
              }`}
            >
              {isEs ? item.labelEs : item.labelFr}
              {item.badge ? (
                <span className="ml-1.5 rounded-full bg-[#fbf1ec] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-luxury-orange">
                  {isEs ? (item.badgeEs ?? item.badge) : item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 md:gap-3 lg:ml-0">
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
            <button type="button" onClick={onLogin} aria-label={loginLabel} title={loginLabel} className={loginIconClass}>
              <CircleUserRound size={18} />
            </button>
          ) : (
            <Link href="/connexion" aria-label={loginLabel} title={loginLabel} className={loginIconClass}>
              <CircleUserRound size={18} />
            </Link>
          )}
          {onLogin ? (
            <button
              type="button"
              onClick={onLogin}
              className="hidden items-center gap-1.5 rounded-full border border-brand-ink/15 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/75 md:inline-flex"
            >
              <CircleUserRound size={14} />
              {loginLabel}
            </button>
          ) : (
            <Link
              href="/connexion"
              className="hidden items-center gap-1.5 rounded-full border border-brand-ink/15 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/75 md:inline-flex"
            >
              <CircleUserRound size={14} />
              {loginLabel}
            </Link>
          )}
          {onTrial ? (
            <button type="button" onClick={onTrial} className="btn-luxury-primary shrink-0 !px-3 !py-2.5 !text-[10px] !tracking-[0.1em] md:!px-5 md:!tracking-[0.18em]">
              {isEs ? 'Prueba gratis' : 'Essai gratuit'}
            </button>
          ) : (
            <Link href="/?offer=v-coll" className="btn-luxury-primary shrink-0 !px-3 !py-2.5 !text-[10px] !tracking-[0.1em] md:!px-5 md:!tracking-[0.18em]">
              {isEs ? 'Prueba gratis' : 'Essai gratuit'}
            </Link>
          )}
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-brand-ink md:h-10 md:w-10 lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
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
          <div className="mt-4 border-t border-brand-ink/[0.06]">
            {onLogin ? (
              <button
                type="button"
                className={loginMenuClass}
                onClick={() => {
                  setOpen(false);
                  onLogin();
                }}
              >
                <CircleUserRound size={16} />
                {isEs ? 'Entrar a mi espacio' : 'Connexion à mon espace'}
              </button>
            ) : (
              <Link href="/connexion" className={loginMenuClass} onClick={() => setOpen(false)}>
                <CircleUserRound size={16} />
                {isEs ? 'Entrar a mi espacio' : 'Connexion à mon espace'}
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
