'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { probeDeadReplaysVimeoAction, recoverOrphanReplaysAction } from '@/app/admin/replays/actions';

export function AdminRecoverOrphanReplaysButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setMessage(null);
            startTransition(async () => {
              const result = await probeDeadReplaysVimeoAction();
              setMessage(result.ok ? result.message : result.message);
              if (result.ok) router.refresh();
            });
          }}
          className="rounded-full border border-white/45 bg-white/50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
        >
          {pending ? 'Sonde…' : 'Vérifier lisibilité Vimeo'}
        </button>
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
      </div>
      <p className="text-[11px] leading-relaxed text-luxury-muted">
        Replays illisibles : restaurer d’abord la corbeille Vimeo (Supprimés récemment, 30 j), puis « Vérifier ».
        Sinon :{' '}
        <code className="rounded bg-white/50 px-1">bash scripts/vps/pull-all-jibri-mp4.sh</code> puis{' '}
        <code className="rounded bg-white/50 px-1">npx tsx scripts/recover-dead-replays-from-mp4.ts --upload</code>
      </p>
      {message ? <p className="text-xs font-medium text-luxury-ink">{message}</p> : null}
    </div>
  );
}
