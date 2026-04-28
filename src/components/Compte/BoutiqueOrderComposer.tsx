'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Loader2, X } from 'lucide-react';

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
  galleryUrls: string[];
  variants: Variant[];
};

function money(value: number, currency: string): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(value);
}

const transparencyCache = new Map<string, boolean>();

async function detectTransparentPixels(imageUrl: string): Promise<boolean> {
  if (transparencyCache.has(imageUrl)) return transparencyCache.get(imageUrl) ?? false;
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = imageUrl;
    });
    const width = loaded.naturalWidth || loaded.width || 0;
    const height = loaded.naturalHeight || loaded.height || 0;
    if (width <= 0 || height <= 0) {
      transparencyCache.set(imageUrl, false);
      return false;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      transparencyCache.set(imageUrl, false);
      return false;
    }
    ctx.drawImage(loaded, 0, 0, width, height);
    const { data } = ctx.getImageData(0, 0, width, height);
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] < 245) {
        transparencyCache.set(imageUrl, true);
        return true;
      }
    }
  } catch {
    // Fallback: origine externe non lisible par canvas.
  }
  transparencyCache.set(imageUrl, false);
  return false;
}

export function BoutiqueOrderComposer({ products }: { products: ProductInput[] }) {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [openProductModal, setOpenProductModal] = useState(false);
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
  const [submitIntent, setSubmitIntent] = useState<'continue' | 'finalize'>('finalize');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [transparentByUrl, setTransparentByUrl] = useState<Record<string, boolean>>({});
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );
  const selectedVariant = useMemo(
    () => (detail?.variants ?? []).find((v) => v.id === variantId) ?? null,
    [detail?.variants, variantId],
  );
  const estimatedTotal = (selectedVariant?.retailPrice ?? 0) * quantity;
  const bestSellerProducts = useMemo(() => {
    const used = new Set<number>();
    const pick = (keywords: string[]) => {
      const found = products.find(
        (p) => !used.has(p.id) && keywords.some((kw) => p.name.toLowerCase().includes(kw)),
      );
      if (found) used.add(found.id);
      return found;
    };

    const picks = [
      pick(['pilates tapis', 'tapis pilates', 'pilates mat', 'mat']),
      pick(['hat style', 'bucket hat', 'hat', 'casquette']),
      pick(['padded sports bra', 'sports bra', 'brassière']),
    ].filter(Boolean) as ProductInput[];

    if (picks.length < 3) {
      for (const p of products) {
        if (picks.length >= 3) break;
        if (used.has(p.id)) continue;
        picks.push(p);
        used.add(p.id);
      }
    }
    return picks;
  }, [products]);
  const bestSellerIds = useMemo(() => new Set(bestSellerProducts.map((p) => p.id)), [bestSellerProducts]);
  const fullBoutiqueProducts = useMemo(
    () => products.filter((p) => !bestSellerIds.has(p.id)),
    [products, bestSellerIds],
  );
  const heroProduct = bestSellerProducts[0] ?? products[0] ?? null;

  useEffect(() => {
    if (selectedProductId == null) {
      setDetail(null);
      setVariantId(null);
      setActivePreviewUrl(null);
      return;
    }
    void loadProductDetail(selectedProductId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductId]);

  useEffect(() => {
    let cancelled = false;
    const urls = Array.from(new Set(products.map((p) => p.image).filter(Boolean))) as string[];
    if (urls.length === 0) return;

    void (async () => {
      const results = await Promise.all(
        urls.map(async (url) => {
          const transparent = await detectTransparentPixels(url);
          return [url, transparent] as const;
        }),
      );
      if (cancelled) return;
      setTransparentByUrl((prev) => {
        const next = { ...prev };
        for (const [url, transparent] of results) next[url] = transparent;
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [products]);

  function isTransparentImage(url: string | null): boolean {
    if (!url) return false;
    return transparentByUrl[url] === true;
  }

  async function loadProductDetail(productId: number) {
    setLoadingDetail(true);
    setError(null);
    try {
      const res = await fetch(`/api/printful/products/${productId}`);
      const json = (await res.json()) as { product?: ProductDetail; error?: string };
      if (!res.ok || !json.product) throw new Error(json.error ?? 'Impossible de charger les variantes');
      setDetail(json.product);
      const previews = [json.product.thumbnailUrl, ...(json.product.galleryUrls ?? []), selectedProduct?.image]
        .filter((u): u is string => Boolean(u))
        .filter((u, i, arr) => arr.indexOf(u) === i);
      setActivePreviewUrl(previews[0] ?? selectedProduct?.image ?? null);
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
      if (submitIntent === 'continue') {
        setMessage(`Ajouté au panier (commande #${json.order.id}). Tu peux continuer tes achats.`);
      } else {
        setMessage(`Commande #${json.order.id} créée avec succès.`);
      }
      setOpenProductModal(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  }

  function renderProductCard(p: ProductInput, compact = false) {
    const selected = selectedProductId === p.id;
    const transparentImage = isTransparentImage(p.image);
    const isCopperVacuum = p.name.toLowerCase().includes('copper vacuum');
    return (
      <button
        key={p.id}
        type="button"
        onClick={() => {
          setSelectedProductId(p.id);
          setOpenProductModal(true);
        }}
        className={`group overflow-hidden rounded-[22px] border text-left transition duration-300 ${
          selected
            ? 'border-luxury-orange/55 bg-white shadow-[0_14px_32px_rgba(255,122,0,0.18)]'
            : 'border-black/8 bg-white shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:border-luxury-orange/35 hover:shadow-[0_12px_26px_rgba(0,0,0,0.12)]'
        }`}
      >
        <div className={`${compact ? 'aspect-[5/4]' : 'aspect-[4/3]'} ${transparentImage ? 'bg-transparent' : 'bg-[#f5f1eb]'}`}>
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.image}
              alt={p.name}
              className={`h-full w-full transition duration-300 group-hover:scale-[1.02] ${
                transparentImage ? 'object-contain p-2' : 'object-cover'
              } ${isCopperVacuum ? 'scale-[0.9]' : ''}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-luxury-soft">Mockup indisponible</div>
          )}
        </div>
        <div className="space-y-1 p-3">
          <p className="line-clamp-1 text-[1.05rem] font-semibold tracking-tight text-luxury-ink">{p.name}</p>
          <p className="text-[11px] tracking-[0.08em] text-[#f3a11a]">★★★★★</p>
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-[34px] border border-white/55 bg-white/85 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.12)] md:p-6">
          <div className="grid gap-6 md:grid-cols-[1.08fr_1fr] md:items-stretch">
            <div className="flex flex-col justify-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Best Seller Drop</p>
              <div className="mt-3">
                <h3 className="text-[4.8rem] font-black leading-[0.82] tracking-[-0.03em] text-luxury-ink md:text-[6.4rem]">Fresh &amp;</h3>
                <div className="mt-1 flex items-end">
                  <h3 className="translate-y-1 text-[4.8rem] font-semibold leading-[0.82] tracking-[-0.02em] text-[#606066] md:translate-y-2 md:text-[6.4rem]">
                    Stylish
                  </h3>
                </div>
              </div>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-luxury-muted">
                Les pièces FitMangas les plus demandées du moment, sélectionnées pour bouger avec style.
              </p>
            </div>

            <div
              className={`relative overflow-hidden rounded-[28px] border border-white/55 p-2 ${
                isTransparentImage(heroProduct?.image ?? null) ? 'bg-transparent' : 'bg-[#f5f1eb]'
              }`}
            >
              <div className="relative aspect-[4/4.4] overflow-hidden rounded-[24px] bg-white/40">
                {heroProduct?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroProduct.image}
                    alt={heroProduct.name}
                    className={`h-full w-full ${isTransparentImage(heroProduct.image) ? 'object-contain p-3' : 'object-cover'}`}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-luxury-soft">Best seller</div>
                )}
              </div>
            </div>
          </div>

          {heroProduct ? (
            <div className="mt-3 flex justify-start">
              <button
                type="button"
                onClick={() => {
                  setSelectedProductId(heroProduct.id);
                  setOpenProductModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[#131313] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:brightness-110"
              >
                Explorer les best sellers
                <ArrowDownRight size={14} />
              </button>
            </div>
          ) : null}
          <div className="mt-3 grid items-center gap-4 md:grid-cols-3">
            {bestSellerProducts.map((p) => (
              <button
                key={`collection-${p.id}`}
                type="button"
                onClick={() => {
                  setSelectedProductId(p.id);
                  setOpenProductModal(true);
                }}
                className={`group flex min-h-[142px] items-center gap-4 rounded-[22px] border p-4 text-left transition ${
                  selectedProductId === p.id
                    ? 'border-luxury-orange/55 bg-white shadow-[0_10px_24px_rgba(255,122,0,0.16)]'
                    : 'border-black/8 bg-white shadow-[0_7px_16px_rgba(0,0,0,0.08)] hover:border-luxury-orange/35 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)]'
                }`}
              >
                <div
                  className={`h-28 w-28 shrink-0 overflow-hidden rounded-[18px] ${
                    isTransparentImage(p.image) ? 'bg-transparent' : 'bg-[#f5f1eb]'
                  }`}
                >
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image}
                      alt={p.name}
                      className={`h-full w-full ${isTransparentImage(p.image) ? 'object-contain p-1.5' : 'object-cover'}`}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-luxury-soft">Image</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-[1.9rem] font-semibold leading-[0.88] tracking-tight text-luxury-ink">{p.name}</p>
                  <p className="mt-2 text-sm text-luxury-muted">Best Seller Collection</p>
                  <p className="mt-1 text-[11px] tracking-[0.08em] text-[#f3a11a]">★★★★★</p>
                </div>
                <ArrowUpRight size={16} className="ml-auto shrink-0 text-luxury-ink/70 transition group-hover:text-luxury-ink" />
              </button>
            ))}
          </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[2.35rem] font-semibold tracking-tight text-luxury-ink">Boutique complète</h3>
        </div>
        {fullBoutiqueProducts.length === 0 ? (
          <p className="text-sm text-luxury-muted">Tous les produits sont déjà affichés en best sellers.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {fullBoutiqueProducts.map((p) => renderProductCard(p))}
          </div>
        )}
      </section>

      {openProductModal && selectedProduct ? (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpenProductModal(false);
          }}
        >
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[30px] border border-white/60 bg-white p-5 shadow-[0_24px_64px_rgba(0,0,0,0.25)] md:p-7">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.2em] text-luxury-soft">Détail produit</p>
              <button
                type="button"
                onClick={() => setOpenProductModal(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-luxury-ink transition hover:bg-black/5"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="grid gap-6 md:grid-cols-[1fr_1fr]">
              <div>
                {(() => {
                  const previewUrls = [activePreviewUrl, detail?.thumbnailUrl, ...(detail?.galleryUrls ?? []), selectedProduct.image]
                    .filter((u): u is string => Boolean(u))
                    .filter((u, i, arr) => arr.indexOf(u) === i)
                    .slice(0, 6);
                  const mainPreview = activePreviewUrl ?? previewUrls[0] ?? selectedProduct.image;
                  return (
                    <>
                <div
                  className={`overflow-hidden rounded-[22px] border border-white/60 ${
                    isTransparentImage(mainPreview) ? 'bg-transparent' : 'bg-[#f5f1eb]'
                  }`}
                >
                  <div className="aspect-[4/4.6]">
                    {mainPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mainPreview}
                        alt={selectedProduct.name}
                        className={`h-full w-full ${isTransparentImage(mainPreview) ? 'object-contain p-2' : 'object-cover'}`}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-luxury-soft">Mockup indisponible</div>
                    )}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {previewUrls.slice(0, 3).map((previewUrl, i) => (
                    <button
                      key={`${previewUrl}-${i}`}
                      type="button"
                      onClick={() => setActivePreviewUrl(previewUrl)}
                      className={`h-20 overflow-hidden rounded-xl border border-white/60 ${
                        isTransparentImage(previewUrl) ? 'bg-transparent' : 'bg-[#f5f1eb]'
                      } ${
                        mainPreview === previewUrl ? 'ring-2 ring-luxury-orange/50' : ''
                      }`}
                    >
                      {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl}
                          alt={`${selectedProduct.name} ${i}`}
                          className={`h-full w-full ${isTransparentImage(previewUrl) ? 'object-contain p-1' : 'object-cover'}`}
                        />
                      ) : null}
                    </button>
                  ))}
                </div>
                    </>
                  );
                })()}
              </div>

              <div className="space-y-4">
                <h4 className="text-3xl font-semibold tracking-tight text-luxury-ink">{selectedProduct.name}</h4>
                <p className="text-sm text-luxury-muted">★★★★★ • Top reviews</p>

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

                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={submitting || !variantId}
                    onClick={() => setSubmitIntent('continue')}
                    className="w-full rounded-full border border-luxury-orange/35 bg-luxury-orange px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:brightness-95 disabled:opacity-60"
                  >
                    {submitting && submitIntent === 'continue' ? 'Envoi...' : 'Ajouter et continuer'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !variantId}
                    onClick={() => setSubmitIntent('finalize')}
                    className="w-full rounded-full border border-black/15 bg-black px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:brightness-110 disabled:opacity-60"
                  >
                    {submitting && submitIntent === 'finalize' ? 'Envoi...' : 'Ajouter et commander'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
