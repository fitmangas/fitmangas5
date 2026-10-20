import sharp from 'sharp';
import { NextResponse } from 'next/server';

/**
 * Vignettes des emails (A04, A06, C03) recadrées côté serveur : les clients mail ignorent `object-fit`.
 * Sources autorisées seulement (pas de proxy ouvert). Mise en cache longue par le CDN.
 */

const ALLOWED_HOSTS = ['i.vimeocdn.com', 'images.unsplash.com', 'fitmangas.com', 'www.fitmangas.com'];

function allowed(url: URL): boolean {
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') return false;
  if (ALLOWED_HOSTS.includes(url.hostname)) return true;
  if (url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/storage/v1/object/public/')) return true;
  const own = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '').trim();
  if (own) {
    try {
      if (new URL(own).hostname === url.hostname) return true;
    } catch {
      // ignoré
    }
  }
  return false;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const raw = params.get('src') ?? '';
  const w = Math.min(1200, Math.max(64, Number(params.get('w')) || 512));
  const h = Math.min(1200, Math.max(64, Number(params.get('h')) || 300));
  let src: URL;
  try {
    src = new URL(raw);
  } catch {
    return NextResponse.json({ error: 'Image invalide.' }, { status: 400 });
  }
  if (!allowed(src)) return NextResponse.json({ error: 'Source non autorisée.' }, { status: 400 });
  try {
    const upstream = await fetch(src, { cache: 'force-cache' });
    if (!upstream.ok) throw new Error(`HTTP ${upstream.status}`);
    const input = Buffer.from(await upstream.arrayBuffer());
    const output = await sharp(input).resize(w, h, { fit: 'cover', position: 'attention' }).jpeg({ quality: 80, progressive: true }).toBuffer();
    return new NextResponse(new Uint8Array(output), {
      headers: {
        'content-type': 'image/jpeg',
        'cache-control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (e) {
    console.error('[email/thumb]', src.hostname, e instanceof Error ? e.message : e);
    return NextResponse.redirect(src.toString(), 302);
  }
}
