import { NextResponse } from 'next/server';
import { canAccessCourse, getAccessType, getCoursesForUser, getUserTier, logBlockedAccess } from '@/lib/access-control';
import { requireAuthenticatedUser } from '@/lib/api-auth';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'Identifiant de cours invalide.' }, { status: 400 });
  }

  try {
    const [tier, accessType, canAccess, courses] = await Promise.all([
      getUserTier(auth.user.id),
      getAccessType(auth.user.id, id),
      canAccessCourse(auth.user.id, id),
      getCoursesForUser(auth.user.id),
    ]);

    const course = courses.find((item) => item.id === id);
    if (!course) {
      return NextResponse.json({ error: 'Cours introuvable.' }, { status: 404 });
    }

    if (accessType === 'locked') {
      await logBlockedAccess({
        userId: auth.user.id,
        courseId: id,
        tier,
        reason: 'api-course-access-check',
        context: { endpoint: '/api/courses/[id]/access' },
      });
    }

    return NextResponse.json({
      courseId: id,
      tier,
      accessType,
      canAccess,
      policy: {
        ctaLabel: course.cta_label,
        ctaUrl: course.cta_url,
        canPurchaseSingle: course.can_purchase_single,
        upsellTier: course.upsell_tier,
      },
    });
  } catch (error) {
    console.error('[api/courses/[id]/access]', error);
    return NextResponse.json({ error: 'Impossible de vérifier les droits.' }, { status: 500 });
  }
}
