import { NextResponse } from 'next/server';

import { buildIcsContent } from '@/lib/calendar-add-event';
import { getEmailPublicBaseUrl } from '@/lib/email/base-template';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Fichier agenda (.ics) d'UN live publié, pour le lien « Apple » des emails de rappel.
 * Ne contient que le titre, les horaires et le lien vers la page du live (qui exige la connexion).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(courseId)) return NextResponse.json({ error: 'Live introuvable.' }, { status: 404 });
  const admin = createAdminClient();
  const { data: course, error } = await admin
    .from('courses')
    .select('id, title, starts_at, ends_at, is_published, course_format')
    .eq('id', courseId)
    .maybeSingle();
  if (error || !course || !course.is_published || course.course_format !== 'online') {
    return NextResponse.json({ error: 'Live introuvable.' }, { status: 404 });
  }
  const url = `${getEmailPublicBaseUrl()}/live/${course.id}`;
  const ics = buildIcsContent({
    id: course.id,
    title: `${course.title} · FitMangas`,
    description: `Live avec Alejandra. Rejoindre : ${url}`,
    startsAt: course.starts_at,
    endsAt: course.ends_at,
    location: 'Visio FitMangas',
    url,
  });
  return new NextResponse(ics, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="fitmangas-live-${course.id.slice(0, 8)}.ics"`,
      'cache-control': 'public, max-age=300',
    },
  });
}
