import { createAdminClient } from '@/lib/supabase/admin';

export const CONSEIL_SERIES_SETTING_KEY = 'social_conseil_series';
export const CONSEIL_SERIES_TOTAL = 50;

export type ConseilSeriesState = {
  nextNumber: number;
  usedKeywords: string[];
  usedNumbers: number[];
};

export function emptyConseilSeriesState(): ConseilSeriesState {
  return { nextNumber: 1, usedKeywords: [], usedNumbers: [] };
}

export async function getConseilSeriesState(): Promise<ConseilSeriesState> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('admin_settings')
      .select('value')
      .eq('key', CONSEIL_SERIES_SETTING_KEY)
      .maybeSingle();
    if (error || !data?.value) return emptyConseilSeriesState();
    const parsed = JSON.parse(String(data.value)) as Partial<ConseilSeriesState>;
    return {
      nextNumber: typeof parsed.nextNumber === 'number' ? Math.min(Math.max(1, parsed.nextNumber), CONSEIL_SERIES_TOTAL + 1) : 1,
      usedKeywords: Array.isArray(parsed.usedKeywords) ? parsed.usedKeywords.map(String) : [],
      usedNumbers: Array.isArray(parsed.usedNumbers) ? parsed.usedNumbers.map(Number).filter((n) => n > 0) : [],
    };
  } catch {
    return emptyConseilSeriesState();
  }
}

export async function saveConseilSeriesState(state: ConseilSeriesState): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from('admin_settings').upsert(
    {
      key: CONSEIL_SERIES_SETTING_KEY,
      value: JSON.stringify(state),
    },
    { onConflict: 'key' },
  );
  if (error) throw new Error(error.message);
}

/** Réserve le prochain numéro de conseil (1–50). Retourne null si série complète. */
export async function claimNextConseilNumber(keyword: string): Promise<{ number: number; keyword: string } | null> {
  const state = await getConseilSeriesState();
  if (state.nextNumber > CONSEIL_SERIES_TOTAL) return null;
  const number = state.nextNumber;
  const cleanKeyword = keyword.trim().toLowerCase().slice(0, 40) || `conseil-${number}`;
  await saveConseilSeriesState({
    nextNumber: number + 1,
    usedKeywords: [...state.usedKeywords, cleanKeyword].slice(-80),
    usedNumbers: [...state.usedNumbers, number],
  });
  return { number, keyword: cleanKeyword };
}

export const CONSEIL_KEYWORD_BANK_FR = [
  'la liberté',
  'l’énergie',
  'le sommeil',
  'la confiance',
  'le souffle',
  'le bassin',
  'le dos',
  'les hanches',
  'la constance',
  'le rendez-vous',
  'la respiration',
  'le relâchement',
  'la posture',
  'le matin',
  'le 15h',
  'la nuque',
  'les épaules',
  'le ventre',
  'la marche',
  'l’assise',
] as const;
