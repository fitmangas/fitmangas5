'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Clapperboard, LayoutDashboard, TicketPercent, Video } from 'lucide-react';

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/courses', label: 'Séances', icon: Clapperboard },
  { href: '/admin/vimeo', label: 'Vimeo', icon: Video },
  { href: '/admin/promos', label: 'Promos', icon: TicketPercent },
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
    <aside className="fixed left-4 top-1/2 z-[100] hidden -translate-y-1/2 flex-col gap-2 rounded-full border border-white/35 bg-white/30 p-2 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl md:flex">
      {links.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);

        const badge =
          href === '/admin/vimeo' && vimeoPending != null && vimeoPending > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff4500] px-[5px] text-[10px] font-bold leading-none text-white shadow-md ring-2 ring-white">
              {vimeoPending > 9 ? '9+' : vimeoPending}
            </span>
          ) : null;

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
            {badge}
          </Link>
        );
      })}
    </aside>
  );
}
