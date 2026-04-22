'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ValidationActions({
  validationId,
  articleTitle,
}: {
  validationId: string;
  articleTitle: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState('');

  async function patch(action: 'approve' | 'reject') {
    const ok = action === 'approve' ? true : window.confirm(`Rejeter « ${articleTitle} » ?`);
    if (!ok) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/blog/validation/${validationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: notes.trim() || undefined }),
      });
      if (!r.ok) {
        const j = (await r.json()) as { error?: string };
        alert(j.error ?? 'Erreur');
        return;
      }
      setNotes('');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-white/40 pt-4">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Note coaching (optionnel)"
        rows={2}
        className="w-full rounded-xl border border-white/50 bg-white/50 px-3 py-2 text-sm outline-none"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void patch('approve')}
          className="rounded-full bg-emerald-600 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-50"
        >
          Valider
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void patch('reject')}
          className="rounded-full border border-red-300 bg-red-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-900 disabled:opacity-50"
        >
          Rejeter
        </button>
      </div>
    </div>
  );
}
