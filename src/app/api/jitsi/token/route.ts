import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAccessType, getUserLivePrivileges } from '@/lib/access-control';
import { requireAuthenticatedUser } from '@/lib/api-auth';
import { resolveJitsiEmbedFromRoomUrl } from '@/lib/jitsi/embed-from-room-url';
import { createJitsiJwtToken } from '@/lib/jitsi/jwt';

const bodySchema = z.object({
  courseId: z.string().uuid(),
  /** Aperçu « côté élève » : JWT sans droits modérateur même si admin. */
  studentPreview: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  try {
    const raw = (await request.json()) as unknown;
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Requete invalide.' }, { status: 400 });
    }

    const { courseId, studentPreview } = parsed.data;
    const { supabase, user } = auth;

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, jitsi_link, is_published')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError || !course || !course.is_published || !course.jitsi_link) {
      return NextResponse.json({ error: 'Cours live introuvable.' }, { status: 404 });
    }

    const privileges = await getUserLivePrivileges(user.id);
    const hasStandardAccess = privileges.isAdmin || (await getAccessType(user.id, courseId)) === 'full';

    if (!hasStandardAccess) {
      return NextResponse.json({ error: 'Acces refuse.' }, { status: 403 });
    }

    const { domain, roomName } = resolveJitsiEmbedFromRoomUrl(course.jitsi_link);
    const displayName =
      (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()) ||
      (user.email?.split('@')[0] ?? 'Participant');
    const email = user.email ?? 'participant@local';

    const moderatorInRoom = privileges.isAdmin && !studentPreview;

    let token: string;
    try {
      token = createJitsiJwtToken({
        roomName,
        domain,
        displayName,
        email,
        isModerator: moderatorInRoom,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Configuration JWT absente.';
      return NextResponse.json({ error: message }, { status: 503 });
    }

    return NextResponse.json({
      token,
      roomName,
      domain,
      moderator: moderatorInRoom,
      user: { displayName, email },
    });
  } catch (error) {
    console.error('[api/jitsi/token]', error);
    return NextResponse.json({ error: 'Impossible de generer le token Jitsi.' }, { status: 500 });
  }
}
