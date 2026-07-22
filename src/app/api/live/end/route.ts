import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkIsAdmin } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  courseId: z.string().uuid(),
});

/**
 * Termine le live côté planning : `ends_at` = maintenant si la fin prévue est encore dans le futur.
 * Complète l’action Jitsi `endConference` / `stopRecording` côté client.
 */
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

  let courseId: string;
  try {
    const raw = (await request.json()) as unknown;
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'courseId UUID requis.' }, { status: 400 });
    }
    courseId = parsed.data.courseId;
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const adminDb = createAdminClient();
  const { data: course, error: fetchError } = await adminDb
    .from('courses')
    .select('id, ends_at')
    .eq('id', courseId)
    .maybeSingle();

  if (fetchError || !course) {
    return NextResponse.json({ error: 'Séance introuvable.' }, { status: 404 });
  }

  const now = new Date();
  const endsAt = new Date(course.ends_at);
  const shouldUpdateEndsAt = Number.isNaN(endsAt.getTime()) || endsAt.getTime() > now.getTime();

  if (shouldUpdateEndsAt) {
    const { error: updateError } = await adminDb
      .from('courses')
      .update({ ends_at: now.toISOString() })
      .eq('id', courseId);

    if (updateError) {
      return NextResponse.json({ error: 'Impossible de mettre à jour la fin de séance.' }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    endsAt: shouldUpdateEndsAt ? now.toISOString() : course.ends_at,
    updatedEndsAt: shouldUpdateEndsAt,
  });
}
