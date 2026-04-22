'use client';

import { useCallback, useEffect, useState } from 'react';
import { Star } from 'lucide-react';

type Props = { articleId: string; initialAverage: number | null; initialCount: number; isLoggedIn: boolean };

export function BlogRatingBlock({ articleId, initialAverage, initialCount, isLoggedIn }: Props) {
  const [avg, setAvg] = useState(initialAverage);
  const [count, setCount] = useState(initialCount);
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const r = await fetch(`/api/client/blog/articles/id/${articleId}/ratings`);
    if (!r.ok) return;
    const j = (await r.json()) as { average_rating: number | null; rating_count: number };
    setAvg(j.average_rating);
    setCount(j.rating_count);
  }, [articleId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(rating: number) {
    if (!isLoggedIn) {
      setMsg('Connecte-toi pour noter cet article.');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      const r = await fetch(`/api/client/blog/articles/id/${articleId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      const j = (await r.json()) as { average_rating?: number | null; rating_count?: number; error?: string };
      if (!r.ok) {
        setMsg(j.error ?? 'Erreur.');
        return;
      }
      setAvg(j.average_rating ?? avg);
      setCount(j.rating_count ?? count);
      setMsg('Merci pour ton évaluation !');
    } finally {
      setBusy(false);
    }
  }

  const displayAvg = avg != null ? avg.toFixed(1) : '—';

  return (
    <div className="rounded-2xl border border-white/40 bg-white/50 px-5 py-4 backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-luxury-muted">Ton avis</p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy}
              aria-label={`Noter ${s} sur 5`}
              className="text-amber-400 transition hover:scale-110 disabled:opacity-40"
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => void submit(s)}
            >
              <Star size={28} strokeWidth={1.5} fill={s <= (hover || 0) ? 'currentColor' : 'transparent'} />
            </button>
          ))}
        </div>
        <div className="text-sm text-luxury-muted">
          <span className="font-semibold text-luxury-ink">{displayAvg}</span> / 5 · {count}{' '}
          {count === 1 ? 'vote' : 'votes'}
        </div>
      </div>
      {!isLoggedIn ? (
        <p className="mt-3 text-xs text-luxury-muted">
          <a href="/login" className="font-semibold underline underline-offset-2">
            Connexion
          </a>{' '}
          requise pour voter.
        </p>
      ) : null}
      {msg ? <p className="mt-3 text-xs text-emerald-800">{msg}</p> : null}
    </div>
  );
}
