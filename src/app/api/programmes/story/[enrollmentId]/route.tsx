import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';

import { demoCompletion, loadCompletion, type CompletionData } from '@/lib/programmes/completion';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { hoursMinutesLabel } from '@/lib/programmes/engine';
import { isDevPreviewEnabled } from '@/lib/dev/preview-guard';
import { createClient } from '@/lib/supabase/server';
import { isAdminWithMfa } from '@/lib/auth/require-admin';

export const runtime = 'nodejs';

const COPY = {
  fr: {
    done: 'PROGRAMME TERMINÉ',
    sessions: (n: number) => `${n} séance${n > 1 ? 's' : ''}`,
    with: 'avec Alejandra, sur',
  },
  es: {
    done: 'PROGRAMA TERMINADO',
    sessions: (n: number) => `${n} sesion${n > 1 ? 'es' : ''}`,
    with: 'con Alejandra, en',
  },
} as const;

/** Image locale (public/) en data URI ; adresse distante telle quelle. */
function imageSrc(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  const file = join(process.cwd(), 'public', url.replace(/^\//, ''));
  const ext = extname(file).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,${readFileSync(file).toString('base64')}`;
}

/** B09 — visuel story 1080 × 1920 d'un programme terminé (la cliente ou un admin). « apercu » : aperçu de développement. */
export async function GET(req: Request, { params }: { params: Promise<{ enrollmentId: string }> }) {
  if (!isProgrammesEnabled() && !isDevPreviewEnabled()) return new NextResponse(null, { status: 404 });
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
    if (data.status !== 'completed') return new NextResponse(null, { status: 404 });
  }

  const t = COPY[data.lang];
  const fonts = join(process.cwd(), 'public/fonts');
  const playfair = readFileSync(join(fonts, 'playfair-display-latin-600-italic.woff'));
  const inter500 = readFileSync(join(fonts, 'inter-latin-500-normal.woff'));
  const inter600 = readFileSync(join(fonts, 'inter-latin-600-normal.woff'));
  let cover: string | null = null;
  try {
    cover = imageSrc(data.coverUrl);
  } catch {
    cover = null;
  }
  const logo = imageSrc('/programmes/logo-flamme.png');
  const titleSize = data.title.length > 34 ? 76 : data.title.length > 22 ? 92 : 104;
  const pills = [t.sessions(data.done), hoursMinutesLabel(data.minutes)];

  return new ImageResponse(
    (
      <div style={{ width: 1080, height: 1920, display: 'flex', flexDirection: 'column', background: '#FDF8F3', position: 'relative', fontFamily: 'Inter' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: 1150, display: 'flex' }}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
            <img src={cover} width={1080} height={1150} style={{ width: 1080, height: 1150, objectFit: 'cover', objectPosition: '50% 25%' }} />
          ) : null}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1080,
              height: 1150,
              background: 'linear-gradient(180deg, rgba(253,248,243,0) 0%, rgba(253,248,243,0) 52%, rgba(253,248,243,0.75) 80%, #FDF8F3 100%)',
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            top: 300,
            left: 68,
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            padding: '18px 34px 18px 30px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.94)',
            boxShadow: '0 14px 34px rgba(29,26,23,0.16)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={logo} width={32} height={34} />
          <span style={{ fontSize: 24, letterSpacing: 6, fontWeight: 600, color: '#2D2D2D' }}>FITMANGAS</span>
        </div>

        <div style={{ position: 'absolute', top: 1000, left: 0, width: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '16px 36px',
              borderRadius: 999,
              background: '#C45D3E',
              boxShadow: '0 16px 36px rgba(196,93,62,0.38)',
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
              <circle cx="12" cy="8" r="6" />
            </svg>
            <span style={{ fontSize: 24, letterSpacing: 6, fontWeight: 600, color: '#FFFFFF' }}>{t.done}</span>
          </div>
          <div
            style={{
              marginTop: 40,
              padding: '0 110px',
              display: 'flex',
              textAlign: 'center',
              justifyContent: 'center',
              fontFamily: 'Playfair',
              fontStyle: 'italic',
              fontSize: titleSize,
              lineHeight: 1.02,
              color: '#2D2D2D',
            }}
          >
            {data.title}
          </div>
          <div style={{ marginTop: 44, display: 'flex', gap: 18 }}>
            {pills.map((p) => (
              <div
                key={p}
                style={{
                  display: 'flex',
                  padding: '18px 30px',
                  borderRadius: 999,
                  background: '#FFFFFF',
                  boxShadow: '0 10px 26px rgba(29,26,23,0.10)',
                  fontSize: 30,
                  fontWeight: 500,
                  color: '#2D2D2D',
                }}
              >
                {p}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 52, display: 'flex', gap: 10, fontSize: 30, color: '#8A8178' }}>
            <span>{t.with}</span>
            <span style={{ color: '#2D2D2D', fontWeight: 600 }}>fitmangas.com</span>
          </div>
          <div style={{ marginTop: 14, display: 'flex', fontSize: 30, fontWeight: 600, color: '#C45D3E' }}>@fit.mangas</div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts: [
        { name: 'Playfair', data: playfair, style: 'italic', weight: 600 },
        { name: 'Inter', data: inter500, weight: 500 },
        { name: 'Inter', data: inter600, weight: 600 },
      ],
      headers: {
        'Content-Disposition': `inline; filename="story-fitmangas-${data.slug}.png"`,
        'Cache-Control': 'private, no-store',
      },
    },
  );
}
