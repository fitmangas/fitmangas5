'use client';

import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { markAllNotificationsReadAction, markNotificationReadAction } from '@/app/compte/actions';

export type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell({ items }: { items: NotificationRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const unread = items.filter((i) => !i.read_at).length;

  return (
    <details className="relative group">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-brand-ink/[0.08] bg-brand-beige/40 px-3 py-2 text-brand-ink/80 transition hover:bg-brand-beige/70 [&::-webkit-details-marker]:hidden">
        <Bell size={18} aria-hidden />
        <span className="text-[11px] font-bold uppercase tracking-widest">Notifications</span>
        {unread > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-accent px-1.5 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border border-brand-ink/[0.08] bg-white py-2 shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-brand-ink/45">Aucune notification.</p>
        ) : (
          <>
            <div className="flex justify-end border-b border-brand-ink/[0.06] px-3 pb-2">
              <button
                type="button"
                disabled={pending || unread === 0}
                onClick={() =>
                  startTransition(async () => {
                    await markAllNotificationsReadAction();
                    router.refresh();
                  })
                }
                className="text-[11px] font-semibold text-brand-accent underline-offset-2 hover:underline disabled:opacity-40"
              >
                Tout marquer lu
              </button>
            </div>
            <ul className="max-h-[min(60vh,22rem)] overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className="border-b border-brand-ink/[0.04] last:border-0">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        if (!n.read_at) await markNotificationReadAction(n.id);
                        router.refresh();
                      })
                    }
                    className={`w-full px-4 py-3 text-left text-sm transition hover:bg-brand-beige/50 ${
                      n.read_at ? 'text-brand-ink/55' : 'text-brand-ink'
                    }`}
                  >
                    <span className="block font-semibold">{n.title}</span>
                    {n.body ? <span className="mt-1 block text-xs leading-relaxed text-brand-ink/60">{n.body}</span> : null}
                    <span className="mt-2 block text-[10px] uppercase tracking-wider text-brand-ink/35">
                      {new Date(n.created_at).toLocaleString('fr-FR')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </details>
  );
}
