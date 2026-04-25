'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';

export function BlogFavoriteToggle({ articleId, initialFavorite }: { articleId: string; initialFavorite: boolean }) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    const next = !favorite;
    setFavorite(next);
    setPending(true);
    try {
      const res = await fetch('/api/client/blog/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, favorite: next }),
      });
      if (!res.ok) throw new Error('toggle failed');
    } catch {
      setFavorite(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
        favorite
          ? 'border-orange-300 bg-orange-50 text-orange-700'
          : 'border-white/40 bg-white/45 text-luxury-muted hover:bg-white/65'
      }`}
    >
      <Heart size={12} className={favorite ? 'fill-current' : ''} />
      {favorite ? 'Favori' : 'Ajouter'}
    </button>
  );
}
