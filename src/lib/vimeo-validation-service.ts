import type { SupabaseClient } from '@supabase/supabase-js';

import { notifyStandaloneVideoPublished } from '@/lib/standalone-vimeo-notify';
import type { StandaloneVimeoRow } from '@/types/standalone-vimeo';

const AWAITING: ReadonlyArray<string> = ['pending', 'scheduled'];

export function isAwaitingValidation(status: string | null | undefined): boolean {
  return AWAITING.includes(status ?? '');
}

export async function approveStandaloneVideo(
  admin: SupabaseClient,
  rowId: string,
): Promise<{ ok: true; row: StandaloneVimeoRow } | { ok: false; error: string; status: number }> {
  const { data: row, error: fetchErr } = await admin
    .from('standalone_vimeo_videos')
    .select('*')
    .eq('id', rowId)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: fetchErr?.message ?? 'Vidéo introuvable.', status: 404 };
  }

  const r = row as StandaloneVimeoRow;
  if (!isAwaitingValidation(r.validation_status)) {
    return { ok: false, error: 'Cette vidéo n’est plus en attente.', status: 409 };
  }

  const published_at = new Date().toISOString();
  const { error: updateErr } = await admin
    .from('standalone_vimeo_videos')
    .update({
      validation_status: 'published',
      published_at,
      scheduled_publication_at: null,
    })
    .eq('id', rowId);

  if (updateErr) {
    return { ok: false, error: updateErr.message, status: 500 };
  }

  await notifyStandaloneVideoPublished({ ...r, validation_status: 'published', published_at });
  return { ok: true, row: { ...r, validation_status: 'published', published_at } };
}

export async function rejectStandaloneVideo(
  admin: SupabaseClient,
  rowId: string,
  rejectionReason: string | null,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const { data: row, error: fetchErr } = await admin
    .from('standalone_vimeo_videos')
    .select('id, validation_status')
    .eq('id', rowId)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: fetchErr?.message ?? 'Vidéo introuvable.', status: 404 };
  }

  if (!isAwaitingValidation(row.validation_status as string)) {
    return { ok: false, error: 'Cette vidéo n’est plus en attente.', status: 409 };
  }

  const { error: updateErr } = await admin
    .from('standalone_vimeo_videos')
    .update({
      validation_status: 'rejected',
      published_at: null,
      scheduled_publication_at: null,
      rejection_reason: rejectionReason?.trim() || null,
    })
    .eq('id', rowId);

  if (updateErr) {
    return { ok: false, error: updateErr.message, status: 500 };
  }

  return { ok: true };
}

export async function removeStandaloneVideoFromClient(
  admin: SupabaseClient,
  rowId: string,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const { data: row, error: fetchErr } = await admin
    .from('standalone_vimeo_videos')
    .select('id, validation_status')
    .eq('id', rowId)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: fetchErr?.message ?? 'Vidéo introuvable.', status: 404 };
  }

  if ((row.validation_status as string) === 'rejected') {
    return { ok: true };
  }

  const { error: updateErr } = await admin
    .from('standalone_vimeo_videos')
    .update({
      validation_status: 'rejected',
      published_at: null,
      scheduled_publication_at: null,
      rejection_reason: 'Retirée depuis le dashboard admin.',
    })
    .eq('id', rowId);

  if (updateErr) {
    return { ok: false, error: updateErr.message, status: 500 };
  }

  return { ok: true };
}
