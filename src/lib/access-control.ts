import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isListedAdminEmail } from '@/lib/auth/admin';
import { DEMO_SIMULATED_CUSTOMER_TIER, getDemoClientMode } from '@/lib/demo-client-mode';
import type { AccessPolicy, AccessType, CourseCategory, CourseFormat, CustomerTier, SmartCourse } from '@/lib/domain/calendar-types';

export type { AccessType, CourseCategory, CourseFormat, CustomerTier, SmartCourse };

function statusLabelFromAccess(accessType: AccessType): SmartCourse['status_label'] {
  if (accessType === 'full') return 'Accès complet';
  if (accessType === 'preview') return 'Accès limité';
  return 'Accès refusé';
}

/** Aligné avec canAccessCourse : exposer le lien Jitsi au client calendrier. */
function shouldExposeJitsiLink(
  accessType: AccessType,
  isAdmin: boolean,
): boolean {
  return accessType === 'full' || isAdmin;
}

/** `profiles.role` via SERVICE_ROLE_KEY (prioritaire pour confirmer l’admin). */
async function fetchProfileRoleViaServiceRole(safeUserId: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from('profiles').select('role').eq('id', safeUserId).maybeSingle();
    if (!error && data?.role != null && String(data.role).trim() !== '') return String(data.role).trim();
  } catch {
    // SUPABASE_SERVICE_ROLE_KEY absent ou erreur réseau.
  }
  return null;
}

/** Retombée : session utilisateur (anon + cookies). */
async function fetchProfileRoleViaSession(safeUserId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('role').eq('id', safeUserId).maybeSingle();
  return data?.role != null && String(data.role).trim() !== '' ? String(data.role).trim() : null;
}

async function fetchProfileRoleForAccess(safeUserId: string): Promise<string | null> {
  const viaService = await fetchProfileRoleViaServiceRole(safeUserId);
  if (viaService != null) return viaService;
  return fetchProfileRoleViaSession(safeUserId);
}

export type UserLivePrivileges = {
  tier: CustomerTier | null;
  isAdmin: boolean;
  /** Valeur brute `profiles.role` (debug + branches explicites). */
  profileRole: string | null;
};

/**
 * Privilèges réels (sans mode démo). Pour l’UI admin vs simulation client.
 */
export async function getLivePrivilegesTruthful(userId: string): Promise<UserLivePrivileges> {
  const safeUserId = sanitizeUuid(userId);
  const supabase = await createClient();

  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();

  const [{ data: tierData, error: tierError }, profileRole] = await Promise.all([
    supabase.rpc('current_customer_tier', { target_user_id: safeUserId }),
    fetchProfileRoleForAccess(safeUserId),
  ]);

  if (tierError) throw new Error(`Erreur profil utilisateur: ${tierError.message}`);
  const tier = (tierData as CustomerTier | null) ?? null;
  const roleAdmin = (profileRole ?? '').toLowerCase() === 'admin';
  const emailMatchesSession =
    sessionUser?.id === safeUserId ? isListedAdminEmail(sessionUser.email) : false;
  const isAdmin = roleAdmin || emailMatchesSession;

  return { tier, isAdmin, profileRole };
}

/**
 * Source unique pour les privilèges live (rôle admin + tier utilisateur).
 * En mode démo (admin + cookie), ressemble à un élève abonné : pas de flag admin.
 */
export async function getUserLivePrivileges(userId: string): Promise<UserLivePrivileges> {
  const truth = await getLivePrivilegesTruthful(userId);
  if (truth.isAdmin && (await getDemoClientMode())) {
    return {
      tier: DEMO_SIMULATED_CUSTOMER_TIER,
      isAdmin: false,
      profileRole: truth.profileRole,
    };
  }
  return truth;
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
  const truth = await getLivePrivilegesTruthful(userId);
  if (truth.isAdmin && (await getDemoClientMode())) {
    return DEMO_SIMULATED_CUSTOMER_TIER;
  }
  const supabase = await createClient();
  const safeUserId = sanitizeUuid(userId);
  const { data, error } = await supabase.rpc('current_customer_tier', { target_user_id: safeUserId });
  if (error) throw new Error(`Impossible de déterminer le profil: ${error.message}`);
  return (data as CustomerTier | null) ?? null;
}

export async function getAccessType(userId: string, courseId: string): Promise<AccessType> {
  const truth = await getLivePrivilegesTruthful(userId);
  if (truth.isAdmin && (await getDemoClientMode())) {
    return 'full';
  }
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
  sanitizeUuid(courseId);
  const { isAdmin } = await getUserLivePrivileges(userId);
  if (isAdmin) {
    return true;
  }
  const accessType = await getAccessType(userId, courseId);
  return accessType === 'full';
}

export async function getCoursesForUser(userId: string): Promise<SmartCourse[]> {
  const safeUserId = sanitizeUuid(userId);
  const supabase = await createClient();

  const [{ tier, isAdmin }, { data: courses, error: coursesError }, demoSimulateClient] =
    await Promise.all([
      getUserLivePrivileges(userId),
      supabase
        .from('courses')
        .select(
          'id, slug, title, description, course_format, course_category, starts_at, ends_at, timezone, location, live_url, jitsi_link, replay_url, capacity_max, is_published',
        )
        .eq('is_published', true)
        .order('starts_at', { ascending: true }),
      (async () => {
        const t = await getLivePrivilegesTruthful(userId);
        return t.isAdmin && (await getDemoClientMode());
      })(),
    ]);

  if (coursesError) throw new Error(`Erreur chargement cours: ${coursesError.message}`);

  if (!courses?.length) return [];

  const isAdminUser = isAdmin;

  if (!tier && !isAdminUser) {
    return courses.map((course) => ({
      ...course,
      jitsi_link: null,
      viewer_is_admin: false,
      access_type: 'locked' as const,
      can_purchase_single: false,
      cta_label: 'Découvrir les abonnements',
      cta_url: '/#offers',
      upsell_tier: null,
      status_label: statusLabelFromAccess('locked'),
    }));
  }

  if (isAdminUser) {
    return courses.map((course) => ({
      ...course,
      jitsi_link: shouldExposeJitsiLink('full', true) ? course.jitsi_link ?? null : null,
      viewer_is_admin: true,
      access_type: 'full' as const,
      can_purchase_single: false,
      cta_label: 'Découvrir les abonnements',
      cta_url: '/#offers',
      upsell_tier: null,
      status_label: statusLabelFromAccess('full'),
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

  if (demoSimulateClient) {
    for (const c of courses) {
      if (c.course_format === 'online') {
        enrolledCourseIds.add(c.id);
      }
    }
  }

  return courses.map((course) => {
    const key = `${course.course_format}:${course.course_category}`;
    const policy = policyMap.get(key);
    const hasEnrollment = enrolledCourseIds.has(course.id);
    const accessType: AccessType = hasEnrollment ? 'full' : policy?.access_level ?? 'locked';

    return {
      ...course,
      jitsi_link: shouldExposeJitsiLink(accessType, isAdminUser) ? course.jitsi_link ?? null : null,
      viewer_is_admin: false,
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
