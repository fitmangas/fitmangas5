import { NextResponse } from 'next/server';

import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import { syncNewStandaloneVimeoFromAccount } from '@/lib/vimeo-sync-standalone';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST() {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  try {
    const result = await syncNewStandaloneVimeoFromAccount(gate.userId);
    return NextResponse.json({
      ok: true,
      scanned: result.scanned,
      written: result.written,
      skippedRejected: result.skippedRejected,
      errors: result.errors,
      folderColumnSkipped: result.folderColumnSkipped,
      since: result.since,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur synchronisation.';
    console.error('[vimeo sync-new]', e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
