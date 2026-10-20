import type { SupabaseClient } from '@supabase/supabase-js';

import { isNotifV2Enabled } from './flag';

/** Horodatage en dessous duquel aucun flush n’envoie (SPEC §3.7). */
export function notifV2CutoffIso(env: Record<string, string | undefined> = process.env): string | null {
  const raw = (env.NOTIF_V2_CUTOFF ?? '').trim();
  if (!raw) return null;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

export type DigestQueueRow = {
  id: string;
  created_at?: string | null;
  digest_bucket?: string;
  event_type?: string | null;
  payload?: Record<string, unknown>;
};

/**
 * Un flush ne tourne pas tant que NOTIF_V2 est off, ni sans NOTIF_V2_CUTOFF.
 * Les lignes antérieures au cutoff ne sont jamais envoyées.
 */
export function filterDigestRowsForFlush(
  rows: DigestQueueRow[],
  env: Record<string, string | undefined> = process.env,
): { allowed: DigestQueueRow[]; skippedCutoff: number; skippedFlagOff: boolean; missingCutoff?: boolean } {
  if (!isNotifV2Enabled(env)) {
    return { allowed: [], skippedCutoff: 0, skippedFlagOff: true };
  }
  const cutoff = notifV2CutoffIso(env);
  if (!cutoff) {
    // Sans date de bascule, rien ne part : l'ancien arriéré ne doit jamais être envoyé par erreur.
    return { allowed: [], skippedCutoff: rows.length, skippedFlagOff: false, missingCutoff: true };
  }
  const allowed = rows.filter((r) => {
    const created = r.created_at ? Date.parse(r.created_at) : 0;
    return created >= Date.parse(cutoff);
  });
  return { allowed, skippedCutoff: rows.length - allowed.length, skippedFlagOff: false };
}

export async function countDigestBacklog(
  client: SupabaseClient,
): Promise<Array<{ digest_bucket: string; event_type: string; n: number }>> {
  const { data, error } = await client
    .from('notification_digest_queue')
    .select('digest_bucket, payload')
    .is('processed_at', null);
  if (error) throw error;
  const map = new Map<string, number>();
  for (const row of data ?? []) {
    const bucket = String((row as { digest_bucket?: string }).digest_bucket ?? 'unknown');
    const eventType = String(
      ((row as { payload?: { event_type?: unknown } }).payload?.event_type as string | undefined) ?? '—',
    );
    const key = `${bucket}\t${eventType}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].map(([k, n]) => {
    const [digest_bucket, event_type] = k.split('\t');
    return { digest_bucket, event_type, n };
  });
}
