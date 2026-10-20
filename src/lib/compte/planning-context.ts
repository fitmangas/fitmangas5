import type { SupabaseClient } from '@supabase/supabase-js';

import { isOnsiteEnabled } from '@/lib/onsite/flag';
import { resolveDisplayTimeZone } from '@/lib/time/tz-label';

export type PlanningContext = {
  /** Fuseau d'affichage de la cliente (profiles.display_timezone, sinon défaut de sa langue). */
  timeZone: string;
  /**
   * Langues des lives montrés : sa langue, plus l'autre si elle l'a cochée (profiles.live_other_language).
   * null = toutes (colonne absente tant que la migration du lot 2 n'est pas appliquée : comportement actuel).
   */
  languages: Array<'fr' | 'es'> | null;
  onsiteEnabled: boolean;
};

/** Contexte du planning v3, lu côté serveur (aucune écriture). */
export async function loadPlanningContext(supabase: SupabaseClient, userId: string): Promise<PlanningContext> {
  const onsiteEnabled = isOnsiteEnabled();
  type ProfileRow = { preferred_locale?: string | null; display_timezone?: string | null; live_other_language?: boolean | null };
  let row: ProfileRow | null = null;
  let hasOtherLanguageColumn = true;
  const first = await supabase
    .from('profiles')
    .select('preferred_locale, display_timezone, live_other_language')
    .eq('id', userId)
    .maybeSingle();
  if (first.error) {
    hasOtherLanguageColumn = false;
    const fallback = await supabase.from('profiles').select('preferred_locale, display_timezone').eq('id', userId).maybeSingle();
    row = (fallback.data as ProfileRow | null) ?? null;
  } else {
    row = (first.data as ProfileRow | null) ?? null;
  }
  const locale = row?.preferred_locale === 'es' ? 'es' : 'fr';
  const timeZone = resolveDisplayTimeZone(row?.display_timezone ?? null, locale);
  let languages: Array<'fr' | 'es'> | null = null;
  if (hasOtherLanguageColumn && row && row.live_other_language !== true) {
    languages = [locale];
  }
  return { timeZone, languages, onsiteEnabled };
}
