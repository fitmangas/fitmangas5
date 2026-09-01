'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { BookOpen, Clapperboard, Film, Inbox, ShoppingBag, Target, TicketPercent, Users } from 'lucide-react';

const links = [
  { href: '/admin/courses', label: 'Séances', icon: Clapperboard },
  { href: '/admin/videos', label: 'Vidéos', icon: Film },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/inbox', label: 'Inbox', icon: Inbox },
  { href: '/admin/blog', label: 'Blog', icon: BookOpen },
  { href: '/admin/boutique', label: 'Boutique', icon: ShoppingBag },
  { href: '/admin/promos', label: 'Promos', icon: TicketPercent },
  { href: '/admin/croissance', label: 'Croissance', icon: Target },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [vimeoPending, setVimeoPending] = useState<number | null>(null);
  const [replaysPending, setReplaysPending] = useState<number | null>(null);
  const [inboxPending, setInboxPending] = useState<number | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    function load() {
      Promise.all([
        fetch('/api/admin/standalone-videos/pending-count').then((r) => r.json()),
        fetch('/api/admin/course-replays/pending-count').then((r) => r.json()),
        fetch('/api/admin/inbox/pending-count').then((r) => r.json()),
      ])
        .then(([vimeo, replays, inbox]) => {
          if (cancelled) return;
          setVimeoPending(typeof vimeo.pending === 'number' ? vimeo.pending : 0);
          setReplaysPending(typeof replays.pending === 'number' ? replays.pending : 0);
          setInboxPending(typeof inbox.total === 'number' ? inbox.total : 0);
        })
        .catch(() => {
          if (!cancelled) {
            setVimeoPending(0);
            setReplaysPending(0);
            setInboxPending(0);
          }
        });
    }
    load();
    const interval = setInterval(load, 45_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

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
    <aside className="luxury-floating-rail fixed left-4 top-1/2 z-[100] hidden -translate-y-1/2 flex-col gap-2 rounded-full p-2 md:flex">
      <Link
        href="/admin"
        title="Dashboard"
        prefetch
        onMouseEnter={() => router.prefetch('/admin')}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          navigate('/admin');
        }}
        className={`relative flex h-12 w-12 items-center justify-center rounded-full border border-white/55 bg-white/72 shadow-[0_8px_20px_rgba(15,23,42,0.12)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.16)] ${
          pathname === '/admin' ? 'ring-2 ring-orange-300/70' : ''
        } ${isPending && pendingHref === '/admin' ? 'animate-pulse ring-2 ring-orange-300/50' : ''}`}
      >
        <Image
          src="/logo.png"
          alt="Logo FitMangas"
          width={30}
          height={30}
          className="h-[30px] w-[30px] object-contain"
        />
      </Link>
      {links.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === '/admin/croissance'
            ? isCroissanceActive(pathname)
            : href === '/admin'
              ? pathname === '/admin'
              : pathname === href || pathname.startsWith(`${href}/`);

        const pendingCount =
          href === '/admin/videos'
            ? (replaysPending ?? 0) + (vimeoPending ?? 0)
            : href === '/admin/inbox'
              ? inboxPending
              : null;
        const badge =
          pendingCount != null && pendingCount > 0 ? (
            <span
              className={`absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-[5px] text-[10px] font-bold leading-none text-white shadow-md ring-2 ring-white ${
                href === '/admin/inbox' ? 'bg-[#ff3b30]' : 'bg-[#FF9F0A]'
              }`}
            >
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          ) : null;

        const targetHref =
          href === '/admin/videos' && replaysPending != null && replaysPending > 0
            ? '/admin/videos?section=replays#course-replays-pending'
            : href === '/admin/videos' && vimeoPending != null && vimeoPending > 0
              ? '/admin/videos?section=library#vimeo-pending-section'
              : href;

        const showPending = isPending && pendingHref === href;

        return (
          <Link
            key={href}
            href={targetHref}
            title={label}
            prefetch
            onMouseEnter={() => router.prefetch(href)}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              navigate(href);
            }}
            className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 hover:-translate-y-0.5 ${
              isActive
                ? 'bg-white/82 text-luxury-ink shadow-[0_8px_20px_rgba(15,23,42,0.12)] ring-1 ring-[#C5A572]/55'
                : 'text-luxury-muted hover:bg-white/62 hover:text-luxury-ink hover:shadow-sm'
            } ${showPending ? 'animate-pulse bg-white/70 text-luxury-ink ring-2 ring-orange-300/45' : ''}`}
          >
            <Icon size={23} strokeWidth={2} aria-hidden />
            {badge}
          </Link>
        );
      })}
    </aside>
  );
}
