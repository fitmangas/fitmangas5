import { NextResponse } from 'next/server';

import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import { syncAllStandaloneVimeoFromAccount } from '@/lib/vimeo-sync-standalone';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

async function runSync() {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  try {
    const result = await syncAllStandaloneVimeoFromAccount();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur synchronisation.';
    console.error('[vimeo sync-all]', e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/** Scan complet — utilisable depuis le bouton admin ou un cron interne. */
export async function GET() {
  return runSync();
}

export async function POST() {
  return runSync();
}
