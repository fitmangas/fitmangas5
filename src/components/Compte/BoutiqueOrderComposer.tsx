'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

type ProductInput = {
  id: number;
  name: string;
  image: string | null;
};

type Variant = {
  id: number;
  name: string;
  retailPrice: number;
  currency: string;
  availability: string;
};

type ProductDetail = {
  id: number;
  name: string;
  thumbnailUrl: string | null;
  variants: Variant[];
};

function money(value: number, currency: string): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(value);
}

export function BoutiqueOrderComposer({ products }: { products: ProductInput[] }) {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(products[0]?.id ?? null);
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState('');
  const [address1, setAddress1] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [countryCode, setCountryCode] = useState('FR');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );
  const selectedVariant = useMemo(
    () => (detail?.variants ?? []).find((v) => v.id === variantId) ?? null,
    [detail?.variants, variantId],
  );
  const estimatedTotal = (selectedVariant?.retailPrice ?? 0) * quantity;

  useEffect(() => {
    if (selectedProductId != null) {
      void loadProductDetail(selectedProductId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductId]);

  async function loadProductDetail(productId: number) {
    setLoadingDetail(true);
    setError(null);
    try {
      const res = await fetch(`/api/printful/products/${productId}`);
      const json = (await res.json()) as { product?: ProductDetail; error?: string };
      if (!res.ok || !json.product) throw new Error(json.error ?? 'Impossible de charger les variantes');
      setDetail(json.product);
      const firstAvailable = json.product.variants.find((v) => v.availability !== 'discontinued');
      setVariantId(firstAvailable?.id ?? json.product.variants[0]?.id ?? null);
    } catch (e) {
      setDetail(null);
      setVariantId(null);
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!selectedProductId || !variantId) {
      nextErrors.variant = 'Choisis une variante.';
    }
    if (!name.trim()) nextErrors.name = 'Nom requis.';
    if (!address1.trim()) nextErrors.address1 = 'Adresse requise.';
    if (!city.trim()) nextErrors.city = 'Ville requise.';
    if (!zip.trim()) nextErrors.zip = 'Code postal requis.';
    if (!countryCode.trim()) nextErrors.countryCode = 'Code pays requis.';
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/printful/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          variantId,
          quantity,
          recipient: { name, address1, city, zip, countryCode },
        }),
      });
      const json = (await res.json()) as { order?: { id: number }; error?: string };
      if (!res.ok || !json.order) throw new Error(json.error ?? 'Création impossible');
      setMessage(`Commande #${json.order.id} créée avec succès.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-4">
        <p className="text-sm text-luxury-muted">1) Choisis un produit</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelectedProductId(p.id);
              }}
              className={`overflow-hidden rounded-2xl border text-left transition ${
                selectedProductId === p.id
                  ? 'border-luxury-orange/50 bg-white/90 shadow-md'
                  : 'border-white/40 bg-white/50 hover:border-luxury-orange/30'
              }`}
            >
              <div className="aspect-[4/3] bg-[#f5f1eb]">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-luxury-soft">Mockup indisponible</div>
                )}
              </div>
              <p className="line-clamp-2 p-3 text-sm font-medium text-luxury-ink">{p.name}</p>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleCreateOrder} className="space-y-4 rounded-3xl border border-white/45 bg-white/65 p-5 backdrop-blur">
        <p className="text-sm text-luxury-muted">2) Variante, quantité et adresse</p>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">Variante</label>
          {loadingDetail ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-luxury-muted">
              <Loader2 size={14} className="animate-spin" /> Chargement...
            </div>
          ) : (
            <select
              value={variantId ?? ''}
              onChange={(e) => setVariantId(Number(e.target.value))}
              className="mt-2 w-full rounded-xl border border-white/50 bg-white/90 px-3 py-2 text-sm text-luxury-ink transition focus:border-luxury-orange/40 focus:outline-none"
            >
              <option value="" disabled>
                Choisir une variante
              </option>
              {(detail?.variants ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} · {money(v.retailPrice, v.currency)}
                </option>
              ))}
            </select>
          )}
          {fieldErrors.variant ? <p className="mt-1 text-xs text-red-600">{fieldErrors.variant}</p> : null}
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">Quantité</label>
          <input
            type="number"
            min={1}
            max={20}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
            className="mt-2 w-full rounded-xl border border-white/50 bg-white/90 px-3 py-2 text-sm text-luxury-ink"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom complet"
            className="rounded-xl border border-white/50 bg-white/90 px-3 py-2 text-sm text-luxury-ink transition focus:border-luxury-orange/40 focus:outline-none"
          />
          <input
            required
            value={address1}
            onChange={(e) => setAddress1(e.target.value)}
            placeholder="Adresse"
            className="rounded-xl border border-white/50 bg-white/90 px-3 py-2 text-sm text-luxury-ink transition focus:border-luxury-orange/40 focus:outline-none"
          />
          <input
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ville"
            className="rounded-xl border border-white/50 bg-white/90 px-3 py-2 text-sm text-luxury-ink transition focus:border-luxury-orange/40 focus:outline-none"
          />
          <input
            required
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="Code postal"
            className="rounded-xl border border-white/50 bg-white/90 px-3 py-2 text-sm text-luxury-ink transition focus:border-luxury-orange/40 focus:outline-none"
          />
        </div>
        {(fieldErrors.name || fieldErrors.address1 || fieldErrors.city || fieldErrors.zip) ? (
          <p className="text-xs text-red-600">Merci de compléter les champs adresse.</p>
        ) : null}

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">Code pays (ISO)</label>
          <input
            required
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
            placeholder="FR"
            className="mt-2 w-24 rounded-xl border border-white/50 bg-white/90 px-3 py-2 text-sm text-luxury-ink transition focus:border-luxury-orange/40 focus:outline-none"
          />
          {fieldErrors.countryCode ? <p className="mt-1 text-xs text-red-600">{fieldErrors.countryCode}</p> : null}
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/75 px-4 py-3 text-sm">
          <p className="text-luxury-muted">
            Produit: <span className="font-medium text-luxury-ink">{selectedProduct?.name ?? '—'}</span>
          </p>
          <p className="mt-1 text-luxury-muted">
            Variante: <span className="font-medium text-luxury-ink">{selectedVariant?.name ?? '—'}</span>
          </p>
          <p className="mt-1 text-luxury-muted">
            Total estimé: <span className="font-semibold text-luxury-ink">{money(estimatedTotal, selectedVariant?.currency ?? 'EUR')}</span>
          </p>
        </div>
        {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting || !variantId}
          className="inline-flex items-center justify-center rounded-full border border-luxury-orange/35 bg-luxury-orange px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:brightness-95 disabled:opacity-60"
        >
          {submitting ? 'Envoi...' : 'Valider la commande'}
        </button>
      </form>
    </div>
  );
}
