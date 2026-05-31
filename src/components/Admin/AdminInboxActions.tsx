'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import {
  markAdminNotificationReadAction,
  markAllAdminNotificationsReadAction,
  resolveSupportTicketAction,
} from '@/app/admin/inbox/actions';

export function ResolveTicketButton({ ticketId }: { ticketId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => void resolveSupportTicketAction(ticketId))}
      className="btn-luxury-primary shrink-0 min-h-[38px] px-4 text-[10px] tracking-[0.12em] disabled:opacity-50"
    >
      {pending ? '…' : 'Marquer résolu'}
    </button>
  );
}

export function MarkNotificationReadButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => void markAdminNotificationReadAction(id))}
      className="text-[10px] font-semibold uppercase tracking-wider text-luxury-orange hover:underline disabled:opacity-50"
    >
      {pending ? '…' : 'Lu'}
    </button>
  );
}

export function MarkAllNotificationsReadButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(() => {
          void markAllAdminNotificationsReadAction().then(() => router.refresh());
        })
      }
      className="btn-luxury-ghost min-h-[38px] px-4 text-[10px] tracking-[0.12em] disabled:opacity-50"
    >
      {pending ? '…' : 'Tout marquer lu'}
    </button>
  );
}
