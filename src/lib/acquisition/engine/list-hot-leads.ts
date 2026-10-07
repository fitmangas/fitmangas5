import { createAdminClient } from '@/lib/supabase/admin';

import { isAcquisitionSchemaReady } from '@/lib/acquisition/db';
import type {
  AcquisitionChannel,
  HotLeadRow,
  LifecycleStage,
} from '@/lib/acquisition/types';

import { HOT_LEAD_SCORE_MIN, isHotLeadNoiseHandle } from './lead-score';

type DbError = { ok: false; error: string; schemaReady: boolean };

/**
 * Leads score ≥40 pour relance manuelle (Conversations).
 * Exclut démo / @meta_ / équipe / payant-membre.
 */
export async function listHotLeads(limit = 40): Promise<
  { ok: true; items: HotLeadRow[]; schemaReady: boolean } | DbError
> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) {
    return { ok: true, items: [], schemaReady: false };
  }
  try {
    const admin = createAdminClient();
    const { data: contacts, error } = await admin
      .from('acq_contacts')
      .select('id, handle, email, channel, lifecycle_stage, lead_score, updated_at')
      .gte('lead_score', HOT_LEAD_SCORE_MIN)
      .order('lead_score', { ascending: false })
      .limit(Math.min(80, Math.max(limit * 2, limit)));
    if (error) {
      return { ok: false, error: error.message, schemaReady: true };
    }

    const rows = contacts ?? [];
    const contactIds = rows.map((r) => String(r.id));
    const convByContact = new Map<
      string,
      { id: string; lastMessageAt: string | null; lastMessagePreview: string | null }
    >();

    if (contactIds.length) {
      const { data: convs } = await admin
        .from('acq_conversations')
        .select('id, contact_id, last_message_at, last_message_preview')
        .in('contact_id', contactIds)
        .order('last_message_at', { ascending: false, nullsFirst: false });
      for (const conv of convs ?? []) {
        const cid = String(conv.contact_id);
        if (convByContact.has(cid)) continue;
        convByContact.set(cid, {
          id: String(conv.id),
          lastMessageAt: conv.last_message_at ? String(conv.last_message_at) : null,
          lastMessagePreview: conv.last_message_preview ? String(conv.last_message_preview) : null,
        });
      }
    }

    const items: HotLeadRow[] = [];
    for (const row of rows) {
      const handle = row.handle ? String(row.handle) : null;
      const stage = (row.lifecycle_stage as LifecycleStage) ?? 'new';
      const score =
        typeof row.lead_score === 'number' ? row.lead_score : Number(row.lead_score ?? 0) || 0;
      if (stage === 'paid' || stage === 'member') continue;
      if (isHotLeadNoiseHandle(handle) || !handle) continue;
      const conv = convByContact.get(String(row.id));
      items.push({
        contactId: String(row.id),
        handle,
        email: row.email ? String(row.email) : null,
        channel: row.channel as AcquisitionChannel,
        lifecycleStage: stage,
        leadScore: score,
        conversationId: conv?.id ?? null,
        lastMessageAt: conv?.lastMessageAt ?? null,
        lastMessagePreview: conv?.lastMessagePreview ?? null,
        actionable: true,
      });
      if (items.length >= limit) break;
    }

    return { ok: true, items, schemaReady: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur liste leads chauds',
      schemaReady: true,
    };
  }
}
