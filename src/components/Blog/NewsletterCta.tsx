'use client';

import { useState } from 'react';

export function NewsletterCta({ articleId }: { articleId?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const r = await fetch('/api/client/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, articleId: articleId ?? null }),
      });
      if (!r.ok) {
        setStatus('error');
        return;
      }
      setStatus('done');
      setEmail('');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="rounded-2xl border border-orange-200/80 bg-orange-50/90 px-5 py-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-900/70">Newsletter</p>
      <p className="mt-2 text-lg font-semibold text-luxury-ink">Reçois mes articles pilates en priorité</p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.com"
          className="min-w-0 flex-1 rounded-full border border-white/60 bg-white px-4 py-3 text-sm outline-none ring-orange-400/30 focus:ring-2"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-luxury-primary shrink-0 px-8 py-3 text-[11px] tracking-[0.14em] disabled:opacity-50"
        >
          {status === 'loading' ? '…' : "S'inscrire"}
        </button>
      </form>
      {status === 'done' ? (
        <p className="mt-3 text-xs text-emerald-800">Merci ! Tu es bien inscrite.</p>
      ) : null}
      {status === 'error' ? (
        <p className="mt-3 text-xs text-red-700">Une erreur est survenue. Réessaie plus tard.</p>
      ) : null}
    </div>
  );
}
