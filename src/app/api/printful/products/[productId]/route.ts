import { NextResponse } from 'next/server';

import { getPrintfulProductDetail } from '@/lib/printful';

type Params = { params: Promise<{ productId: string }> };

export async function GET(_: Request, { params }: Params) {
  const p = await params;
  const id = Number(p.productId);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'productId invalide' }, { status: 400 });
  }
  try {
    const detail = await getPrintfulProductDetail(id);
    if (!detail) {
      return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });
    }
    return NextResponse.json({ product: detail });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
