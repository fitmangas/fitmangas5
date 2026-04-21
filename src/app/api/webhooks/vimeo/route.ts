import { NextResponse } from 'next/server';

import { resolveVimeoFolderDisplayName } from '@/lib/vimeo-folder';
import { createAdminClient } from '@/lib/supabase/admin';
import { extractVimeoNumericIdFromWebhookPayload } from '@/lib/vimeo-webhook-parse';
import { verifyVimeoWebhookSignature } from '@/lib/vimeo-webhook-verify';
import { getVideoMetadata } from '@/lib/vimeo';

export const dynamic = 'force-dynamic';

/**
 * POST https://ton-domaine.com/api/webhooks/vimeo  
 * Vimeo Dashboard → Webhooks → URL + secret → variable VIMEO_WEBHOOK_SECRET  
 * Événements utiles : clip / video créé ou upload terminé (selon ce que Vimeo propose pour ton app).
 */
export async function POST(request: Request) {
  const secret = process.env.VIMEO_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error('[vimeo webhook] VIMEO_WEBHOOK_SECRET manquant');
    return NextResponse.json({ ok: false, error: 'Webhook Vimeo non configuré.' }, { status: 503 });
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

  const { data: jitsiRow } = await admin.from('video_recordings').select('id').eq('vimeo_video_id', vimeoId).maybeSingle();
  const jitsiIds = new Set(jitsiRow ? [vimeoId] : []);

  const folderDisplay = resolveVimeoFolderDisplayName(meta?.folderName ?? null, vimeoId, jitsiIds);

  const { data: existing } = await admin
    .from('standalone_vimeo_videos')
    .select('id, validation_status')
    .eq('vimeo_video_id', vimeoId)
    .maybeSingle();

  if (existing?.validation_status === 'published' || existing?.validation_status === 'rejected') {
    console.info('[vimeo webhook] vidéo déjà traitée (%s), pas de régression statut', existing.validation_status);
    return NextResponse.json({ ok: true, unchanged: true });
  }

  const row = {
    vimeo_video_id: vimeoId,
    vimeo_uri: meta?.vimeoUri ?? `/videos/${vimeoId}`,
    title: meta?.title ?? `Vidéo ${vimeoId}`,
    description: meta?.description ?? null,
    thumbnail_url: meta?.thumbnailUrl ?? null,
    duration_seconds: meta?.durationSeconds ?? null,
    embed_url: meta?.embedUrl ?? meta?.link ?? null,
    vimeo_folder_name: folderDisplay,
    validation_status: 'pending' as const,
    webhook_payload: typeof payload === 'object' && payload !== null ? payload : { raw: payload },
  };

  const { error } = await admin.from('standalone_vimeo_videos').upsert(row, {
    onConflict: 'vimeo_video_id',
    ignoreDuplicates: false,
  });

  if (error) {
    console.error('[vimeo webhook] upsert', error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, vimeo_video_id: vimeoId });
}
