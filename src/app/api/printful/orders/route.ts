import { NextResponse } from 'next/server';

import { getPrintfulOrders } from '@/lib/printful';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  try {
    const email = user.email.toLowerCase();
    const orders = await getPrintfulOrders(80);
    const mine = orders.filter((o) => {
      const recipientEmail = o.recipient?.email?.toLowerCase() ?? o.packing_slip?.email?.toLowerCase() ?? '';
      return recipientEmail === email;
    });
    return NextResponse.json({ orders: mine });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
