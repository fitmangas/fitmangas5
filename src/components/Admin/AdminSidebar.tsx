'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BookOpen, Clapperboard, Film, Inbox, Megaphone, Rocket, ShoppingBag, TicketPercent, Users, Video } from 'lucide-react';

const links = [
  { href: '/admin/courses', label: 'Séances', icon: Clapperboard },
  { href: '/admin/replays', label: 'Replays', icon: Film },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/inbox', label: 'Inbox', icon: Inbox },
  { href: '/admin/blog', label: 'Blog', icon: BookOpen },
  { href: '/admin/vimeo', label: 'Vimeo', icon: Video },
  { href: '/admin/boutique', label: 'Boutique', icon: ShoppingBag },
  { href: '/admin/promos', label: 'Promos', icon: TicketPercent },
  { href: '/admin/marketing', label: 'Marketing', icon: Rocket },
  { href: '/admin/community', label: 'Com’ réseaux', icon: Megaphone },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [vimeoPending, setVimeoPending] = useState<number | null>(null);
  const [replaysPending, setReplaysPending] = useState<number | null>(null);
  const [inboxPending, setInboxPending] = useState<number | null>(null);

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

  return (
    <aside className="luxury-floating-rail fixed left-4 top-1/2 z-[100] hidden -translate-y-1/2 flex-col gap-2 rounded-full p-2 md:flex">
      <Link
        href="/admin"
        title="Dashboard"
        className={`relative flex h-12 w-12 items-center justify-center rounded-full border border-white/55 bg-white/72 shadow-[0_8px_20px_rgba(15,23,42,0.12)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.16)] ${
          pathname === '/admin' ? 'ring-2 ring-orange-300/70' : ''
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
      {links.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);

        const pendingCount =
          href === '/admin/vimeo'
            ? vimeoPending
            : href === '/admin/replays'
              ? replaysPending
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

        const vimeoHref =
          href === '/admin/vimeo' && vimeoPending != null && vimeoPending > 0
            ? '/admin/vimeo#vimeo-pending-section'
            : href === '/admin/replays' && replaysPending != null && replaysPending > 0
              ? '/admin/replays#course-replays-pending'
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
