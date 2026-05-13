'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BookOpen, CalendarDays, Flame, Settings, ShoppingBag, UserRound, Video } from 'lucide-react';

import type { ClientLang } from '@/lib/compte/i18n';
import { compteNavLabels } from '@/lib/compte/i18n';

const links = [
  { href: '/compte#planning', key: 'planning', icon: CalendarDays },
  { href: '/compte/blog', key: 'blog', icon: BookOpen },
  { href: '/compte/replays', key: 'videos', icon: Video },
  { href: '/compte/boutique', key: 'shop', icon: ShoppingBag },
  { href: '/compte/profil', key: 'profile', icon: UserRound },
  { href: '/compte/preferences', key: 'preferences', icon: Settings },
] as const;

type NavKey = (typeof links)[number]['key'];

export function CompteMobileBottomNav({ lang = 'fr' }: { lang?: ClientLang }) {
  const pathname = usePathname();
  const [hash, setHash] = useState('');
  const labels = compteNavLabels[lang];

  useEffect(() => {
    const readHash = () => setHash(window.location.hash || '');
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, []);

  return (
    <nav className="fixed inset-x-3 bottom-3 z-[210] md:hidden" aria-label="Navigation mobile">
      <div className="flex items-center justify-between gap-1 rounded-[1.6rem] border border-white/70 bg-white/88 px-2 py-2 shadow-[0_18px_45px_rgba(15,23,42,0.2)] backdrop-blur-xl">
        <Link
          href="/compte"
          aria-label={labels.dashboard}
          title={labels.dashboard}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/80 shadow-sm ${
            pathname === '/compte' && !hash ? 'ring-2 ring-orange-300/70' : ''
          }`}
        >
          <Flame size={22} strokeWidth={2} aria-hidden />
        </Link>
        {links.map(({ href, key, icon: Icon }) => {
          const basePath = href.split('#')[0];
          const hrefHash = href.includes('#') ? `#${href.split('#')[1]}` : '';
          const active =
            hrefHash
              ? pathname === '/compte' && hash === hrefHash
              : pathname === basePath || pathname.startsWith(`${basePath}/`);
          const label = labels[key as NavKey];
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className={`flex h-11 w-10 items-center justify-center rounded-2xl transition ${
                active ? 'bg-luxury-ink text-white shadow-md' : 'text-luxury-muted hover:bg-white/70 hover:text-luxury-ink'
              }`}
            >
              <Icon size={21} strokeWidth={2} aria-hidden />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
