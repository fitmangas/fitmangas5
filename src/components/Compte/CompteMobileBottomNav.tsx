'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, BookOpen, CalendarDays, Gift, ShoppingBag, UserRound, Video } from 'lucide-react';

import type { ClientLang } from '@/lib/compte/i18n';
import { compteNavLabels } from '@/lib/compte/i18n';

const links = [
  { href: '/compte/planning', key: 'planning', icon: CalendarDays },
  { href: '/compte/blog', key: 'blog', icon: BookOpen },
  { href: '/compte/replays', key: 'videos', icon: Video },
  { href: '/compte/boutique', key: 'shop', icon: ShoppingBag },
  { href: '/compte/notifications', key: 'notifications', icon: Bell },
  { href: '/compte/parrainage', key: 'referral', icon: Gift },
  { href: '/compte/profil', key: 'profile', icon: UserRound },
] as const;

type NavKey = (typeof links)[number]['key'];

export function CompteMobileBottomNav({ lang = 'fr', unreadNotifications = 0 }: { lang?: ClientLang; unreadNotifications?: number }) {
  const pathname = usePathname();
  const [hash, setHash] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const labels = compteNavLabels[lang];

  useEffect(() => {
    const readHash = () => setHash(window.location.hash || '');
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 overflow-hidden px-3 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-300 md:hidden ${
        scrolled
          ? 'border-b border-white/30 bg-white/85 shadow-[0_4px_24px_rgba(15,23,42,0.08)]'
          : 'border-b border-white/20 bg-white/70'
      }`}
      aria-label="Navigation mobile"
    >
      <div className="grid grid-cols-8 gap-0.5 rounded-[1.45rem] border border-white/40 bg-white/55 px-1.5 py-2 backdrop-blur-md transition-colors duration-300">
        <Link
          href="/compte"
          aria-label={labels.dashboard}
          title={labels.dashboard}
          className={`mx-auto flex h-10 w-full max-w-[2.75rem] items-center justify-center rounded-full border border-white/60 bg-white/80 shadow-sm ${
            pathname === '/compte' && !hash ? 'ring-2 ring-orange-300/70' : ''
          }`}
        >
          <Image
            src="/logo.png"
            alt="FitMangas"
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
          />
        </Link>
        {links.map(({ href, key, icon: Icon }) => {
          const basePath = href.split('#')[0];
          const hrefHash = href.includes('#') ? `#${href.split('#')[1]}` : '';
          const active =
            hrefHash
              ? pathname === '/compte' && hash === hrefHash
              : pathname === basePath || pathname.startsWith(`${basePath}/`);
          const label = labels[key as NavKey];
          const badge =
            key === 'notifications' && unreadNotifications > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            ) : null;

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className={`relative mx-auto flex h-10 w-full max-w-[2.75rem] items-center justify-center rounded-2xl transition ${
                active ? 'bg-luxury-ink text-white shadow-md' : 'text-luxury-muted hover:bg-white/70 hover:text-luxury-ink'
              }`}
            >
              <Icon size={20} strokeWidth={2} aria-hidden />
              {badge}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
