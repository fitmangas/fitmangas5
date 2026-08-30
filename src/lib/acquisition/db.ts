import { createAdminClient } from '@/lib/supabase/admin';

let schemaReadyCache: boolean | null = null;
let schemaCheckedAt = 0;
const SCHEMA_TTL_MS = 60_000;

/** Vérifie si les tables Acquisition existent (sans crasher si migration non appliquée). */
export async function isAcquisitionSchemaReady(): Promise<boolean> {
  const now = Date.now();
  if (schemaReadyCache !== null && now - schemaCheckedAt < SCHEMA_TTL_MS) {
    return schemaReadyCache;
  }
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('acq_contacts').select('id').limit(1);
    if (!error) {
      schemaReadyCache = true;
      schemaCheckedAt = now;
      return true;
    }
    const msg = `${error.message || ''} ${error.code || ''}`.toLowerCase();
    if (msg.includes('does not exist') || msg.includes('42p01') || msg.includes('could not find')) {
      schemaReadyCache = false;
      schemaCheckedAt = now;
      return false;
    }
    // Table existe mais autre erreur (RLS, vide…) → considérer prête
    schemaReadyCache = true;
    schemaCheckedAt = now;
    return true;
  } catch {
    schemaReadyCache = false;
    schemaCheckedAt = now;
    return false;
  }
}

export function resetAcquisitionSchemaCache(): void {
  schemaReadyCache = null;
  schemaCheckedAt = 0;
}
