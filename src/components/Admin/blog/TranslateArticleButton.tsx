'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function TranslateArticleButton({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/blog/articles/${articleId}/translate`, { method: 'POST' });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        alert(json?.error ?? 'Traduction impossible');
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void run()}
      className="rounded-full border border-white/50 bg-white/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-luxury-ink disabled:opacity-50"
    >
      {busy ? 'Traduction…' : 'Traduire EN/ES'}
    </button>
  );
}
