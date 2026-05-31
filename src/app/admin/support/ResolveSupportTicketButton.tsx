'use client';

import { useTransition } from 'react';

import { resolveSupportTicketAction } from '@/app/admin/support/actions';

export function ResolveSupportTicketButton({ ticketId }: { ticketId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => void resolveSupportTicketAction(ticketId))}
      className="btn-luxury-primary shrink-0 min-h-[40px] px-4 text-[10px] tracking-[0.12em] disabled:opacity-50"
    >
      {pending ? '…' : 'Marquer comme résolu'}
    </button>
  );
}
