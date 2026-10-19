'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Bell, BookOpen, Brain, CalendarDays, Gift, House, LayoutGrid, Route, ShoppingBag, UserRound, Video } from 'lucide-react';

import type { ClientLang } from '@/lib/compte/i18n';
import { compteNavLabels } from '@/lib/compte/i18n';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { isGiftsEnabled } from '@/lib/gifts/flag';

const TITLE_BY_PATH: Array<{ test: (p: string) => boolean; key: keyof (typeof compteNavLabels)['fr'] }> = [
  { test: (p) => p === '/compte', key: 'home' },
  { test: (p) => p.startsWith('/compte/planning'), key: 'planning' },
  { test: (p) => p.startsWith('/compte/programmes'), key: 'programmes' },
  { test: (p) => p.startsWith('/compte/replays'), key: 'videos' },
  { test: (p) => p.startsWith('/compte/blog') || p.startsWith('/blog'), key: 'blog' },
  { test: (p) => p.startsWith('/compte/connaissance-de-soi'), key: 'selfKnowledge' },
  { test: (p) => p.startsWith('/compte/boutique'), key: 'shop' },
  { test: (p) => p.startsWith('/compte/notifications'), key: 'notifications' },
  { test: (p) => p.startsWith('/compte/parrainage'), key: 'referral' },
  { test: (p) => p.startsWith('/compte/profil') || p.startsWith('/compte/preferences'), key: 'profile' },
];

export function CompteMobileBottomNav({ lang = 'fr', unreadNotifications = 0 }: { lang?: ClientLang; unreadNotifications?: number }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const labels = compteNavLabels[lang];
  const programmesOn = isProgrammesEnabled();
  const giftsOn = isGiftsEnabled();

  const title = useMemo(() => {
    const hit = TITLE_BY_PATH.find((row) => row.test(pathname));
    return hit ? labels[hit.key] : labels.home;
  }, [pathname, labels]);

  const tabs = [
    { href: '/compte', key: 'home' as const, icon: House, show: true },
    { href: '/compte/planning', key: 'planning' as const, icon: CalendarDays, show: true },
    { href: '/compte/programmes', key: 'programmes' as const, icon: Route, show: programmesOn },
    { href: '/compte/replays', key: 'videos' as const, icon: Video, show: true },
    { href: '/compte/blog', key: 'blog' as const, icon: BookOpen, show: !programmesOn },
  ].filter((t) => t.show);

  const moreItems = [
    { href: '/compte/notifications', key: 'notifications' as const, icon: Bell },
    { href: '/compte/blog', key: 'blog' as const, icon: BookOpen },
    { href: '/compte/connaissance-de-soi', key: 'selfKnowledge' as const, icon: Brain },
    { href: '/compte/boutique', key: 'shop' as const, icon: ShoppingBag },
    { href: '/compte/parrainage', key: 'referral' as const, icon: Gift },
    ...(giftsOn ? [{ href: '/offrir', key: 'gifts' as const, icon: Gift }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-50 px-3 pb-2 pt-[calc(env(safe-area-inset-top)+0.75rem)] md:hidden">
        <div className="flex h-14 items-center justify-between gap-3 rounded-full border border-white/60 bg-white/70 pl-2 pr-2 shadow-[0_10px_28px_rgba(15,23,42,0.10)] backdrop-blur-xl">
          <Link href="/compte" className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/70 bg-white/90 shadow-sm">
            <Image src="/logo.png" alt="FitMangas" width={24} height={24} className="h-6 w-6 object-contain" />
          </Link>
          <p className="min-w-0 flex-1 truncate text-center text-[15px] font-semibold tracking-tight text-luxury-ink">{title}</p>
          <Link href="/compte/notifications" aria-label={labels.notifications} className="relative flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-luxury-ink">
            <Bell size={21} />
            {unreadNotifications > 0 ? (
              <span className="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            ) : null}
          </Link>
          <Link href="/compte/profil" aria-label={labels.profile} className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#e8c99a,#c45d3e)] text-[14px] font-semibold text-white ring-2 ring-white">
            {labels.home.slice(0, 1)}
          </Link>
        </div>
      </header>

      {moreOpen ? (
        <>
          <button type="button" className="fixed inset-x-0 top-0 bottom-[92px] z-[60] bg-[rgba(29,26,23,0.35)] backdrop-blur-[3px] md:hidden" aria-label="Fermer" onClick={() => setMoreOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label={labels.more} className="fixed inset-x-3 bottom-[96px] z-[70] rounded-[2rem] bg-cream px-4 pb-4 pt-3 shadow-[0_-20px_60px_rgba(29,26,23,0.25)] md:hidden">
            <span className="mx-auto block h-1 w-10 rounded-full bg-black/15" />
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#e8c99a,#c45d3e)] text-[16px] font-semibold text-white">·</span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-luxury-ink">{labels.profile}</p>
              </div>
              <Link href="/compte/profil" className="min-h-[44px] text-[11px] font-semibold uppercase tracking-[0.14em] text-luxury-orange" onClick={() => setMoreOpen(false)}>
                {labels.profile}
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="relative flex min-h-[44px] flex-col items-center gap-2 rounded-2xl bg-white px-2 py-4 text-center shadow-[0_6px_16px_rgba(31,27,22,0.06)]"
                  >
                    <Icon size={22} strokeWidth={1.8} />
                    <span className="text-[12px] font-medium leading-tight text-luxury-ink">{labels[item.key]}</span>
                    {item.key === 'notifications' && unreadNotifications > 0 ? (
                      <span className="absolute right-3 top-2.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[10px] font-bold text-white">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      <nav className="fm-tabbar fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-[1.6rem] px-1 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 md:hidden" aria-label="Navigation principale">
        {tabs.map(({ href, key, icon: Icon }) => {
          const active = href === '/compte' ? pathname === '/compte' : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} className={`relative flex min-h-[44px] flex-col items-center gap-1 rounded-2xl py-1 ${active ? 'text-luxury-ink' : 'text-luxury-muted'}`}>
              {active ? <span className="absolute -top-2 h-[3px] w-6 rounded-full bg-luxury-orange" /> : null}
              <Icon size={22} strokeWidth={1.8} className={active ? 'text-luxury-orange' : undefined} />
              <span className="text-[10px] font-semibold tracking-[0.02em]">{labels[key]}</span>
            </Link>
          );
        })}
        <button type="button" onClick={() => setMoreOpen((v) => !v)} className={`relative flex min-h-[44px] flex-col items-center gap-1 rounded-2xl py-1 ${moreOpen ? 'text-luxury-ink' : 'text-luxury-muted'}`}>
          {moreOpen ? <span className="absolute -top-2 h-[3px] w-6 rounded-full bg-luxury-orange" /> : null}
          <LayoutGrid size={22} strokeWidth={2} className={moreOpen ? 'text-luxury-orange' : undefined} />
          <span className="text-[10px] font-semibold tracking-[0.02em]">{labels.more}</span>
        </button>
      </nav>
    </>
  );
}
