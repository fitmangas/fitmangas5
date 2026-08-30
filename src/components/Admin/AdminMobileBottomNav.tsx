'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { BookOpen, Clapperboard, Inbox, ShoppingBag, Target, TicketPercent, Users, Video } from 'lucide-react';

const links = [
  { href: '/admin/courses', label: 'Séances', icon: Clapperboard },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/inbox', label: 'Inbox', icon: Inbox },
  { href: '/admin/blog', label: 'Blog', icon: BookOpen },
  { href: '/admin/vimeo', label: 'Vimeo', icon: Video },
  { href: '/admin/boutique', label: 'Boutique', icon: ShoppingBag },
  { href: '/admin/promos', label: 'Promos', icon: TicketPercent },
  { href: '/admin/croissance', label: 'Croissance', icon: Target },
] as const;

export function AdminMobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  function navigate(href: string) {
    if (pathname === href || pathname.startsWith(`${href}/`)) return;
    setPendingHref(href);
    startTransition(() => {
      router.push(href);
    });
  }

  function isCroissanceActive(path: string) {
    return (
      path === '/admin/croissance' ||
      path.startsWith('/admin/croissance/') ||
      path === '/admin/marketing' ||
      path.startsWith('/admin/marketing/') ||
      path === '/admin/community' ||
      path.startsWith('/admin/community/') ||
      path === '/admin/acquisition' ||
      path.startsWith('/admin/acquisition/')
    );
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-[230] bg-[#fbf7ef]/95 px-3 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl md:hidden" aria-label="Navigation admin mobile">
      <div className="grid grid-cols-9 gap-0.5 rounded-[1.45rem] border border-white/75 bg-white/88 px-1.5 py-2">
        <Link
          href="/admin"
          aria-label="Dashboard"
          title="Dashboard"
          prefetch
          onMouseEnter={() => router.prefetch('/admin')}
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();
            navigate('/admin');
          }}
          className={`mx-auto flex h-10 w-full max-w-[2.75rem] items-center justify-center rounded-full border border-white/60 bg-white/80 shadow-sm ${
            pathname === '/admin' ? 'ring-2 ring-orange-300/70' : ''
          } ${isPending && pendingHref === '/admin' ? 'animate-pulse' : ''}`}
        >
          <Image
            src="/logo.png"
            alt="FitMangas"
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
          />
        </Link>
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/admin/croissance'
              ? isCroissanceActive(pathname)
              : pathname === href || pathname.startsWith(`${href}/`);
          const showPending = isPending && pendingHref === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              prefetch
              onMouseEnter={() => router.prefetch(href)}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                navigate(href);
              }}
              className={`mx-auto flex h-10 w-full max-w-[2.75rem] items-center justify-center rounded-2xl transition ${
                active ? 'bg-luxury-ink text-white shadow-md' : 'text-luxury-muted hover:bg-white/70 hover:text-luxury-ink'
              } ${showPending ? 'animate-pulse bg-white/80 text-luxury-ink' : ''}`}
            >
              <Icon size={20} strokeWidth={2} aria-hidden />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
