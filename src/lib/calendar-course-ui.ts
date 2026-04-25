import type { AccessType, SmartCourse } from '@/lib/domain/calendar-types';

/** Admin ou accès complet déclaré (aligné avec SmartCalendar). */
export function effectiveAccessForUi(course: SmartCourse): AccessType {
  if (course.viewer_is_admin === true || course.access_type === 'full') {
    return 'full';
  }
  return course.access_type;
}

export function badgeForAccess(access: AccessType) {
  if (access === 'full') return 'Accès complet';
  if (access === 'preview') return 'Accès limité';
  return 'Accès refusé';
}
