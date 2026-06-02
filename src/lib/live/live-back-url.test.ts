import { describe, expect, it } from 'vitest';

import { isLiveAdminEntry, liveCourseHref, resolveLiveBackLink, sanitizeLiveFromParam } from '@/lib/live/live-back-url';

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
      resolveLiveBackLink({ from: '/admin', realAdmin: true, studentPreviewFromUrl: false }),
    ).toEqual({ href: '/admin', label: 'Tableau de bord' });
    expect(
      resolveLiveBackLink({ from: null, realAdmin: true, studentPreviewFromUrl: false }),
    ).toEqual({ href: '/admin/courses', label: 'Séances' });
  });

  it('admin avec ?from=/admin/courses → retour admin même sans preview URL', () => {
    expect(
      resolveLiveBackLink({ from: '/admin/courses', realAdmin: true, studentPreviewFromUrl: false }),
    ).toEqual({ href: '/admin/courses', label: 'Séances' });
  });

  it('admin aperçu client (?preview=client) → retour client', () => {
    expect(
      resolveLiveBackLink({ from: '/admin/courses', realAdmin: true, studentPreviewFromUrl: true }),
    ).toEqual({ href: '/compte', label: 'Calendrier' });
  });

  it('client → retour compte', () => {
    expect(
      resolveLiveBackLink({ from: '/compte/planning', realAdmin: false, studentPreviewFromUrl: false }),
    ).toEqual({ href: '/compte/planning', label: 'Planning' });
  });

  it('liveCourseHref encode from et preview', () => {
    expect(liveCourseHref('abc', { from: '/admin/courses' })).toBe('/live/abc?from=%2Fadmin%2Fcourses');
    expect(liveCourseHref('abc', { from: '/admin/courses', preview: 'client' })).toBe(
      '/live/abc?preview=client&from=%2Fadmin%2Fcourses',
    );
  });

  it('isLiveAdminEntry détecte la provenance admin', () => {
    expect(isLiveAdminEntry('/admin')).toBe(true);
    expect(isLiveAdminEntry('/admin/courses')).toBe(true);
    expect(isLiveAdminEntry('/compte/planning')).toBe(false);
    expect(isLiveAdminEntry(null)).toBe(false);
  });
});
