import { NextResponse } from 'next/server';

import { checkIsAdmin } from '@/lib/auth/admin';
import { savePrintfulProductOrder } from '@/lib/printful-product-order';
import { createClient } from '@/lib/supabase/server';

type Payload = {
  productIds?: number[];
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const adminGate = await checkIsAdmin(supabase, user);
  if (!adminGate.isAdmin) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as Payload | null;
  const ids = body?.productIds;
  if (!Array.isArray(ids) || ids.some((id) => !Number.isFinite(id) || id <= 0)) {
    return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 });
  }

  const deduped = Array.from(new Set(ids.map((id) => Math.trunc(id))));
  try {
    await savePrintfulProductOrder(deduped);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
