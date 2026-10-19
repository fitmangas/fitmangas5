import { renderToBuffer } from '@react-pdf/renderer';
import { NextResponse } from 'next/server';

import { CertificatePdf } from '@/lib/programmes/certificate-pdf';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { isDevPreviewEnabled } from '@/lib/dev/preview-guard';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsAdmin } from '@/lib/auth/admin';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ enrollmentId: string }> }) {
  if (!isProgrammesEnabled() && !isDevPreviewEnabled()) {
    return new NextResponse(null, { status: 404 });
  }
  const { enrollmentId } = await params;
  let name = 'Margaux';
  let program = 'Les Fondations du Pilates';
  let number = 'FM-2026-1019-0001';

  if (enrollmentId === 'apercu') {
    if (!isDevPreviewEnabled()) return new NextResponse(null, { status: 404 });
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new NextResponse(null, { status: 404 });
    const adminCheck = await checkIsAdmin(supabase, user);
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from('program_enrollments')
        .select('user_id, certificate_number, program_id, programs(title)')
        .eq('id', enrollmentId)
        .maybeSingle();
      if (!data) return new NextResponse(null, { status: 404 });
      if (data.user_id !== user.id && !adminCheck.isAdmin) return new NextResponse(null, { status: 404 });
      number = String(data.certificate_number ?? number);
      const title = (data as { programs?: { title?: { fr?: string } } }).programs?.title?.fr;
      if (title) program = title;
    } catch {
      return new NextResponse(null, { status: 404 });
    }
  }

  const buf = await renderToBuffer(<CertificatePdf name={name} program={program} number={number} />);
  return new NextResponse(Buffer.from(buf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="certificat-fitmangas.pdf"`,
    },
  });
}
