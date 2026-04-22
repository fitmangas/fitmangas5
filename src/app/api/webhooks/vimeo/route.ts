import { NextResponse } from 'next/server';

import { parseDefaultCoachIdFromEnv } from '@/lib/vimeo-coach-env';
import { isMissingVimeoFolderColumnError, resolveVimeoFolderDisplayName } from '@/lib/vimeo-folder';
import { createAdminClient } from '@/lib/supabase/admin';
import { clientIpFromRequest, assertWebhookRateLimit } from '@/lib/webhook-rate-limit';
import { extractVimeoNumericIdFromWebhookPayload } from '@/lib/vimeo-webhook-parse';
import { verifyVimeoWebhookSignature } from '@/lib/vimeo-webhook-verify';
import { getVideoMetadata } from '@/lib/vimeo';

export const dynamic = 'force-dynamic';

const RATE_MAX = 120;
const RATE_WINDOW_MS = 60_000;

/**
 * POST — Vimeo Dashboard → Webhooks → URL + secret (`VIMEO_WEBHOOK_SECRET`).
 */
export async function POST(request: Request) {
  const secret = process.env.VIMEO_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error('[vimeo webhook] VIMEO_WEBHOOK_SECRET manquant');
    return NextResponse.json({ ok: false, error: 'Webhook Vimeo non configuré.' }, { status: 503 });
  }

  const ip = clientIpFromRequest(request);
  if (!assertWebhookRateLimit(`vimeo-webhook:${ip}`, RATE_MAX, RATE_WINDOW_MS)) {
    console.warn('[vimeo webhook] rate limit', ip);
    return NextResponse.json({ ok: false, error: 'Too many requests.' }, { status: 429 });
  }

  const rawBody = await request.text();
  const sig =
    request.headers.get('x-vimeo-signature') ??
    request.headers.get('X-Vimeo-Signature') ??
    request.headers.get('x-vimeo-webhook-signature');

  if (!verifyVimeoWebhookSignature(rawBody, sig, secret)) {
    console.warn('[vimeo webhook] signature invalide');
    return NextResponse.json({ ok: false, error: 'Signature invalide.' }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON invalide.' }, { status: 400 });
  }

  const vimeoId = extractVimeoNumericIdFromWebhookPayload(payload);
  if (!vimeoId) {
    console.info('[vimeo webhook] aucun id vidéo exploitable — ignoré');
    return NextResponse.json({ ok: true, skipped: true });
  }

  let meta: Awaited<ReturnType<typeof getVideoMetadata>> | null = null;
  try {
    meta = await getVideoMetadata(vimeoId);
  } catch (e) {
    console.warn('[vimeo webhook] métadonnées Vimeo indisponibles (token ou transcodage)', e);
  }

  const admin = createAdminClient();
  const defaultCoachId = parseDefaultCoachIdFromEnv();

  const { data: jitsiRow } = await admin.from('video_recordings').select('id').eq('vimeo_video_id', vimeoId).maybeSingle();
  const jitsiIds = new Set(jitsiRow ? [vimeoId] : []);

  const folderDisplay = resolveVimeoFolderDisplayName(meta?.folderName ?? null, vimeoId, jitsiIds);

  const { data: existing } = await admin
    .from('standalone_vimeo_videos')
    .select('*')
    .eq('vimeo_video_id', vimeoId)
    .maybeSingle();

  const existingRow = existing as Record<string, unknown> | null;
  const existingStatus = existingRow?.validation_status as string | undefined;

  if (existingStatus === 'published' || existingStatus === 'rejected') {
    console.info('[vimeo webhook] vidéo déjà traitée (%s), pas de régression statut', existingStatus);
    return NextResponse.json({ ok: true, unchanged: true });
  }

  const webhookPayload =
    typeof payload === 'object' && payload !== null ? payload : { raw: payload };

  let validation_status: 'pending' | 'scheduled' = 'pending';
  let scheduled_publication_at: string | null = null;

  if (existingStatus === 'scheduled') {
    validation_status = 'scheduled';
    const s = existingRow?.scheduled_publication_at;
    scheduled_publication_at = typeof s === 'string' ? s : null;
  }

  const coach_id =
    (existingRow?.coach_id as string | undefined) ??
    defaultCoachId ??
    null;

  const row = {
    vimeo_video_id: vimeoId,
    vimeo_uri: meta?.vimeoUri ?? `/videos/${vimeoId}`,
    title: meta?.title ?? `Vidéo ${vimeoId}`,
    description: meta?.description ?? null,
    thumbnail_url: meta?.thumbnailUrl ?? null,
    duration_seconds: meta?.durationSeconds ?? null,
    embed_url: meta?.embedUrl ?? meta?.link ?? null,
    vimeo_folder_name: folderDisplay,
    validation_status,
    scheduled_publication_at,
    webhook_payload: webhookPayload,
    coach_id,
  };

  let { error } = await admin.from('standalone_vimeo_videos').upsert(row, {
    onConflict: 'vimeo_video_id',
    ignoreDuplicates: false,
  });

  if (error && isMissingVimeoFolderColumnError(error.message)) {
    const { vimeo_folder_name: _omit, ...withoutFolder } = row;
    ({ error } = await admin.from('standalone_vimeo_videos').upsert(withoutFolder, {
      onConflict: 'vimeo_video_id',
      ignoreDuplicates: false,
    }));
    if (!error) {
      console.warn('[vimeo webhook] upsert sans vimeo_folder_name — appliquer migration 011 pour les dossiers.');
    }
  }

  if (error) {
    console.error('[vimeo webhook] upsert', error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  console.info('[vimeo webhook] upsert ok', vimeoId, validation_status);
  return NextResponse.json({ ok: true, vimeo_video_id: vimeoId, validation_status });
}
