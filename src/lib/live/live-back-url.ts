const ALLOWED_FROM_ROOTS = ['/admin', '/compte'] as const;

export const LIVE_FROM_ADMIN = '/admin';
export const LIVE_FROM_ADMIN_COURSES = '/admin/courses';

/** Valide un chemin interne passé en ?from= (anti open-redirect). */
export function sanitizeLiveFromParam(from: string | undefined | null): string | null {
  if (!from?.trim()) return null;
  const path = from.trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) return null;
  const pathname = path.split('?')[0]?.split('#')[0] ?? '';
  if (!pathname) return null;
  const allowed = ALLOWED_FROM_ROOTS.some((root) => pathname === root || pathname.startsWith(`${root}/`));
  return allowed ? pathname : null;
}

export type LiveBackLink = {
  href: string;
  label: string;
};

function labelForPath(path: string): string {
  if (path === '/admin') return 'Tableau de bord';
  if (path.startsWith('/admin/courses')) return 'Séances';
  if (path.startsWith('/admin/replays')) return 'Replays';
  if (path.startsWith('/admin')) return 'Administration';
  if (path === '/compte/planning') return 'Planning';
  if (path.startsWith('/compte/replays')) return 'Mes replays & ma bibliothèque';
  if (path.startsWith('/compte/blog')) return 'Blog';
  if (path.startsWith('/compte/boutique')) return 'Boutique';
  if (path.startsWith('/compte/profil')) return 'Profil';
  return 'Calendrier';
}

/** Lien retour /live — respecte la vue d'origine sans toucher au toggle admin/client. */
export function resolveLiveBackLink(params: {
  from?: string | null;
  realAdmin: boolean;
  /** true uniquement si ?preview=client (pas le cookie mode démo). */
  studentPreviewFromUrl: boolean;
}): LiveBackLink {
  const from = sanitizeLiveFromParam(params.from);

  // Provenance espace client explicite : toujours la respecter,
  // y compris si l’utilisateur est aussi admin (sinon « Séances » → /admin/courses).
  if (from?.startsWith('/compte')) {
    return { href: from, label: labelForPath(from) };
  }

  if (params.studentPreviewFromUrl || !params.realAdmin) {
    return { href: '/compte', label: 'Calendrier' };
  }

  if (from?.startsWith('/admin')) {
    return { href: from, label: labelForPath(from) };
  }

  return { href: LIVE_FROM_ADMIN_COURSES, label: 'Séances' };
}

/** true si ?from= pointe vers une page admin (lien play/œil dashboard, séances, etc.). */
export function isLiveAdminEntry(from: string | undefined | null): boolean {
  const path = sanitizeLiveFromParam(from);
  return path?.startsWith('/admin') ?? false;
}

/** Construit l'URL /live avec provenance optionnelle. */
export function liveCourseHref(courseId: string, options?: { from?: string; preview?: 'client' }): string {
  const q = new URLSearchParams();
  if (options?.preview === 'client') q.set('preview', 'client');
  if (options?.from) q.set('from', options.from);
  const qs = q.toString();
  return qs ? `/live/${courseId}?${qs}` : `/live/${courseId}`;
}
