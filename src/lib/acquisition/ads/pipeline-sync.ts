/**
 * Avance automatique des statuts pipeline (Plan → CM → organique → test pub).
 * Ne descend jamais un statut gagnante / à couper / en test.
 */

import type { SocialPost } from '@/lib/admin/social-comms';
import { planItemIdFromSourceRef } from './plan-to-cm';
import { loadCreativeStatuses, saveCreativeStatus } from './pipeline-persist';
import { CREATIVE_STATUSES, type CreativeStatus } from './stats-compute';

const LOCKED: ReadonlySet<CreativeStatus> = new Set(['gagnante', 'a_couper']);

const RANK: Record<CreativeStatus, number> = {
  a_creer: 0,
  brouillon: 1,
  publiee_organique: 2,
  en_test: 3,
  gagnante: 5,
  a_couper: 5,
};

export function shouldAdvanceCreativeStatus(
  current: CreativeStatus | undefined,
  next: CreativeStatus,
): boolean {
  if (!current) return true;
  if (LOCKED.has(current)) return false;
  return RANK[next] >= RANK[current];
}

export async function advancePlanCreativeStatus(
  planItemId: string,
  next: CreativeStatus,
): Promise<CreativeStatus | null> {
  const id = planItemId.trim();
  if (!id || !(CREATIVE_STATUSES as readonly string[]).includes(next)) return null;
  const current = (await loadCreativeStatuses())[id];
  if (!shouldAdvanceCreativeStatus(current, next)) return current ?? null;
  await saveCreativeStatus(id, next);
  return next;
}

/** Appelé après création / publication d’un post CM lié au Plan. Ne bloque jamais l’appelant. */
export async function syncPipelineFromSocialPost(post: Pick<SocialPost, 'status' | 'sourceRef'>): Promise<void> {
  const planId = planItemIdFromSourceRef(post.sourceRef);
  if (!planId) return;
  const next: CreativeStatus = post.status === 'published' ? 'publiee_organique' : 'brouillon';
  try {
    await advancePlanCreativeStatus(planId, next);
  } catch (e) {
    console.error('[pipeline-sync] social post', planId, e);
  }
}

export async function markPlanCreativeBoosted(planItemId: string): Promise<void> {
  try {
    await advancePlanCreativeStatus(planItemId, 'en_test');
  } catch (e) {
    console.error('[pipeline-sync] boost', planItemId, e);
  }
}
