'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Package, Plus, X } from 'lucide-react';

import { formatBoutiquePrice, type BoutiqueCategory } from '@/lib/boutique-format';

/** Produit de la grille (D02) : prix de vente Printful calculés côté serveur (catalogue en cache). */
type ProductInput = {
  id: number;
  name: string;
  image: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  currency?: string;
  category?: BoutiqueCategory;
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

type CartLine = {
  productId: number;
  variantId: number;
  quantity: number;
  productName: string;
  variantName: string;
};

const RECIPIENT_STORAGE_KEY = 'fitmangas.printful.recipient.v1';
const CART_STORAGE_KEY = 'fitmangas.printful.cart.v1';

function money(value: number, currency: string, locale = 'fr-FR'): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currency || 'EUR' }).format(value);
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

export function BoutiqueOrderComposer({
  products,
  lang = 'fr',
  ordersCount = 0,
  inProgressCount = 0,
}: {
  products: ProductInput[];
  lang?: 'fr' | 'en' | 'es';
  ordersCount?: number;
  inProgressCount?: number;
}) {
  const [category, setCategory] = useState<'all' | BoutiqueCategory>('all');
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
  const [cartItems, setCartItems] = useState<CartLine[]>([]);
  const [addressLocked, setAddressLocked] = useState(false);
  const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'fr-FR';
  const t =
    lang === 'en'
      ? { cart: 'Cart', products: 'product', detail: 'Product detail', loading: 'Loading...', chooseVariant: 'Choose a variant', variant: 'Variant', quantity: 'Quantity', fullName: 'Full name', address: 'Address', city: 'City', zip: 'Zip code', country: 'Country code (ISO)', edit: 'Edit', product: 'Product', estTotal: 'Estimated total', pending: 'Pending cart', item: 'item(s)', addContinue: 'Add and continue', addOrder: 'Add and checkout', sending: 'Sending...', added: 'Product added to cart. Your info is saved.', created: 'draft created. Payment confirmation is still required.', unavailable: 'Image unavailable', unknownError: 'Unknown error', createImpossible: 'Unable to create order', productFallback: 'Product', kicker: 'FitMangas shop', title: 'The shop', subtitle: 'Pieces made for moving, printed on demand and delivered to your door.', orders: 'My orders', inProgress: 'In progress', all: 'All', cat: { bouger: 'For moving', accessoires: 'Accessories', quotidien: 'Everyday' }, open: 'See the product' }
      : lang === 'es'
        ? { cart: 'Carrito', products: 'producto', detail: 'Detalle producto', loading: 'Cargando...', chooseVariant: 'Elegir variante', variant: 'Variante', quantity: 'Cantidad', fullName: 'Nombre completo', address: 'Dirección', city: 'Ciudad', zip: 'Código postal', country: 'Código país (ISO)', edit: 'Editar', product: 'Producto', estTotal: 'Total estimado', pending: 'Carrito pendiente', item: 'artículo(s)', addContinue: 'Añadir y continuar', addOrder: 'Añadir y pagar', sending: 'Enviando...', added: 'Producto añadido al carrito. Tu información está guardada.', created: 'borrador creado. Falta confirmar el pago.', unavailable: 'Imagen no disponible', unknownError: 'Error desconocido', createImpossible: 'No se puede crear', productFallback: 'Producto', kicker: 'Tienda FitMangas', title: 'La tienda', subtitle: 'Piezas pensadas para moverte, fabricadas bajo pedido y enviadas a tu casa.', orders: 'Mis pedidos', inProgress: 'En curso', all: 'Todo', cat: { bouger: 'Para moverte', accessoires: 'Accesorios', quotidien: 'Para el día a día' }, open: 'Ver el producto' }
        : { cart: 'Panier', products: 'produit', detail: 'Détail produit', loading: 'Chargement...', chooseVariant: 'Choisir une variante', variant: 'Variante', quantity: 'Quantité', fullName: 'Nom complet', address: 'Adresse', city: 'Ville', zip: 'Code postal', country: 'Code pays (ISO)', edit: 'Modifier', product: 'Produit', estTotal: 'Total estimé', pending: 'Panier en attente', item: 'article(s)', addContinue: 'Ajouter et continuer', addOrder: 'Ajouter et commander', sending: 'Envoi...', added: 'Produit ajouté au panier. Tes informations sont conservées.', created: 'brouillon créé. Le paiement reste à confirmer.', unavailable: 'Image indisponible', unknownError: 'Erreur inconnue', createImpossible: 'Création impossible', productFallback: 'Produit', kicker: 'Boutique FitMangas', title: 'La boutique', subtitle: 'Des pièces pensées pour bouger, fabriquées à la demande et livrées chez toi.', orders: 'Mes commandes', inProgress: 'En cours', all: 'Tout', cat: { bouger: 'Pour bouger', accessoires: 'Accessoires', quotidien: 'Au quotidien' }, open: 'Voir le produit' };

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );
  const selectedVariant = useMemo(
    () => (detail?.variants ?? []).find((v) => v.id === variantId) ?? null,
    [detail?.variants, variantId],
  );
  const estimatedTotal = (selectedVariant?.retailPrice ?? 0) * quantity;
  const categories = useMemo(() => {
    const order: BoutiqueCategory[] = ['bouger', 'accessoires', 'quotidien'];
    return order.filter((c) => products.some((p) => p.category === c));
  }, [products]);
  const visibleProducts = useMemo(
    () => (category === 'all' ? products : products.filter((p) => p.category === category)),
    [products, category],
  );

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
    try {
      const rawRecipient = window.localStorage.getItem(RECIPIENT_STORAGE_KEY);
      if (rawRecipient) {
        const parsed = JSON.parse(rawRecipient) as {
          name?: string;
          address1?: string;
          city?: string;
          zip?: string;
          countryCode?: string;
          locked?: boolean;
        };
        if (parsed.name) setName(parsed.name);
        if (parsed.address1) setAddress1(parsed.address1);
        if (parsed.city) setCity(parsed.city);
        if (parsed.zip) setZip(parsed.zip);
        if (parsed.countryCode) setCountryCode(parsed.countryCode);
        setAddressLocked(Boolean(parsed.locked));
      }
      const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);
      if (rawCart) {
        const parsedCart = JSON.parse(rawCart) as CartLine[];
        if (Array.isArray(parsedCart)) setCartItems(parsedCart);
      }
    } catch {
      // Ignore storage errors.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        RECIPIENT_STORAGE_KEY,
        JSON.stringify({ name, address1, city, zip, countryCode, locked: addressLocked }),
      );
    } catch {
      // Ignore storage errors.
    }
  }, [name, address1, city, zip, countryCode, addressLocked]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore storage errors.
    }
  }, [cartItems]);

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
      setError(e instanceof Error ? e.message : t.unknownError);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!selectedProductId || !variantId) {
      nextErrors.variant = t.chooseVariant;
    }
    if (!name.trim()) nextErrors.name = `${t.fullName} requis.`;
    if (!address1.trim()) nextErrors.address1 = `${t.address} requise.`;
    if (!city.trim()) nextErrors.city = `${t.city} requise.`;
    if (!zip.trim()) nextErrors.zip = `${t.zip} requis.`;
    if (!countryCode.trim()) nextErrors.countryCode = `${t.country} requis.`;
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const productName = selectedProduct?.name ?? `${t.productFallback} #${selectedProductId}`;
      const variantName = selectedVariant?.name ?? `${t.variant} #${variantId}`;

      if (submitIntent === 'continue') {
        setCartItems((prev) => {
          const idx = prev.findIndex((item) => item.variantId === (variantId as number));
          if (idx < 0) {
            return [
              ...prev,
              {
                productId: selectedProductId as number,
                variantId: variantId as number,
                quantity,
                productName,
                variantName,
              },
            ];
          }
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            quantity: Math.max(1, Math.min(20, next[idx].quantity + quantity)),
          };
          return next;
        });
        setAddressLocked(true);
        setMessage(t.added);
        setOpenProductModal(false);
        return;
      }

      const payloadItems = [...cartItems];
      const existingIdx = payloadItems.findIndex((item) => item.variantId === (variantId as number));
      if (existingIdx >= 0) {
        payloadItems[existingIdx] = {
          ...payloadItems[existingIdx],
          quantity: Math.max(1, Math.min(20, payloadItems[existingIdx].quantity + quantity)),
        };
      } else {
        payloadItems.push({
          productId: selectedProductId as number,
          variantId: variantId as number,
          quantity,
          productName,
          variantName,
        });
      }

      const res = await fetch('/api/printful/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: payloadItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          recipient: { name, address1, city, zip, countryCode },
        }),
      });
      const json = (await res.json()) as { order?: { id: number }; error?: string };
      if (!res.ok || !json.order) throw new Error(json.error ?? t.createImpossible);
      setCartItems([]);
      setAddressLocked(true);
      setMessage(`Commande #${json.order.id} : ${t.created}`);
      setOpenProductModal(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.unknownError);
    } finally {
      setSubmitting(false);
    }
  }

  function renderProductCard(p: ProductInput) {
    const transparentImage = isTransparentImage(p.image);
    const price = formatBoutiquePrice({ minPrice: p.minPrice ?? null, maxPrice: p.maxPrice ?? null, currency: p.currency ?? 'EUR' }, locale);
    const open = () => {
      setSelectedProductId(p.id);
      setOpenProductModal(true);
    };
    return (
      <article
        key={p.id}
        className="group flex flex-col overflow-hidden rounded-[1.6rem] bg-white shadow-[0_14px_34px_-20px_rgba(29,26,23,0.32)] transition duration-200 hover:-translate-y-0.5"
      >
        <button type="button" onClick={open} className="block text-left" aria-label={`${t.open} : ${p.name}`}>
          <div className={`relative aspect-[4/4.1] overflow-hidden ${transparentImage ? 'bg-[#f3ece4]' : 'bg-[#efe6dc]'}`}>
            {p.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.image}
                alt=""
                loading="lazy"
                className={`h-full w-full transition duration-300 group-hover:scale-[1.03] ${transparentImage ? 'object-contain p-4' : 'object-cover'}`}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[12px] text-luxury-soft">{t.unavailable}</div>
            )}
          </div>
        </button>
        <div className="flex flex-1 flex-col p-4">
          <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-luxury-ink">{p.name}</p>
          {p.category ? <p className="mt-0.5 text-[12px] text-luxury-muted">{t.cat[p.category]}</p> : null}
          <div className="mt-auto flex items-center justify-between pt-3">
            <p className="text-[15px] font-bold text-luxury-ink">{price ?? ''}</p>
            <button
              type="button"
              onClick={open}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-luxury-ink text-white transition hover:bg-luxury-orange"
              aria-label={`${t.open} : ${p.name}`}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </article>
    );
  }

  const chipClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
      active ? 'bg-luxury-ink text-white' : 'bg-white/80 text-luxury-ink/70 shadow-[0_6px_16px_-12px_rgba(29,26,23,0.3)] hover:text-luxury-ink'
    }`;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <p className="fm-kicker">{t.kicker}</p>
          <h1 className="hero-signature-title mt-2 text-[2.6rem] text-luxury-ink md:text-[4rem]">{t.title}</h1>
          <p className="hero-signature-subtitle mt-2 text-[14px]">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {inProgressCount > 0 ? (
            <Link
              href="/compte/boutique/en-cours"
              className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-luxury-ink shadow-[0_6px_16px_-10px_rgba(29,26,23,0.3)]"
            >
              <span className="h-2 w-2 rounded-full bg-luxury-orange" aria-hidden />
              {t.inProgress} · {inProgressCount}
            </Link>
          ) : null}
          <Link
            href="/compte/boutique/commandes"
            className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-luxury-ink shadow-[0_6px_16px_-10px_rgba(29,26,23,0.3)]"
          >
            <Package size={14} aria-hidden />
            {t.orders}
            {ordersCount > 0 ? ` · ${ordersCount}` : ''}
          </Link>
        </div>
      </section>

      {cartItems.length > 0 ? (
        <div className="flex items-center justify-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-luxury-orange/35 bg-white/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-luxury-ink shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
            <span className="h-2 w-2 rounded-full bg-luxury-orange" />
            {t.cart}: {cartItems.length} {t.products}{cartItems.length > 1 ? 's' : ''}
          </div>
        </div>
      ) : null}

      {categories.length > 1 ? (
        <div className="flex flex-wrap gap-2 px-1" role="tablist">
          <button type="button" role="tab" aria-selected={category === 'all'} onClick={() => setCategory('all')} className={chipClass(category === 'all')}>
            {t.all} · {products.length}
          </button>
          {categories.map((c) => (
            <button key={c} type="button" role="tab" aria-selected={category === c} onClick={() => setCategory(c)} className={chipClass(category === c)}>
              {t.cat[c]}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">{visibleProducts.map((p) => renderProductCard(p))}</div>

      {message && !openProductModal ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">{message}</p> : null}

      {openProductModal && selectedProduct ? (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          data-overlay-dismiss
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpenProductModal(false);
          }}
        >
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[30px] border border-white/60 bg-white p-5 shadow-[0_24px_64px_rgba(0,0,0,0.25)] md:p-7">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.2em] text-luxury-soft">{t.detail}</p>
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
                      <div className="flex h-full items-center justify-center text-sm text-luxury-soft">{t.unavailable}</div>
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
                {formatBoutiquePrice({ minPrice: selectedProduct.minPrice ?? null, maxPrice: selectedProduct.maxPrice ?? null, currency: selectedProduct.currency ?? 'EUR' }, locale) ? (
                  <p className="text-[15px] font-semibold text-luxury-ink">
                    {formatBoutiquePrice({ minPrice: selectedProduct.minPrice ?? null, maxPrice: selectedProduct.maxPrice ?? null, currency: selectedProduct.currency ?? 'EUR' }, locale)}
                  </p>
                ) : null}

                <div>
                  <label className="fm-label text-luxury-soft">{t.variant}</label>
                  {loadingDetail ? (
                    <div className="mt-2 flex items-center gap-2 text-sm text-luxury-muted">
                      <Loader2 size={14} className="animate-spin" /> {t.loading}
                    </div>
                  ) : (
                    <select
                      value={variantId ?? ''}
                      onChange={(e) => setVariantId(Number(e.target.value))}
                      className="mt-2 w-full rounded-xl border border-white/50 bg-white/90 px-3 py-2 text-sm text-luxury-ink transition focus:border-luxury-orange/40 focus:outline-none"
                    >
                      <option value="" disabled>
                        {t.chooseVariant}
                      </option>
                      {(detail?.variants ?? []).map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} · {money(v.retailPrice, v.currency, locale)}
                        </option>
                      ))}
                    </select>
                  )}
                  {fieldErrors.variant ? <p className="mt-1 text-xs text-red-600">{fieldErrors.variant}</p> : null}
                </div>

                <div>
                  <label className="fm-label text-luxury-soft">{t.quantity}</label>
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
                    readOnly={addressLocked}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.fullName}
                    className={`rounded-xl border border-white/50 bg-white/90 px-3 py-2 text-sm text-luxury-ink transition focus:border-luxury-orange/40 focus:outline-none ${
                      addressLocked ? 'cursor-not-allowed opacity-80' : ''
                    }`}
                  />
                  <input
                    required
                    readOnly={addressLocked}
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                    placeholder={t.address}
                    className={`rounded-xl border border-white/50 bg-white/90 px-3 py-2 text-sm text-luxury-ink transition focus:border-luxury-orange/40 focus:outline-none ${
                      addressLocked ? 'cursor-not-allowed opacity-80' : ''
                    }`}
                  />
                  <input
                    required
                    readOnly={addressLocked}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t.city}
                    className={`rounded-xl border border-white/50 bg-white/90 px-3 py-2 text-sm text-luxury-ink transition focus:border-luxury-orange/40 focus:outline-none ${
                      addressLocked ? 'cursor-not-allowed opacity-80' : ''
                    }`}
                  />
                  <input
                    required
                    readOnly={addressLocked}
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder={t.zip}
                    className={`rounded-xl border border-white/50 bg-white/90 px-3 py-2 text-sm text-luxury-ink transition focus:border-luxury-orange/40 focus:outline-none ${
                      addressLocked ? 'cursor-not-allowed opacity-80' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="fm-label text-luxury-soft">{t.country}</label>
                  <input
                    required
                    readOnly={addressLocked}
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                    placeholder="FR"
                    className={`mt-2 w-24 rounded-xl border border-white/50 bg-white/90 px-3 py-2 text-sm text-luxury-ink transition focus:border-luxury-orange/40 focus:outline-none ${
                      addressLocked ? 'cursor-not-allowed opacity-80' : ''
                    }`}
                  />
                  {addressLocked ? (
                    <button
                      type="button"
                      onClick={() => setAddressLocked(false)}
                      className="ml-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-luxury-orange"
                    >
                      {t.edit}
                    </button>
                  ) : null}
                  {fieldErrors.countryCode ? <p className="mt-1 text-xs text-red-600">{fieldErrors.countryCode}</p> : null}
                </div>

                <div className="rounded-2xl border border-white/60 bg-white/75 px-4 py-3 text-sm">
                  <p className="text-luxury-muted">
                    {t.product}: <span className="font-medium text-luxury-ink">{selectedProduct?.name ?? '—'}</span>
                  </p>
                  <p className="mt-1 text-luxury-muted">
                    {t.variant}: <span className="font-medium text-luxury-ink">{selectedVariant?.name ?? '—'}</span>
                  </p>
                  <p className="mt-1 text-luxury-muted">
                    {t.estTotal}: <span className="font-semibold text-luxury-ink">{money(estimatedTotal, selectedVariant?.currency ?? 'EUR', locale)}</span>
                  </p>
                  <p className="mt-1 text-luxury-muted">
                    {t.pending}: <span className="font-semibold text-luxury-ink">{cartItems.length} {t.item}</span>
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
                    {submitting && submitIntent === 'continue' ? t.sending : t.addContinue}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !variantId}
                    onClick={() => setSubmitIntent('finalize')}
                    className="w-full rounded-full border border-black/15 bg-black px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:brightness-110 disabled:opacity-60"
                  >
                    {submitting && submitIntent === 'finalize'
                      ? t.sending
                      : `${t.addOrder}${cartItems.length > 0 ? ` (${cartItems.length + 1})` : ''}`}
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
