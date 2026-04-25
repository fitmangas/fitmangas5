'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clapperboard, LayoutDashboard, UserRound, Video } from 'lucide-react';

const links = [
  { href: '/compte', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/compte#planning', label: 'Planning', icon: Clapperboard },
  { href: '/compte#replays', label: 'Vidéos', icon: Video },
  { href: '/compte/profil', label: 'Profil', icon: UserRound, exact: true },
];

export function CompteSidebar() {
  const pathname = usePathname();
  const [hash, setHash] = useState('');

  useEffect(() => {
    const readHash = () => setHash(window.location.hash || '');
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, []);

  return (
    <aside className="fixed left-4 top-1/2 z-[100] hidden -translate-y-1/2 flex-col gap-2 rounded-full border border-white/35 bg-white/30 p-2 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl md:flex">
      {links.map(({ href, label, icon: Icon, exact }) => {
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
