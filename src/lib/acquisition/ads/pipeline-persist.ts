/** Statuts manuels des créatives (pipeline Exécution) — admin_settings. */

import { createAdminClient } from '@/lib/supabase/admin';
import { CREATIVE_STATUSES, type CreativeStatus } from './stats-compute';

export const ADS_PIPELINE_SETTING_KEY = 'ads_creative_pipeline_v1';

export async function loadCreativeStatuses(): Promise<Record<string, CreativeStatus>> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from('admin_settings').select('value').eq('key', ADS_PIPELINE_SETTING_KEY).maybeSingle();
    if (!data?.value) return {};
    const parsed = JSON.parse(String(data.value)) as Record<string, string>;
    const out: Record<string, CreativeStatus> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if ((CREATIVE_STATUSES as readonly string[]).includes(v)) out[k] = v as CreativeStatus;
    }
    return out;
  } catch {
    return {};
  }
}

/** `status = null` → retour au statut automatique. */
export async function saveCreativeStatus(itemId: string, status: CreativeStatus | null): Promise<Record<string, CreativeStatus>> {
  const current = await loadCreativeStatuses();
  if (status) current[itemId] = status;
  else delete current[itemId];
  const admin = createAdminClient();
  const { error } = await admin
    .from('admin_settings')
    .upsert({ key: ADS_PIPELINE_SETTING_KEY, value: JSON.stringify(current) }, { onConflict: 'key' });
  if (error) throw new Error(error.message);
  return current;
}
