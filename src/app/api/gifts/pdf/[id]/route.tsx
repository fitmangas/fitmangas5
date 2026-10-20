import { NextResponse } from 'next/server';

import { demoGiftRow, giftLang, renderGiftPdf, type GiftRow } from '@/lib/gifts/cards';
import { isGiftsEnabled } from '@/lib/gifts/flag';
import { isDevPreviewEnabled } from '@/lib/dev/preview-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isAdminWithMfa } from '@/lib/auth/require-admin';

export const runtime = 'nodejs';

/**
 * C02 — carte cadeau en PDF.
 * - `cs_…` (identifiant de la session de paiement, envoyé seulement à l'acheteuse) : accès direct ;
 * - identifiant de la carte : admin seulement (C05) ;
 * - `apercu` : aperçu de développement.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isGiftsEnabled() && !isDevPreviewEnabled()) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  let row: GiftRow | null = null;

  if (id === 'apercu') {
    if (!isDevPreviewEnabled()) return new NextResponse(null, { status: 404 });
    row = demoGiftRow(new URL(req.url).searchParams.get('lang') === 'es' ? 'es' : 'fr');
  } else {
    try {
      const admin = createAdminClient();
      if (id.startsWith('cs_')) {
        const { data } = await admin.from('gift_cards').select('*').eq('stripe_checkout_session_id', id).maybeSingle();
        row = (data as GiftRow | null) ?? null;
      } else {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || !(await isAdminWithMfa(supabase, user))) return new NextResponse(null, { status: 404 });
        const { data } = await admin.from('gift_cards').select('*').eq('id', id).maybeSingle();
        row = (data as GiftRow | null) ?? null;
      }
    } catch {
      return new NextResponse(null, { status: 404 });
    }
  }
  if (!row || row.status === 'refunded') return new NextResponse(null, { status: 404 });

  const buf = await renderGiftPdf(row);
  const name = giftLang(row) === 'es' ? 'tarjeta-regalo-fitmangas.pdf' : 'carte-cadeau-fitmangas.pdf';
  return new NextResponse(Buffer.from(buf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${name}"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
