import { renderToBuffer } from '@react-pdf/renderer';
import { NextResponse } from 'next/server';

import { CertificatePdf } from '@/lib/programmes/certificate-pdf';
import { demoCompletion, loadCompletion, periodLabel, statsLine, type CompletionData } from '@/lib/programmes/completion';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { isDevPreviewEnabled } from '@/lib/dev/preview-guard';
import { createClient } from '@/lib/supabase/server';
import { isAdminWithMfa } from '@/lib/auth/require-admin';

export const runtime = 'nodejs';

/** B08 — certificat PDF d'un programme terminé (la cliente ou un admin). « apercu » : aperçu de développement. */
export async function GET(req: Request, { params }: { params: Promise<{ enrollmentId: string }> }) {
  if (!isProgrammesEnabled() && !isDevPreviewEnabled()) {
    return new NextResponse(null, { status: 404 });
  }
  const { enrollmentId } = await params;
  let data: CompletionData | null = null;

  if (enrollmentId === 'apercu') {
    if (!isDevPreviewEnabled()) return new NextResponse(null, { status: 404 });
    const url = new URL(req.url);
    data = demoCompletion(url.searchParams.get('slug') ?? 'les-fondations', url.searchParams.get('lang') === 'es' ? 'es' : 'fr');
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new NextResponse(null, { status: 404 });
    data = await loadCompletion(enrollmentId);
    if (!data) return new NextResponse(null, { status: 404 });
    if (data.userId !== user.id) {
      if (!(await isAdminWithMfa(supabase, user))) return new NextResponse(null, { status: 404 });
    }
    if (data.status !== 'completed' || !data.certificateNumber) return new NextResponse(null, { status: 404 });
  }

  const buf = await renderToBuffer(
    <CertificatePdf
      lang={data.lang}
      name={data.fullName || data.firstName || ''}
      program={data.title}
      stats={statsLine(data, data.lang)}
      period={periodLabel(data.startKey, data.endKey, data.lang)}
      number={data.certificateNumber ?? ''}
    />,
  );
  const file = `${data.lang === 'es' ? 'certificado' : 'certificat'}-fitmangas-${data.slug}.pdf`;
  return new NextResponse(Buffer.from(buf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${file}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
