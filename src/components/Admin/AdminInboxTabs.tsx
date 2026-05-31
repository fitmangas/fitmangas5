'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Tab = 'tickets' | 'notifications' | 'settings';

export function AdminInboxTabs({
  ticketCount,
  notificationCount,
}: {
  ticketCount: number;
  notificationCount: number;
}) {
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') as Tab) || 'tickets';

  const items: { id: Tab; label: string; badge?: number }[] = [
    { id: 'tickets', label: 'Tickets support', badge: ticketCount },
    { id: 'notifications', label: 'Notifications', badge: notificationCount },
    { id: 'settings', label: 'Réglages dispatcher' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = tab === item.id;
        return (
          <Link
            key={item.id}
            href={`/admin/inbox?tab=${item.id}`}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
              active
                ? 'border-white/90 bg-white/85 text-luxury-ink shadow-[0_8px_20px_rgba(15,23,42,0.1)]'
                : 'border-white/50 bg-white/40 text-luxury-muted hover:bg-white/65 hover:text-luxury-ink'
            }`}
          >
            {item.label}
            {item.badge != null && item.badge > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff3b30] px-1.5 text-[9px] font-bold text-white">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
