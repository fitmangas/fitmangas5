'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, BookOpen, Brain, CalendarDays, Gift, Route, ShoppingBag, UserRound, Video } from 'lucide-react';

import type { ClientLang } from '@/lib/compte/i18n';
import { compteNavLabels } from '@/lib/compte/i18n';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { isGiftsEnabled } from '@/lib/gifts/flag';
import { SidebarTooltip } from '@/components/Compte/SidebarTooltip';
import { PageHelpButton } from '@/components/Onboarding/PageHelpButton';
import { onboardingLang } from '@/lib/onboarding/premiers-pas';

type NavKey = Exclude<keyof (typeof compteNavLabels)['fr'], 'dashboard'>;

const links: Array<{ href: string; key: NavKey; icon: typeof CalendarDays; exact: boolean }> = [
  { href: '/compte/planning', key: 'planning', icon: CalendarDays, exact: true },
  ...(isProgrammesEnabled()
    ? [{ href: '/compte/programmes', key: 'programmes' as const, icon: Route, exact: false }]
    : []),
  { href: '/compte/blog', key: 'blog', icon: BookOpen, exact: true },
  { href: '/compte/connaissance-de-soi', key: 'selfKnowledge', icon: Brain, exact: false },
  { href: '/compte/replays', key: 'videos', icon: Video, exact: true },
  { href: '/compte/boutique', key: 'shop', icon: ShoppingBag, exact: true },
  ...(isGiftsEnabled() ? [{ href: '/offrir', key: 'gifts' as const, icon: Gift, exact: true }] : []),
  { href: '/compte/notifications', key: 'notifications', icon: Bell, exact: true },
  { href: '/compte/parrainage', key: 'referral', icon: Gift, exact: true },
  { href: '/compte/profil', key: 'profile', icon: UserRound, exact: true },
];

export function CompteSidebar({
  lang = 'fr',
  unreadNotifications = 0,
  helpEnabled = false,
}: {
  lang?: ClientLang;
  unreadNotifications?: number;
  /** « Premiers pas » : bouton « ? Comment ça marche ? » en bas du menu. */
  helpEnabled?: boolean;
}) {
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
    <aside
      className={`luxury-floating-rail luxury-floating-rail--compte fixed left-4 top-1/2 z-[100] hidden -translate-y-1/2 flex-col gap-2 rounded-full p-2 md:flex ${
        helpEnabled
          ? 'origin-left [@media(min-height:701px)_and_(max-height:780px)]:scale-[0.9] [@media(min-height:621px)_and_(max-height:700px)]:scale-[0.8] [@media(max-height:620px)]:scale-[0.7]'
          : ''
      }`}
    >
      <SidebarTooltip label={labels.dashboard}>
      <Link
        href="/compte"
        aria-label={labels.dashboard}
        className={`relative flex h-12 w-12 items-center justify-center rounded-full border border-white/55 bg-white/72 shadow-[0_8px_20px_rgba(15,23,42,0.12)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.16)] ${
          pathname === '/compte' && !hash ? 'ring-2 ring-orange-300/70' : ''
        }`}
      >
        <Image
          src="/logo.png"
          alt="Logo FitMangas"
          width={30}
          height={30}
          className="h-[30px] w-[30px] object-contain"
        />
      </Link>
      </SidebarTooltip>
      {links.map(({ href, key, icon: Icon, exact }) => {
        const label = labels[key];
        const basePath = href.split('#')[0];
        const hrefHash = href.includes('#') ? `#${href.split('#')[1]}` : '';
        const isProfile = basePath === '/compte/profil' || pathname === '/compte/preferences';
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

        const badge =
          key === 'notifications' && unreadNotifications > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff3b30] px-[5px] text-[10px] font-bold leading-none text-white shadow-md ring-2 ring-white">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          ) : null;

          return (
          <SidebarTooltip key={href} label={label}>
          <Link
            href={href}
            aria-label={label}
            className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 hover:-translate-y-0.5 ${
              isActive
                ? 'bg-white/82 text-luxury-ink shadow-[0_8px_20px_rgba(15,23,42,0.12)] ring-1 ring-[#C5A572]/55'
                : 'text-luxury-muted hover:bg-white/62 hover:text-luxury-ink hover:shadow-sm'
            }`}
          >
            <Icon size={23} strokeWidth={2} aria-hidden />
            {badge}
          </Link>
          </SidebarTooltip>
        );
      })}
      {helpEnabled ? <PageHelpButton lang={onboardingLang(lang)} variant="rail" /> : null}
    </aside>
  );
}
