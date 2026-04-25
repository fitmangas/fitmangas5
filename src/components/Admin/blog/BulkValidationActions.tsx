'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

export function BulkValidationActions({ pendingValidationIds }: { pendingValidationIds: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState('');

  const count = useMemo(() => pendingValidationIds.length, [pendingValidationIds.length]);

  async function run(action: 'approve' | 'reject') {
    if (busy || count === 0) return;
    if (action === 'reject' && !window.confirm('Rejeter toutes les validations en attente de ce mois ?')) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/blog/validation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, validationIds: pendingValidationIds, notes: notes.trim() || undefined }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        alert(json?.error ?? 'Erreur bulk validation');
        return;
      }
      setNotes('');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass-card mt-6 rounded-2xl border border-white/40 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Actions groupées</p>
      <p className="mt-1 text-sm text-luxury-muted">{count} validation(s) en attente sur ce mois.</p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Note coaching globale (optionnel)"
        className="mt-3 w-full rounded-xl border border-white/50 bg-white/50 px-3 py-2 text-sm outline-none"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || count === 0}
          onClick={() => void run('approve')}
          className="rounded-full bg-emerald-600 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-50"
        >
          Valider tout le mois
        </button>
        <button
          type="button"
          disabled={busy || count === 0}
          onClick={() => void run('reject')}
          className="rounded-full border border-red-300 bg-red-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-900 disabled:opacity-50"
        >
          Rejeter tout le mois
        </button>
      </div>
    </div>
  );
}
