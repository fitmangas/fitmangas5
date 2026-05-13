'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function VimeoSyncAllButton() {
  const router = useRouter();
  const [busyMode, setBusyMode] = useState<'new' | 'all' | null>(null);
  const [lastMsg, setLastMsg] = useState<string | null>(null);

  async function run(mode: 'new' | 'all') {
    if (mode === 'all') {
      const ok = window.confirm('Cela va réimporter toutes les vidéos de votre compte Vimeo. Continuer ?');
      if (!ok) return;
    }
    setBusyMode(mode);
    setLastMsg(null);
    try {
      const res = await fetch(mode === 'new' ? '/api/admin/vimeo/sync-new' : '/api/admin/vimeo/sync-all', { method: 'POST' });
      const json = (await res.json()) as {
        ok?: boolean;
        scanned?: number;
        written?: number;
        skippedRejected?: number;
        since?: string | null;
        errors?: string[];
        error?: string;
        folderColumnSkipped?: boolean;
      };
      if (!res.ok || !json.ok) {
        setLastMsg(json.error ?? 'Échec de la synchronisation.');
        return;
      }
      const samples =
        json.errors?.length && json.errors.length > 0
          ? ` Détail : ${json.errors.slice(0, 3).join(' · ')}${json.errors.length > 3 ? '…' : ''}`
          : '';
      const migrationHint =
        json.folderColumnSkipped === true
          ? ' Note : dossiers désactivés tant que la migration SQL 011 (`vimeo_folder_name`) n’est pas appliquée.'
          : '';
      const errHint =
        json.errors?.length && json.errors.length > 0
          ? ` — ${json.errors.length} erreur(s).${samples}`
          : '';
      const sinceHint =
        mode === 'new'
          ? json.since
            ? ` depuis ${new Date(json.since).toLocaleString('fr-FR')}`
            : ' depuis la première synchronisation'
          : '';
      setLastMsg(
        `OK : ${json.scanned ?? 0} ${mode === 'new' ? 'nouvelle(s) vidéo(s)' : 'vidéo(s)'} scannée(s)${sinceHint}, ${json.written ?? 0} ligne(s) écrite(s), ${json.skippedRejected ?? 0} rejetée(s) ignorée(s).${errHint}${migrationHint}`,
      );
      router.refresh();
    } catch {
      setLastMsg('Erreur réseau.');
    } finally {
      setBusyMode(null);
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busyMode !== null}
          onClick={() => void run('new')}
          className="btn-luxury-primary inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] sm:w-auto"
        >
          {busyMode === 'new' ? 'Synchronisation…' : 'Synchroniser les nouvelles vidéos'}
        </button>
        <button
          type="button"
          disabled={busyMode !== null}
          onClick={() => void run('all')}
          className="btn-luxury-ghost inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] sm:w-auto"
        >
          {busyMode === 'all' ? 'Synchronisation…' : 'Synchroniser toute la bibliothèque'}
        </button>
      </div>
      <p className="text-[11px] leading-relaxed text-luxury-muted">
        La synchronisation complète réimporte toutes les vidéos du compte Vimeo. Utilise-la seulement pour reconstruire la bibliothèque.
      </p>
      {lastMsg ? <p className="text-xs leading-relaxed text-luxury-muted">{lastMsg}</p> : null}
    </div>
  );
}
