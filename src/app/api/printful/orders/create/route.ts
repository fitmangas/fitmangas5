import { NextResponse } from 'next/server';

import { createPrintfulOrder } from '@/lib/printful';
import { createClient } from '@/lib/supabase/server';

type CreateOrderBody = {
  productId?: number;
  variantId?: number;
  quantity?: number;
  items?: Array<{
    productId?: number;
    variantId: number;
    quantity: number;
  }>;
  recipient: {
    name: string;
    address1: string;
    city: string;
    zip: string;
    countryCode: string;
  };
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as CreateOrderBody | null;
  if (!body) {
    return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 });
  }

  const quantity = Math.max(1, Math.min(20, Number(body.quantity) || 1));
  const variantId = Number(body.variantId);
  const productId = Number(body.productId);
  const recipient = body.recipient;

  const hasLegacySingleItem = Number.isFinite(variantId) && Number.isFinite(productId);
  const normalizedItems = Array.isArray(body.items)
    ? body.items
        .map((item) => ({
          syncVariantId: Number(item.variantId),
          quantity: Math.max(1, Math.min(20, Number(item.quantity) || 1)),
        }))
        .filter((item) => Number.isFinite(item.syncVariantId) && item.syncVariantId > 0)
    : [];

  if (!hasLegacySingleItem && normalizedItems.length === 0) {
    return NextResponse.json({ error: 'Aucun produit valide à commander.' }, { status: 400 });
  }
  if (!recipient?.name || !recipient.address1 || !recipient.city || !recipient.zip || !recipient.countryCode) {
    return NextResponse.json({ error: 'Adresse incomplète.' }, { status: 400 });
  }

  try {
    const items =
      normalizedItems.length > 0
        ? normalizedItems
        : [{ syncVariantId: variantId, quantity }];

    const order = await createPrintfulOrder({
      recipient: {
        name: recipient.name.trim(),
        email: user.email,
        address1: recipient.address1.trim(),
        city: recipient.city.trim(),
        zip: recipient.zip.trim(),
        countryCode: recipient.countryCode.trim().toUpperCase(),
      },
      items,
    });
    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
