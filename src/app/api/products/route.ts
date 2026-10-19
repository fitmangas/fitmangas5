import { NextResponse } from 'next/server';
import { publicServerError } from '@/lib/http/public-error';

import { getPrintfulProducts, mapProductImage, parseMoney } from '@/lib/printful';

export async function GET() {
  try {
    const products = await getPrintfulProducts();
    const mapped = products.map((p) => ({
      id: p.id,
      externalId: p.external_id,
      name: p.name,
      image: mapProductImage(p),
      // Printful /store/products ne renvoie pas toujours le prix global; fallback 0.
      price: parseMoney((p as unknown as { retail_price?: string }).retail_price ?? 0),
      variants: p.variants,
      synced: p.synced,
    }));
    return NextResponse.json({ products: mapped });
  } catch (error) {
    return publicServerError('products', error);
  }
}
