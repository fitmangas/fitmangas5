'use client';

import { useMemo, useState } from 'react';
import { GripVertical, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ProductCard = {
  id: number;
  name: string;
  image: string | null;
  variants: number;
  synced: number;
};

export function PrintfulProductsSaleGridEditor({ products }: { products: ProductCard[] }) {
  const router = useRouter();
  const [items, setItems] = useState(products);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);

  const hasChanges = useMemo(
    () => items.map((p) => p.id).join(',') !== products.map((p) => p.id).join(','),
    [items, products],
  );

  function moveById(sourceId: number, targetId: number) {
    if (sourceId === targetId) return;
    setItems((prev) => {
      const draft = [...prev];
      const from = draft.findIndex((item) => item.id === sourceId);
      const to = draft.findIndex((item) => item.id === targetId);
      if (from < 0 || to < 0) return prev;
      const [item] = draft.splice(from, 1);
      draft.splice(to, 0, item);
      return draft;
    });
  }

  async function saveOrder() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/printful/product-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: items.map((p) => p.id) }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Échec sauvegarde.');
      setMessage('Ordre sauvegardé.');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-luxury-muted">Glisse une carte via l’icône pour réordonner l’affichage client.</p>
        <button
          type="button"
          onClick={() => void saveOrder()}
          disabled={!hasChanges || saving}
          className="inline-flex items-center gap-2 rounded-full bg-luxury-orange px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          Sauvegarder
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((product, index) => (
          <article
            key={product.id}
            onDragOver={(e) => {
              e.preventDefault();
              if (draggingId !== null && draggingId !== product.id) setOverId(product.id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (draggingId !== null) moveById(draggingId, product.id);
              setDraggingId(null);
              setOverId(null);
            }}
            className={`overflow-hidden rounded-2xl border bg-white/45 transition ${
              overId === product.id ? 'border-luxury-orange/55 ring-1 ring-luxury-orange/40' : 'border-white/50'
            }`}
          >
            <div className="relative aspect-[4/3] bg-[#f5f1eb]">
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-luxury-soft">Mockup indisponible</div>
              )}
              <div className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[10px] font-semibold text-white">#{index + 1}</div>
              <button
                type="button"
                draggable
                onDragStart={(e) => {
                  setDraggingId(product.id);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', String(product.id));
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                  setOverId(null);
                }}
                className="absolute right-2 top-2 cursor-grab rounded-full border border-white/60 bg-white/85 p-1.5 text-luxury-ink active:cursor-grabbing"
                aria-label={`Déplacer ${product.name}`}
                title="Glisser pour déplacer"
              >
                <GripVertical size={14} />
              </button>
            </div>
            <div className="p-4">
              <p className="line-clamp-2 font-medium text-luxury-ink">{product.name}</p>
              <p className="mt-2 text-xs text-luxury-muted">
                Variantes: {product.variants} · Sync: {product.synced}
              </p>
            </div>
          </article>
        ))}
      </div>

      {message ? <p className="mt-3 text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
