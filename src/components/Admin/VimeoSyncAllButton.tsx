'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function VimeoSyncAllButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [lastMsg, setLastMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setLastMsg(null);
    try {
      const res = await fetch('/api/admin/vimeo/sync-all', { method: 'POST' });
      const json = (await res.json()) as {
        ok?: boolean;
        scanned?: number;
        written?: number;
        skippedRejected?: number;
        errors?: string[];
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setLastMsg(json.error ?? 'Échec de la synchronisation.');
        return;
      }
      const errHint =
        json.errors?.length && json.errors.length > 0
          ? ` — ${json.errors.length} erreur(s) partielle(s).`
          : '';
      setLastMsg(
        `OK : ${json.scanned ?? 0} vidéo(s) scannée(s), ${json.written ?? 0} ligne(s) écrite(s), ${json.skippedRejected ?? 0} rejetée(s) ignorée(s).${errHint}`,
      );
      router.refresh();
    } catch {
      setLastMsg('Erreur réseau.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={run}
        className="btn-luxury-ghost inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] sm:w-auto"
      >
        {busy ? 'Synchronisation…' : '🔄 Synchroniser toute la bibliothèque'}
      </button>
      {lastMsg ? <p className="text-xs leading-relaxed text-luxury-muted">{lastMsg}</p> : null}
    </div>
  );
}
