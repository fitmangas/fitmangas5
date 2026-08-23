'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { recoverOrphanReplaysAction } from '@/app/admin/replays/actions';

export function AdminRecoverOrphanReplaysButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await recoverOrphanReplaysAction();
            if (!result.ok) {
              setMessage(result.message);
              return;
            }
            setMessage(result.message);
            router.refresh();
          });
        }}
        className="btn-luxury-primary px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
      >
        {pending ? 'Scan Vimeo…' : 'Récupérer auto (scan Vimeo)'}
      </button>
      {message ? <p className="text-xs text-luxury-muted">{message}</p> : null}
    </div>
  );
}
