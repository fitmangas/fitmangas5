import { readFileSync } from 'fs';
import { join } from 'path';
import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';

import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { isDevPreviewEnabled } from '@/lib/dev/preview-guard';
import { createClient } from '@/lib/supabase/server';
import { checkIsAdmin } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ enrollmentId: string }> }) {
  if (!isProgrammesEnabled() && !isDevPreviewEnabled()) return new NextResponse(null, { status: 404 });
  const { enrollmentId } = await params;
  let name = 'Margaux';
  let program = 'Les Fondations du Pilates';

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
      const { data } = await admin.from('program_enrollments').select('user_id, programs(title)').eq('id', enrollmentId).maybeSingle();
      if (!data) return new NextResponse(null, { status: 404 });
      if (data.user_id !== user.id && !adminCheck.isAdmin) return new NextResponse(null, { status: 404 });
      const title = (data as { programs?: { title?: { fr?: string } } }).programs?.title?.fr;
      if (title) program = title;
    } catch {
      return new NextResponse(null, { status: 404 });
    }
  }

  const playfair = readFileSync(join(process.cwd(), 'public/fonts/playfair-display-latin-600-italic.woff'));
  const inter = readFileSync(join(process.cwd(), 'public/fonts/inter-latin-500-normal.woff'));

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1920,
          background: '#FFFAF5',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 250,
          paddingBottom: 340,
          paddingLeft: 80,
          paddingRight: 80,
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 6, color: '#C45D3E', fontFamily: 'Inter' }}>FITMANGAS</div>
        <div style={{ fontSize: 72, color: '#2D2D2D', fontFamily: 'Playfair', fontStyle: 'italic', marginTop: 24, textAlign: 'center' }}>
          {name}
        </div>
        <div style={{ fontSize: 32, color: '#5F5750', marginTop: 28, textAlign: 'center', fontFamily: 'Inter' }}>
          a terminé {program}
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts: [
        { name: 'Playfair', data: playfair, style: 'italic', weight: 600 },
        { name: 'Inter', data: inter, weight: 500 },
      ],
    },
  );
}
