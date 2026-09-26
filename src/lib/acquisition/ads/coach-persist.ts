/**
 * Persistance conseils coach + déduplication entre syncs.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import type { CoachAdvice } from './coach';
import { generateCoachAdvice } from './coach';
import { generateActionPlan, type ActionPlanItem } from './action-plan';
import type { IntelligenceBundle } from './intelligence-repository';

export const ADS_COACH_SETTING_KEY = 'ads_coach_advice_v1';
export const ADS_PLAN_SETTING_KEY = 'ads_action_plan_v1';

type StoredCoach = {
  advice: CoachAdvice[];
  aiNote: string | null;
  titles: string[];
  updatedAt: string;
};

type StoredPlan = {
  items: ActionPlanItem[];
  aiNote: string | null;
  titles: string[];
  updatedAt: string;
};

async function readJsonSetting<T>(key: string): Promise<T | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from('admin_settings').select('value').eq('key', key).maybeSingle();
    if (!data?.value) return null;
    return JSON.parse(String(data.value)) as T;
  } catch {
    return null;
  }
}

async function writeJsonSetting(key: string, value: unknown): Promise<void> {
  const admin = createAdminClient();
  await admin.from('admin_settings').upsert(
    { key, value: JSON.stringify(value) },
    { onConflict: 'key' },
  );
}

function dedupeAdvice(advice: CoachAdvice[], previousTitles: string[]): CoachAdvice[] {
  const prev = new Set(previousTitles.map((t) => t.toLowerCase().trim()));
  const seen = new Set<string>();
  const out: CoachAdvice[] = [];
  for (const a of advice) {
    const k = a.title.toLowerCase().trim();
    if (prev.has(k) || seen.has(k)) continue;
    seen.add(k);
    out.push(a);
  }
  // Si tout filtré, garder les règles fraîches (ids start-*)
  if (out.length === 0) return advice.slice(0, 4);
  return out;
}

export async function loadStoredCoachAdvice(): Promise<StoredCoach | null> {
  return readJsonSetting<StoredCoach>(ADS_COACH_SETTING_KEY);
}

export async function loadStoredActionPlan(): Promise<StoredPlan | null> {
  return readJsonSetting<StoredPlan>(ADS_PLAN_SETTING_KEY);
}

/** Régénération auto (sync) ou manuelle — déduplique les titres déjà servis. */
export async function regenerateAndPersistCoach(
  bundle: IntelligenceBundle,
  opts?: { force?: boolean },
): Promise<{ advice: CoachAdvice[]; aiNote: string | null; plan: ActionPlanItem[]; planNote: string | null }> {
  const prevCoach = await loadStoredCoachAdvice();
  const prevPlan = await loadStoredActionPlan();
  const previousTitles = [...(prevCoach?.titles ?? []), ...(prevPlan?.titles ?? [])];

  const { advice: rawAdvice, aiNote } = await generateCoachAdvice(bundle);
  const advice = opts?.force ? rawAdvice : dedupeAdvice(rawAdvice, previousTitles);

  const { items, aiNote: planNote, adviceMirror } = await generateActionPlan(
    bundle,
    opts?.force ? [] : previousTitles,
  );

  // Fusion légère : conseils du jour = rules/AI coach + miroir plan (sans doublon)
  const titles = new Set(advice.map((a) => a.title.toLowerCase()));
  const merged = [...advice];
  for (const m of adviceMirror.slice(0, 3)) {
    if (titles.has(m.title.toLowerCase())) continue;
    merged.push(m);
    titles.add(m.title.toLowerCase());
  }

  const coachPayload: StoredCoach = {
    advice: merged.slice(0, 8),
    aiNote,
    titles: merged.map((a) => a.title),
    updatedAt: new Date().toISOString(),
  };
  const planPayload: StoredPlan = {
    items,
    aiNote: planNote,
    titles: items.map((i) => i.title),
    updatedAt: new Date().toISOString(),
  };

  await writeJsonSetting(ADS_COACH_SETTING_KEY, coachPayload);
  await writeJsonSetting(ADS_PLAN_SETTING_KEY, planPayload);

  return {
    advice: coachPayload.advice,
    aiNote: coachPayload.aiNote,
    plan: planPayload.items,
    planNote: planPayload.aiNote,
  };
}
