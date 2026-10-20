import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

import { LEVEL_TEST_COOKIE } from '@/lib/programmes/level-test';

import {
  buildPremiersPasItems,
  onboardingLang,
  PREMIERS_PAS_HIDDEN_COOKIE,
  shouldShowPremiersPas,
  type PremiersPasItem,
} from './premiers-pas';

async function hasTrialInProgress(supabase: SupabaseClient, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'trialing')
      .limit(1)
      .maybeSingle();
    return !error && Boolean(data);
  } catch {
    return false;
  }
}

async function countProgramEnrollments(supabase: SupabaseClient, userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    return error ? 0 : (count ?? 0);
  } catch {
    return 0;
  }
}

/**
 * Données de la liste « Tes premiers pas », uniquement à partir de ce qui existe déjà (aucune migration) :
 * - test de niveau : cookie posé par /test-niveau, ou programme déjà démarré (program_enrollments) ;
 * - premier live : profiles.live_visit_count ; replay : profiles.total_replay_watch_seconds ;
 * - essai en cours : subscriptions.status = trialing ; calendrier : connu seulement dans le navigateur.
 * Sans accès Visio (lives et replays verrouillés), la liste ne s'affiche pas et rien n'est lu.
 */
export async function loadPremiersPas(params: {
  supabase: SupabaseClient;
  userId: string;
  accountCreatedAt: string | null | undefined;
  lang: string;
  liveVisits: number | null | undefined;
  replaySeconds: number | null | undefined;
  /** NEXT_PUBLIC_FEATURE_PROGRAMMES : sinon pas d'étape « Test de niveau » ni de lecture des programmes. */
  programmesOn: boolean;
  hasVisioAccess: boolean;
  now?: Date;
}): Promise<{ show: boolean; items: PremiersPasItem[] }> {
  if (!params.hasVisioAccess) return { show: false, items: [] };
  const store = await cookies();
  const hidden = store.get(PREMIERS_PAS_HIDDEN_COOKIE)?.value === '1';
  if (hidden) return { show: false, items: [] };

  const [isTrialing, enrollmentCount] = await Promise.all([
    hasTrialInProgress(params.supabase, params.userId),
    params.programmesOn ? countProgramEnrollments(params.supabase, params.userId) : Promise.resolve(0),
  ]);
  const levelTestDone = Boolean(store.get(LEVEL_TEST_COOKIE)?.value) || enrollmentCount > 0;

  const items = buildPremiersPasItems(
    onboardingLang(params.lang),
    {
      levelTestDone,
      calendarSubscribed: false,
      liveVisits: Math.max(0, params.liveVisits ?? 0),
      replaySeconds: Math.max(0, params.replaySeconds ?? 0),
    },
    { programmes: params.programmesOn },
  );
  const show = shouldShowPremiersPas({
    accountCreatedAt: params.accountCreatedAt,
    now: params.now ?? new Date(),
    isTrialing,
    hidden,
  });
  return { show, items };
}
