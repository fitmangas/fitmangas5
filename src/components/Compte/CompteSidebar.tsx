'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clapperboard, ShoppingBag, UserRound, Video } from 'lucide-react';

import type { ClientLang } from '@/lib/compte/i18n';
import { compteNavLabels } from '@/lib/compte/i18n';

const links = [
  { href: '/compte#planning', key: 'planning', icon: Clapperboard },
  { href: '/compte/replays', key: 'videos', icon: Video, exact: true },
  { href: '/compte/boutique', key: 'shop', icon: ShoppingBag, exact: true },
  { href: '/compte/profil', key: 'profile', icon: UserRound, exact: true },
] as const;

type NavKey = (typeof links)[number]['key'];

export function CompteSidebar({ lang = 'fr' }: { lang?: ClientLang }) {
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
    <aside className="luxury-floating-rail fixed left-4 top-1/2 z-[100] hidden -translate-y-1/2 flex-col gap-2 rounded-full p-2 md:flex">
      <Link
        href="/compte"
        title={labels.dashboard}
        className={`relative flex h-12 w-12 items-center justify-center rounded-full border border-white/55 bg-white/72 shadow-[0_8px_20px_rgba(15,23,42,0.12)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.16)] ${
          pathname === '/compte' && !hash ? 'ring-2 ring-orange-300/70' : ''
        }`}
      >
        <Image
          src="/Spreadshop Logo (1800 x 1800 px)-2.png"
          alt="Logo FitMangas"
          width={30}
          height={30}
          className="h-[30px] w-[30px] object-contain"
        />
      </Link>
      {links.map(({ href, key, icon: Icon, exact }) => {
        const label = labels[key as NavKey];
        const basePath = href.split('#')[0];
        const hrefHash = href.includes('#') ? `#${href.split('#')[1]}` : '';
        const isProfile = basePath === '/compte/profil';
        const isCompteRoot = basePath === '/compte';

        const isActive =
          isProfile
            ? pathname === '/compte/profil'
            : hrefHash
              ? pathname === '/compte' && hash === hrefHash
              : isCompteRoot
                ? pathname === '/compte' && !hash
                : exact
                  ? pathname === basePath
                  : pathname === basePath || pathname.startsWith(`${basePath}/`);

        return (
          <Link
            key={href}
            href={href}
            title={label}
            className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
              isActive
                ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-[0_4px_16px_rgba(249,115,22,0.45)]'
                : 'text-luxury-muted hover:bg-white/50 hover:text-luxury-ink'
            }`}
          >
            <Icon size={22} strokeWidth={2} aria-hidden />
          </Link>
        );
      })}
    </aside>
  );
}
