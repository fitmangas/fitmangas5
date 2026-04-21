'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  videoId: string;
};

export function StandaloneVimeoPendingActions({ videoId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(action: 'publish' | 'reject') {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/standalone-videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        window.alert(json.error ?? 'Action impossible.');
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => run('publish')}
        className="rounded-full bg-[#ff7a00] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_8px_22px_rgba(255,122,0,0.35)] transition hover:-translate-y-px disabled:opacity-50"
      >
        Valider
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => run('reject')}
        className="rounded-full border border-white/50 bg-white/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-luxury-ink backdrop-blur-md transition hover:bg-white/50 disabled:opacity-50"
      >
        Rejeter
      </button>
    </div>
  );
}
