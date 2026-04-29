type PrintfulEnvelope<T> = {
  code: number;
  result: T;
  error?: { message?: string };
  paging?: {
    total?: number;
    offset?: number;
    limit?: number;
  };
};

type PrintfulSyncVariant = {
  id: number;
  name: string;
  retail_price: string | null;
  currency: string | null;
  availability_status?: string | null;
};

type PrintfulProductDetailResult = {
  sync_product?: {
    id: number;
    name: string;
    thumbnail_url?: string | null;
    files?: Array<{
      preview_url?: string | null;
      thumbnail_url?: string | null;
      url?: string | null;
    }>;
  };
  sync_variants?: Array<
    PrintfulSyncVariant & {
      product?: {
        image?: string | null;
      };
      files?: Array<{
        preview_url?: string | null;
        thumbnail_url?: string | null;
        url?: string | null;
      }>;
    }
  >;
};

export type PrintfulProduct = {
  id: number;
  external_id: string | null;
  name: string;
  thumbnail_url: string | null;
  is_ignored?: boolean;
  variants: number;
  synced: number;
};

export type PrintfulOrderItem = {
  id?: string | number;
  name?: string;
  variant_id?: number;
  quantity?: number;
  retail_price?: string;
  price?: string;
  cost?: string;
};

export type PrintfulOrder = {
  id: number;
  external_id: string | null;
  status: string;
  created: string;
  updated: string;
  recipient?: {
    name?: string;
    email?: string;
    country_name?: string;
    phone?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state_code?: string;
    country_code?: string;
    zip?: string;
  };
  packing_slip?: {
    email?: string;
  };
  shipments?: Array<{
    id?: string | number;
    carrier?: string;
    service?: string;
    tracking_number?: string;
    tracking_url?: string;
    shipped_at?: string;
    created?: string;
  }>;
  retail_costs?: {
    subtotal?: string;
    discount?: string;
    shipping?: string;
    tax?: string;
    total?: string;
    currency?: string;
  };
  costs?: {
    subtotal?: string;
    shipping?: string;
    tax?: string;
    total?: string;
    currency?: string;
  };
  items?: PrintfulOrderItem[];
  invoice_url?: string | null;
};

export type PrintfulProductVariant = {
  id: number;
  name: string;
  retailPrice: number;
  currency: string;
  availability: string;
};

export type PrintfulProductDetail = {
  id: number;
  name: string;
  thumbnailUrl: string | null;
  galleryUrls: string[];
  variants: PrintfulProductVariant[];
};

export type PrintfulCreateOrderInput = {
  externalId?: string;
  recipient: {
    name: string;
    email: string;
    address1: string;
    city: string;
    zip: string;
    countryCode: string;
  };
  items: Array<{
    syncVariantId: number;
    quantity: number;
  }>;
};

function getPrintfulConfig() {
  const token = process.env.PRINTFUL_API_TOKEN;
  const storeId = process.env.PRINTFUL_STORE_ID || null;
  if (!token) {
    throw new Error('PRINTFUL_API_TOKEN manquant.');
  }
  return { token, storeId };
}

async function printfulFetch<T>(path: string): Promise<T> {
  const { token, storeId } = getPrintfulConfig();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  if (storeId) headers['X-PF-Store-Id'] = storeId;
  const res = await fetch(`https://api.printful.com${path}`, {
    headers,
    cache: 'no-store',
  });

  const json = (await res.json().catch(() => null)) as PrintfulEnvelope<T> | null;
  if (!res.ok || !json || json.code !== 200) {
    const message = json?.error?.message ?? `Printful API error (${res.status})`;
    throw new Error(message);
  }
  return json.result;
}

async function printfulMutation<T>(path: string, method: 'POST' | 'PUT' | 'DELETE', body: unknown): Promise<T> {
  const { token, storeId } = getPrintfulConfig();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  if (storeId) headers['X-PF-Store-Id'] = storeId;
  const res = await fetch(`https://api.printful.com${path}`, {
    method,
    headers,
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const json = (await res.json().catch(() => null)) as PrintfulEnvelope<T> | null;
  if (!res.ok || !json || json.code !== 200) {
    const message = json?.error?.message ?? `Printful API error (${res.status})`;
    throw new Error(message);
  }
  return json.result;
}

export async function getPrintfulProducts(): Promise<PrintfulProduct[]> {
  const result = await printfulFetch<PrintfulProduct[]>('/store/products');
  return Array.isArray(result) ? result : [];
}

export async function getPrintfulOrders(limit = 50): Promise<PrintfulOrder[]> {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const result = await printfulFetch<PrintfulOrder[]>(`/store/orders?limit=${safeLimit}&offset=0`);
  return Array.isArray(result) ? result : [];
}

export async function getPrintfulOrderDetail(orderId: number): Promise<PrintfulOrder | null> {
  const safeId = Math.trunc(orderId);
  if (!Number.isFinite(safeId) || safeId <= 0) return null;
  const result = await printfulFetch<PrintfulOrder>(`/orders/${safeId}`);
  return result ?? null;
}

export async function getPrintfulProductDetail(productId: number): Promise<PrintfulProductDetail | null> {
  const result = await printfulFetch<PrintfulProductDetailResult>(`/store/products/${productId}`);
  const product = result?.sync_product;
  if (!product?.id) return null;
  const variantGallerySet = new Set<string>();
  const fallbackGallerySet = new Set<string>();
  const addUrl = (value: string | null | undefined) => {
    const url = value?.trim() ?? '';
    return url || null;
  };

  // Priorité aux mockups réellement choisis côté Printful (images des variantes).
  for (const variant of result?.sync_variants ?? []) {
    const variantImage = addUrl(variant.product?.image);
    if (variantImage) variantGallerySet.add(variantImage);
  }
  // Fallback uniquement si besoin.
  const thumb = addUrl(product.thumbnail_url);
  if (thumb) fallbackGallerySet.add(thumb);

  const variants = (result?.sync_variants ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    retailPrice: parseMoney(v.retail_price),
    currency: (v.currency ?? 'EUR').toUpperCase(),
    availability: (v.availability_status ?? 'active').toLowerCase(),
  }));
  return {
    id: product.id,
    name: product.name,
    thumbnailUrl: product.thumbnail_url ?? null,
    galleryUrls: [...variantGallerySet, ...fallbackGallerySet],
    variants,
  };
}

export async function createPrintfulOrder(input: PrintfulCreateOrderInput): Promise<PrintfulOrder> {
  const payload = {
    external_id: input.externalId ?? null,
    recipient: {
      name: input.recipient.name,
      email: input.recipient.email,
      address1: input.recipient.address1,
      city: input.recipient.city,
      zip: input.recipient.zip,
      country_code: input.recipient.countryCode,
    },
    items: input.items.map((i) => ({
      sync_variant_id: i.syncVariantId,
      quantity: i.quantity,
    })),
    confirm: true,
  };
  return await printfulMutation<PrintfulOrder>('/orders', 'POST', payload);
}

export function parseMoney(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function mapProductImage(product: PrintfulProduct): string | null {
  const url = product.thumbnail_url?.trim() ?? '';
  if (!url) return null;
  return url;
}
