import { renderToBuffer } from '@react-pdf/renderer';
import { NextResponse } from 'next/server';

import { GiftPdf } from '@/lib/gifts/gift-pdf';
import { isGiftsEnabled } from '@/lib/gifts/flag';
import { isDevPreviewEnabled } from '@/lib/dev/preview-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEmailPublicBaseUrl } from '@/lib/email/base-template';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isGiftsEnabled() && !isDevPreviewEnabled()) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  let months = 3;
  let from = 'Sandrine';
  let to = 'Julie';
  let code = 'FM-7K2Q-9XW4';
  if (id === 'apercu') {
    if (!isDevPreviewEnabled()) return new NextResponse(null, { status: 404 });
  } else {
    try {
      const admin = createAdminClient();
      const { data } = await admin.from('gift_cards').select('months, buyer_name, recipient_name, code').eq('id', id).maybeSingle();
      if (!data) return new NextResponse(null, { status: 404 });
      months = Number(data.months);
      from = String(data.buyer_name);
      to = String(data.recipient_name);
      code = String(data.code);
    } catch {
      return new NextResponse(null, { status: 404 });
    }
  }
  const buf = await renderToBuffer(
    <GiftPdf months={months} from={from} to={to} code={code} activateUrl={`${getEmailPublicBaseUrl()}/offrir/activer?code=${encodeURIComponent(code)}`} />,
  );
  return new NextResponse(Buffer.from(buf), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="carte-cadeau-fitmangas.pdf"' },
  });
}
