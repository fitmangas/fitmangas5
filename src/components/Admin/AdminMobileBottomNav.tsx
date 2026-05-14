'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BellRing, BookOpen, Clapperboard, Rocket, ShoppingBag, TicketPercent, Video } from 'lucide-react';

const links = [
  { href: '/admin/courses', label: 'Séances', icon: Clapperboard },
  { href: '/admin/blog', label: 'Blog', icon: BookOpen },
  { href: '/admin/vimeo', label: 'Vimeo', icon: Video },
  { href: '/admin/boutique', label: 'Boutique', icon: ShoppingBag },
  { href: '/admin/promos', label: 'Promos', icon: TicketPercent },
  { href: '/admin/marketing', label: 'Marketing', icon: Rocket },
  { href: '/admin/notifications/settings', label: 'Notifications', icon: BellRing },
] as const;

export function AdminMobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 top-0 z-[230] bg-[#fbf7ef]/95 px-3 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl md:hidden" aria-label="Navigation admin mobile">
      <div className="flex items-center justify-between gap-1 rounded-[1.45rem] border border-white/75 bg-white/88 px-2 py-2">
        <Link
          href="/admin"
          aria-label="Dashboard"
          title="Dashboard"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/80 shadow-sm ${
            pathname === '/admin' ? 'ring-2 ring-orange-300/70' : ''
          }`}
        >
          <Image
            src="/Spreadshop Logo (1800 x 1800 px)-2.png"
            alt="FitMangas"
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
          />
        </Link>
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
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
