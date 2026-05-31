'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { archiveClientAction, deleteClientAction, unarchiveClientAction } from '@/app/admin/clients/actions';

type Props = {
  profileId: string;
  archived: boolean;
};

export function ClientAdminActions({ profileId, archived }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; message?: string }>, onSuccess?: () => void) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setMessage(result.message ?? 'Erreur.');
        return;
      }
      onSuccess?.();
      router.refresh();
    });
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/30 pt-5">
      {archived ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => unarchiveClientAction(profileId))}
          className="btn-luxury-gold px-4 py-2 text-xs disabled:opacity-50"
        >
          Désarchiver
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!window.confirm('Archiver ce client ? Il sera masqué des listes par défaut.')) return;
            run(() => archiveClientAction(profileId), () => router.push('/admin/clients'));
          }}
          className="btn-luxury-gold px-4 py-2 text-xs disabled:opacity-50"
        >
          Archiver
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(
              'Supprimer définitivement ce client et son compte ? Cette action est irréversible (comptes de test).',
            )
          ) {
            return;
          }
          run(() => deleteClientAction(profileId), () => router.push('/admin/clients'));
        }}
        className="rounded-full border border-rose-300/80 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-rose-800 transition hover:bg-rose-100 disabled:opacity-50"
      >
        Supprimer
      </button>
      {message ? <p className="w-full text-xs text-rose-700">{message}</p> : null}
    </div>
  );
}
