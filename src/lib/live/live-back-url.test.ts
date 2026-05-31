import { describe, expect, it } from 'vitest';

import { liveCourseHref, resolveLiveBackLink, sanitizeLiveFromParam } from '@/lib/live/live-back-url';

describe('live-back-url', () => {
  it('sanitizeLiveFromParam accepte les chemins internes admin/compte', () => {
    expect(sanitizeLiveFromParam('/admin/courses')).toBe('/admin/courses');
    expect(sanitizeLiveFromParam('/compte/planning')).toBe('/compte/planning');
  });

  it('sanitizeLiveFromParam rejette les open-redirects', () => {
    expect(sanitizeLiveFromParam('https://evil.test')).toBeNull();
    expect(sanitizeLiveFromParam('//evil.test')).toBeNull();
    expect(sanitizeLiveFromParam('/auth/callback')).toBeNull();
  });

  it('admin vue admin → retour admin (from ou défaut séances)', () => {
    expect(
      resolveLiveBackLink({ from: '/admin', realAdmin: true, effectiveStudentPreview: false }),
    ).toEqual({ href: '/admin', label: 'Tableau de bord' });
    expect(
      resolveLiveBackLink({ from: null, realAdmin: true, effectiveStudentPreview: false }),
    ).toEqual({ href: '/admin/courses', label: 'Séances' });
  });

  it('admin aperçu client → retour client même si from admin', () => {
    expect(
      resolveLiveBackLink({ from: '/admin/courses', realAdmin: true, effectiveStudentPreview: true }),
    ).toEqual({ href: '/compte', label: 'Calendrier' });
  });

  it('client → retour compte', () => {
    expect(
      resolveLiveBackLink({ from: '/compte/planning', realAdmin: false, effectiveStudentPreview: false }),
    ).toEqual({ href: '/compte/planning', label: 'Planning' });
  });

  it('liveCourseHref encode from et preview', () => {
    expect(liveCourseHref('abc', { from: '/admin/courses' })).toBe('/live/abc?from=%2Fadmin%2Fcourses');
    expect(liveCourseHref('abc', { from: '/admin/courses', preview: 'client' })).toBe(
      '/live/abc?preview=client&from=%2Fadmin%2Fcourses',
    );
  });
});
