import { NextResponse } from 'next/server';

import { isAcquisitionModuleEnabled } from '@/lib/acquisition/feature-flag';
import { pollInstagramInbox } from '@/lib/acquisition/providers/instagram-poll';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Sync manuelle DM Instagram → inbox Acquisition (admin). */
export async function POST() {
  if (!isAcquisitionModuleEnabled()) {
    return NextResponse.json({ error: 'Module Acquisition désactivé.' }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Réservé admin.' }, { status: 403 });
  }

  const result = await pollInstagramInbox({ conversationLimit: 15, messagesPerThread: 30 });
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Échec sync IG' }, { status: 502 });
  }
  return NextResponse.json({ success: true, imported: result.imported });
}
