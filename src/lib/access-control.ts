import { createClient } from '@/lib/supabase/server';
import type { AccessPolicy, AccessType, CourseCategory, CourseFormat, CustomerTier, SmartCourse } from '@/lib/domain/calendar-types';

export type { AccessType, CourseCategory, CourseFormat, CustomerTier, SmartCourse };

function statusLabelFromAccess(accessType: AccessType): SmartCourse['status_label'] {
  if (accessType === 'full') return 'Accès complet';
  if (accessType === 'preview') return 'Accès limité';
  return 'Accès refusé';
}

function sanitizeUuid(value: string): string {
  const trimmed = value.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(trimmed)) {
    throw new Error('Identifiant invalide.');
  }
  return trimmed;
}

export async function getUserTier(userId: string): Promise<CustomerTier | null> {
  const supabase = await createClient();
  const safeUserId = sanitizeUuid(userId);
  const { data, error } = await supabase.rpc('current_customer_tier', { target_user_id: safeUserId });
  if (error) throw new Error(`Impossible de déterminer le profil: ${error.message}`);
  return (data as CustomerTier | null) ?? null;
}

export async function getAccessType(userId: string, courseId: string): Promise<AccessType> {
  const supabase = await createClient();
  const safeUserId = sanitizeUuid(userId);
  const safeCourseId = sanitizeUuid(courseId);
  const { data, error } = await supabase.rpc('course_access_level', {
    target_user_id: safeUserId,
    target_course_id: safeCourseId,
  });

  if (error) throw new Error(`Erreur accès cours: ${error.message}`);
  const raw = data as AccessType | null;
  if (!raw) return 'locked';
  return raw;
}

export async function canAccessCourse(userId: string, courseId: string): Promise<boolean> {
  const accessType = await getAccessType(userId, courseId);
  return accessType === 'full';
}

export async function getCoursesForUser(userId: string): Promise<SmartCourse[]> {
  const safeUserId = sanitizeUuid(userId);
  const supabase = await createClient();

  const [{ data: tierData, error: tierError }, { data: courses, error: coursesError }] = await Promise.all([
    supabase.rpc('current_customer_tier', { target_user_id: safeUserId }),
    supabase
      .from('courses')
      .select(
        'id, slug, title, description, course_format, course_category, starts_at, ends_at, timezone, location, live_url, replay_url, capacity_max, is_published',
      )
      .eq('is_published', true)
      .order('starts_at', { ascending: true }),
  ]);

  if (tierError) throw new Error(`Erreur profil utilisateur: ${tierError.message}`);
  if (coursesError) throw new Error(`Erreur chargement cours: ${coursesError.message}`);

  const tier = (tierData as CustomerTier | null) ?? null;
  if (!courses?.length) return [];
  if (!tier) {
    return courses.map((course) => ({
      ...course,
      access_type: 'locked' as const,
      can_purchase_single: false,
      cta_label: 'Découvrir les abonnements',
      cta_url: '/#offers',
      upsell_tier: null,
      status_label: statusLabelFromAccess('locked'),
    }));
  }

  const policyQuery = await supabase
    .from('access_policies')
    .select('course_format, course_category, access_level, can_purchase_single, cta_label, cta_url, upsell_tier, note')
    .eq('tier', tier);

  if (policyQuery.error) {
    throw new Error(`Erreur politiques d'accès: ${policyQuery.error.message}`);
  }

  const policyMap = new Map<string, AccessPolicy>();
  (policyQuery.data ?? []).forEach((policy) => {
    policyMap.set(`${policy.course_format}:${policy.course_category}`, {
      access_level: policy.access_level,
      can_purchase_single: policy.can_purchase_single,
      cta_label: policy.cta_label,
      cta_url: policy.cta_url,
      upsell_tier: policy.upsell_tier,
      note: policy.note,
    });
  });

  const enrollmentQuery = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('user_id', safeUserId)
    .in('status', ['booked', 'attended']);

  if (enrollmentQuery.error) {
    throw new Error(`Erreur inscriptions: ${enrollmentQuery.error.message}`);
  }

  const enrolledCourseIds = new Set((enrollmentQuery.data ?? []).map((item) => item.course_id));

  return courses.map((course) => {
    const key = `${course.course_format}:${course.course_category}`;
    const policy = policyMap.get(key);
    const hasEnrollment = enrolledCourseIds.has(course.id);
    const accessType: AccessType = hasEnrollment ? 'full' : policy?.access_level ?? 'locked';

    return {
      ...course,
      access_type: accessType,
      can_purchase_single: policy?.can_purchase_single ?? false,
      cta_label: policy?.cta_label ?? 'Découvrir',
      cta_url: policy?.cta_url ?? '/#offers',
      upsell_tier: policy?.upsell_tier ?? null,
      status_label: statusLabelFromAccess(accessType),
    };
  });
}

export async function logBlockedAccess(params: {
  userId: string;
  courseId: string;
  reason: string;
  tier: CustomerTier | null;
  context?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const safeUserId = sanitizeUuid(params.userId);
  const safeCourseId = sanitizeUuid(params.courseId);

  await supabase.from('blocked_access_logs').insert({
    user_id: safeUserId,
    course_id: safeCourseId,
    tier: params.tier,
    reason: params.reason,
    context: params.context ?? {},
  });
}
