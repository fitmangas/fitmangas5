import { NextResponse } from 'next/server';

import { isDevPreviewEnabled } from '@/lib/dev/preview-guard';
import { demoV2Vars, renderV2Email, type V2EmailId } from '@/lib/email/v2-templates';

const IDS: V2EmailId[] = ['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07'];

/** Aperçu brut d'un email v2 (développement local seulement, DEV_PREVIEW=1). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDevPreviewEnabled()) return new NextResponse('Not found', { status: 404 });
  const { id } = await params;
  const upper = id.toUpperCase() as V2EmailId;
  if (!IDS.includes(upper)) return new NextResponse('Not found', { status: 404 });
  const lang = new URL(request.url).searchParams.get('lang') === 'es' ? 'es' : 'fr';
  const email = renderV2Email(upper, demoV2Vars(upper, lang));
  return new NextResponse(email.html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
