import { createAdminClient } from '@/lib/supabase/admin';

import { isAcquisitionSchemaReady } from '@/lib/acquisition/db';
import type { AcquisitionChannel } from '@/lib/acquisition/types';

import type { SourceResult } from './types';

const PROVIDER = 'acq_crm';

export type AcqCrmFunnel = {
  contacts: number;
  qualified: number;
  trial: number;
  paid: number;
  member: number;
  hotLeads: number;
  avgLeadScore: number | null;
};

export async function fetchAcqCrmFunnel(
  channel: AcquisitionChannel | 'all',
): Promise<SourceResult<AcqCrmFunnel>> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) {
    return { ok: false, provider: PROVIDER, error: 'Tables acq_contacts absentes.' };
  }
  try {
    const admin = createAdminClient();
    let query = admin.from('acq_contacts').select('lifecycle_stage, channel, lead_score');
    if (channel !== 'all') {
      query = query.eq('channel', channel);
    }
    const { data, error } = await query;
    if (error) {
      return { ok: false, provider: PROVIDER, error: error.message };
    }
    const rows = data ?? [];
    const scores = rows.map((r) =>
      typeof r.lead_score === 'number' ? r.lead_score : Number(r.lead_score ?? 0) || 0,
    );
    const avgLeadScore =
      scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
    const funnel: AcqCrmFunnel = {
      contacts: rows.length,
      qualified: rows.filter((r) => r.lifecycle_stage === 'qualified').length,
      trial: rows.filter((r) => r.lifecycle_stage === 'trial').length,
      paid: rows.filter((r) => r.lifecycle_stage === 'paid').length,
      member: rows.filter((r) => r.lifecycle_stage === 'member').length,
      hotLeads: scores.filter((s) => s >= 40).length,
      avgLeadScore,
    };
    return { ok: true, data: funnel };
  } catch (e) {
    return {
      ok: false,
      provider: PROVIDER,
      error: e instanceof Error ? e.message : 'Erreur CRM Acquisition',
    };
  }
}
