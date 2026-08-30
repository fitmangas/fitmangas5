import { getMetaSocialConnection } from '@/lib/admin/social-comms';
import { loadHooksBank } from '@/lib/admin/social-hooks-bank';
import { createAdminClient } from '@/lib/supabase/admin';

export type PerformanceLoopStatus = {
  cmFewShotConnected: boolean;
  hooksInBank: number;
  hooksWithMetaMetrics: number;
  metaInsightsConnected: boolean;
  metaInsightsNote: string;
  reinjectionPath: string;
};

/** État de la boucle hooks gagnants → génération CM (few-shot). */
export async function getPerformanceLoopStatus(): Promise<PerformanceLoopStatus> {
  const bank = await loadHooksBank();
  const hooksInBank = bank.entries?.length ?? 0;

  let hooksWithMetaMetrics = 0;
  try {
    const admin = createAdminClient();
    const { count } = await admin
      .from('post_metrics')
      .select('id', { count: 'exact', head: true })
      .not('hook', 'is', null);
    hooksWithMetaMetrics = count ?? 0;
  } catch {
    hooksWithMetaMetrics = 0;
  }

  const meta = await getMetaSocialConnection();
  const metaInsightsConnected = Boolean(meta.connected && meta.accessToken && meta.igUserId);

  let metaInsightsNote = 'Insights Meta non branchés — scores Saves/Reach indisponibles.';
  if (metaInsightsConnected) {
    metaInsightsNote =
      hooksWithMetaMetrics > 0
        ? `${hooksWithMetaMetrics} post(s) avec métriques IG — sync CM active.`
        : 'Meta connecté — lance « Sync Insights » dans Publications pour remplir post_metrics.';
  } else if (!meta.connected) {
    metaInsightsNote = 'Connecte Instagram dans Publications (Meta OAuth) pour activer la sync Insights.';
  }

  return {
    cmFewShotConnected: hooksInBank > 0 || hooksWithMetaMetrics > 0,
    hooksInBank,
    hooksWithMetaMetrics,
    metaInsightsConnected,
    metaInsightsNote,
    reinjectionPath: 'Banque hooks → prompt génération CM (top 10 few-shot) dans community/actions.ts',
  };
}
