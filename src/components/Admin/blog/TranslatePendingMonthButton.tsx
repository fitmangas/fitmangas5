'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function TranslatePendingMonthButton({ monthYear }: { monthYear: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/blog/validation/translate-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthYear, limit: 12 }),
      });
      const json = (await res.json().catch(() => null)) as {
        error?: string;
        message?: string;
        translated?: number;
        failed?: number;
      } | null;
      if (!res.ok) {
        setMessage(json?.error ?? 'Traduction du mois impossible.');
        return;
      }
      setMessage(json?.message ?? 'Traduction terminée.');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => void run()}
        className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-900 disabled:opacity-50"
        title="Traduit le corps ES des articles encore incomplets (jusqu’à 12 par clic)"
      >
        {busy ? 'Traduction ES en cours…' : 'Traduire ES manquantes (mois)'}
      </button>
      {message ? <p className="text-[11px] text-luxury-muted">{message}</p> : null}
    </div>
  );
}
