import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/require-admin';

export const runtime = 'nodejs';

/** Ancien endpoint cloud — désactivé (option Claude Mac + HyperFrames local). */
export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ ok: false, error: 'Non autorisé.' }, { status: 401 });
  }
  return NextResponse.json(
    {
      ok: false,
      error:
        'Montage cloud désactivé. Utilise Claude + HyperFrames en local sur ton Mac, puis importe le MP4 dans l’admin.',
    },
    { status: 410 },
  );
}
