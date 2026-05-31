import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  findCourseIdForJibriRecording,
  parseJibriRecordingFileName,
} from '@/lib/jibri-recording-filename';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncVideoRecording } from '@/lib/vimeo';
import { parseVimeoVideoId } from '@/lib/vimeo-parse-id';
import { assertWebhookRateLimit, clientIpFromRequest } from '@/lib/webhook-rate-limit';

export const dynamic = 'force-dynamic';

const RATE_MAX = 30;
const RATE_WINDOW_MS = 60_000;

const bodySchema = z.object({
  fileName: z.string().min(1).max(512),
  vimeoId: z.string().min(1).max(128),
  sessionId: z.string().max(256).optional(),
});

function authorizeRecordingIngest(request: Request): boolean {
  const secret = process.env.RECORDING_INGEST_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  const secretConfigured = Boolean(process.env.RECORDING_INGEST_SECRET?.trim());
  if (!secretConfigured) {
    console.error('[recordings/ingest] RECORDING_INGEST_SECRET manquant');
    return NextResponse.json({ ok: false, error: 'Ingestion enregistrements non configurée.' }, { status: 503 });
  }

  if (!authorizeRecordingIngest(request)) {
    return NextResponse.json({ ok: false, error: 'Non autorisé.' }, { status: 401 });
  }

  const ip = clientIpFromRequest(request);
  if (!assertWebhookRateLimit(`recording-ingest:${ip}`, RATE_MAX, RATE_WINDOW_MS)) {
    return NextResponse.json({ ok: false, error: 'Too many requests.' }, { status: 429 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    const raw = (await request.json()) as unknown;
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Corps JSON invalide (fileName, vimeoId requis).' }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ ok: false, error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const vimeoId = parseVimeoVideoId(body.vimeoId);
  if (!vimeoId) {
    return NextResponse.json({ ok: false, error: 'vimeoId invalide.' }, { status: 400 });
  }

  const parsedFile = parseJibriRecordingFileName(body.fileName);
  if (!parsedFile) {
    console.warn('[recordings/ingest] nom de fichier non reconnu', body.fileName);
    return NextResponse.json(
      {
        ok: false,
        error:
          'Nom de fichier Jibri non reconnu. Attendu: fitmangas-{slug}-{YYYYMMDDHHMM}_{timestamp}.mp4',
        fileName: body.fileName,
      },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  let courseId: string | null;
  try {
    courseId = await findCourseIdForJibriRecording(admin, parsedFile);
  } catch (e) {
    console.error('[recordings/ingest] recherche cours', e);
    const msg = e instanceof Error ? e.message : 'Erreur base de données.';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }

  if (!courseId) {
    console.error('[recordings/ingest] cours introuvable', {
      fileName: body.fileName,
      slug: parsedFile.slug,
      dateBlock: parsedFile.dateBlock,
      startsAtParis: parsedFile.startsAtParis.toISOString(),
      sessionId: body.sessionId ?? null,
    });
    return NextResponse.json(
      {
        ok: false,
        error: 'Aucun cours en ligne correspondant au slug et à la date de début.',
        slug: parsedFile.slug,
        startsAtParis: parsedFile.startsAtParis.toISOString(),
        fileName: body.fileName,
      },
      { status: 404 },
    );
  }

  try {
    const metadata = await syncVideoRecording({ courseId, vimeoId, createdBy: null });
    console.info('[recordings/ingest] replay lié en pending', {
      courseId,
      vimeoId,
      fileName: body.fileName,
      sessionId: body.sessionId ?? null,
      uploadStatus: metadata.isReady ? 'ready' : 'transcoding',
    });

    return NextResponse.json({
      ok: true,
      courseId,
      vimeoId,
      fileName: body.fileName,
      validationStatus: 'pending',
      isReady: false,
      uploadStatus: metadata.isReady ? 'ready' : 'transcoding',
      embedUrl: metadata.embedUrl ?? metadata.link,
    });
  } catch (e) {
    console.error('[recordings/ingest] syncVideoRecording', e);
    const msg = e instanceof Error ? e.message : 'Échec synchronisation replay.';
    return NextResponse.json({ ok: false, error: msg, courseId, vimeoId }, { status: 500 });
  }
}
