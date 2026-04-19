import path from 'node:path';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkIsAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';
import { syncVideoRecording, uploadToVimeo } from '@/lib/vimeo';

/** Uploads volumineux : augmenter si déployé sur plateforme avec limite de durée (ex. Vercel). */
export const maxDuration = 300;

const bodySchema = z.object({
  courseId: z.string().uuid(),
  /** Nom de fichier dans VIDEO_RECORDINGS_DIR (ex. `abc-uuid.mp4`). Par défaut : `{courseId}.mp4`. */
  fileName: z.string().min(1).max(512).optional(),
});

function resolveRecordingAbsolutePath(courseId: string, fileName?: string): string {
  const base = process.env.VIDEO_RECORDINGS_DIR?.trim();
  if (!base) {
    throw new Error('VIDEO_RECORDINGS_DIR est requis pour localiser le fichier enregistré.');
  }

  const safeName = fileName?.trim() || `${courseId}.mp4`;
  if (safeName.includes('..') || path.isAbsolute(safeName)) {
    throw new Error('Nom de fichier invalide.');
  }

  const resolvedFile = path.resolve(base, safeName);
  const normalizedBase = path.resolve(base);
  const relative = path.relative(normalizedBase, resolvedFile);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Le fichier doit être sous VIDEO_RECORDINGS_DIR.');
  }

  return resolvedFile;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }

  const admin = await checkIsAdmin(supabase, user);
  if (!admin.isAdmin) {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs.' }, { status: 403 });
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    const raw = (await request.json()) as unknown;
    const result = bodySchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json({ error: 'Requête invalide (courseId UUID attendu).' }, { status: 400 });
    }
    parsed = result.data;
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const { courseId, fileName } = parsed;

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, description, ends_at, is_published')
    .eq('id', courseId)
    .maybeSingle();

  if (courseError || !course || !course.is_published) {
    return NextResponse.json({ error: 'Cours introuvable ou non publié.' }, { status: 404 });
  }

  const endsAt = new Date(course.ends_at);
  if (Number.isNaN(endsAt.getTime())) {
    return NextResponse.json({ error: 'Date de fin du cours invalide.' }, { status: 400 });
  }

  if (endsAt >= new Date()) {
    return NextResponse.json({ error: 'Le cours doit être terminé (fin passée) avant traitement.' }, { status: 409 });
  }

  let absolutePath: string;
  try {
    absolutePath = resolveRecordingAbsolutePath(courseId, fileName);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Chemin fichier invalide.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const title = course.title.trim() || 'Replay';
  const description = course.description?.trim() ?? '';

  try {
    const { vimeoId } = await uploadToVimeo(absolutePath, title, description);
    const metadata = await syncVideoRecording({
      courseId,
      vimeoId,
      createdBy: user.id,
    });

    return NextResponse.json({
      ok: true,
      courseId,
      vimeoId,
      embedUrl: metadata.embedUrl ?? metadata.link,
      uploadStatus: metadata.isReady ? 'ready' : 'transcoding',
    });
  } catch (e) {
    console.error('[api/video/process-recording]', e);
    const message = e instanceof Error ? e.message : 'Échec upload ou synchronisation Vimeo.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
