import { createAdminClient } from '@/lib/supabase/admin';

type ProductWithId = { id: number; name?: string | null };

type ProductOrderRow = {
  product_id: number;
  sort_order: number;
};

export async function getPrintfulProductOrderRows(): Promise<ProductOrderRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('printful_product_sort_order')
    .select('product_id, sort_order')
    .order('sort_order', { ascending: true });

  if (error) return [];
  return (data ?? []) as ProductOrderRow[];
}

export async function sortPrintfulProducts<T extends ProductWithId>(products: T[]): Promise<T[]> {
  const orderRows = await getPrintfulProductOrderRows();
  const rankById = new Map<number, number>();
  orderRows.forEach((row, idx) => {
    rankById.set(row.product_id, row.sort_order * 1000 + idx);
  });

  const enriched = products.map((product, idx) => ({
    product,
    idx,
    rank: rankById.has(product.id) ? (rankById.get(product.id) as number) : Number.MAX_SAFE_INTEGER,
  }));

  enriched.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.idx - b.idx;
  });

  return enriched.map((entry) => entry.product);
}

export async function savePrintfulProductOrder(productIds: number[]): Promise<void> {
  const admin = createAdminClient();
  const rows = productIds.map((productId, idx) => ({
    product_id: productId,
    sort_order: (idx + 1) * 10,
    updated_at: new Date().toISOString(),
  }));

  if (rows.length === 0) return;
  const { error } = await admin.from('printful_product_sort_order').upsert(rows, { onConflict: 'product_id' });
  if (error) {
    throw new Error(error.message || 'Impossible de sauvegarder l’ordre des produits.');
  }
}
