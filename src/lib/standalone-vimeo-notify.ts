import type { StandaloneVimeoRow } from '@/types/standalone-vimeo';

/** Phase 3 — brancher Resend / push / in-app. Déclenché après publication. */
export async function notifyStandaloneVideoPublished(_row: StandaloneVimeoRow): Promise<void> {
  /* eslint-disable no-console -- trace serveur jusqu’à intégration notifications */
  console.info('[standalone-vimeo] publication — notifications client à brancher (email / push)', _row?.id ?? '');
}
