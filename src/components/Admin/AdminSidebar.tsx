'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BellRing, BookOpen, Clapperboard, ShoppingBag, TicketPercent, Video } from 'lucide-react';

const links = [
  { href: '/admin/courses', label: 'Séances', icon: Clapperboard },
  { href: '/admin/blog', label: 'Blog', icon: BookOpen },
  { href: '/admin/vimeo', label: 'Vimeo', icon: Video },
  { href: '/admin/boutique', label: 'Boutique', icon: ShoppingBag },
  { href: '/admin/promos', label: 'Promos', icon: TicketPercent },
  { href: '/admin/notifications/settings', label: 'Notifications', icon: BellRing },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [vimeoPending, setVimeoPending] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    function load() {
      fetch('/api/admin/standalone-videos/pending-count')
        .then((r) => r.json())
        .then((d: { pending?: number }) => {
          if (!cancelled) setVimeoPending(typeof d.pending === 'number' ? d.pending : 0);
        })
        .catch(() => {
          if (!cancelled) setVimeoPending(0);
        });
    }
    load();
    const interval = setInterval(load, 45_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <aside className="luxury-floating-rail fixed left-4 top-1/2 z-[100] hidden -translate-y-1/2 flex-col gap-2 rounded-full p-2 md:flex">
      <Link
        href="/admin"
        title="Dashboard"
        className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/60 bg-white/72 shadow-[0_6px_18px_rgba(15,23,42,0.1)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-[0_10px_22px_rgba(15,23,42,0.14)] ${
          pathname === '/admin' ? 'bg-white/95 ring-1 ring-[#C5A572]/70' : ''
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
      {links.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);

        const badge =
          href === '/admin/vimeo' && vimeoPending != null && vimeoPending > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#FF9F0A] px-[5px] text-[10px] font-bold leading-none text-white shadow-md ring-2 ring-white">
              {vimeoPending > 9 ? '9+' : vimeoPending}
            </span>
          ) : null;

        const vimeoHref =
          href === '/admin/vimeo' && vimeoPending != null && vimeoPending > 0
            ? '/admin/vimeo#vimeo-pending-section'
            : href;

        return (
          <Link
            key={href}
            href={vimeoHref}
            title={label}
            className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 hover:-translate-y-0.5 ${
              isActive
                ? 'bg-white/82 text-luxury-ink shadow-[0_8px_20px_rgba(15,23,42,0.12)] ring-1 ring-[#C5A572]/55'
                : 'text-luxury-muted hover:bg-white/62 hover:text-luxury-ink hover:shadow-sm'
            }`}
          >
            <Icon size={23} strokeWidth={2} aria-hidden />
            {badge}
          </Link>
        );
      })}
    </aside>
  );
}
