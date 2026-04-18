import { NextResponse } from 'next/server';
import { getCoursesForUser, getUserTier } from '@/lib/access-control';
import { requireAuthenticatedUser } from '@/lib/api-auth';

export async function GET() {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  try {
    const [tier, courses] = await Promise.all([
      getUserTier(auth.user.id),
      getCoursesForUser(auth.user.id),
    ]);
    return NextResponse.json({ tier, courses });
  } catch (error) {
    console.error('[api/courses/list]', error);
    return NextResponse.json({ error: 'Impossible de charger les cours.' }, { status: 500 });
  }
}
