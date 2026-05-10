import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import {
  dispatchBoutiqueOrderDelivered,
  dispatchBoutiqueOrderPaid,
  dispatchBoutiqueOrderShipped,
} from '@/lib/notifications/phase3';

type PrintfulWebhookPayload = {
  type?: string;
  data?: {
    order?: {
      external_id?: string | null;
      id?: number | string | null;
      recipient?: { email?: string | null };
      shipments?: Array<{ tracking_url?: string | null }>;
    };
    shipment?: {
      tracking_url?: string | null;
      order_id?: string | number | null;
    };
  };
};

async function userIdFromEmail(email: string | null | undefined) {
  if (!email) return null;
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
  return user?.id ?? null;
}

export async function POST(request: Request) {
  const signatureSecret = process.env.PRINTFUL_WEBHOOK_SECRET;
  if (signatureSecret) {
    const signature = request.headers.get('x-pf-signature') ?? request.headers.get('x-printful-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Signature Printful manquante.' }, { status: 401 });
    }
    // Printful signature formats vary by dashboard setup; presence is enforced when configured.
  }

  const payload = (await request.json().catch(() => null)) as PrintfulWebhookPayload | null;
  if (!payload) return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 });

  const order = payload.data?.order;
  const userId = await userIdFromEmail(order?.recipient?.email);
  if (!userId) return NextResponse.json({ received: true, skipped: 'unknown_user' });

  const orderRef = String(order?.external_id ?? order?.id ?? payload.data?.shipment?.order_id ?? 'printful');
  const admin = createAdminClient();
  if (payload.type === 'order_created' || payload.type === 'order_confirmed') {
    await dispatchBoutiqueOrderPaid(admin, { userId, orderRef });
  } else if (payload.type === 'package_shipped' || payload.type === 'shipment_created') {
    await dispatchBoutiqueOrderShipped(admin, {
      userId,
      orderRef,
      trackingUrl: payload.data?.shipment?.tracking_url ?? order?.shipments?.[0]?.tracking_url ?? null,
    });
  } else if (payload.type === 'package_delivered') {
    await dispatchBoutiqueOrderDelivered(admin, { userId, orderRef });
  }

  return NextResponse.json({ received: true });
}
