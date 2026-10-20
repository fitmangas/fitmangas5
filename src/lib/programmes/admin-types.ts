/** Types partagés de l'éditeur de programmes (B10) — serveur et navigateur. */

export type L10n = { fr: string; es: string };

export type AdminListItem = {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  level: number;
  weeks: number;
  sessions: number;
  coverUrl: string;
};

export type AdminWeek = { id: string; week: number; focus: L10n; cues: L10n[] };

export type AdminStep = {
  id: string;
  week: number;
  position: number;
  kind: 'video' | 'live';
  videoId: string | null;
  startS: number | null;
  endS: number | null;
  toValidate: boolean;
  minutes: number | null;
  objective: L10n;
  objectiveLong: L10n | null;
  liveStyle: string | null;
  /** Des clientes ont déjà suivi cette séance : suppression refusée. */
  hasProgress: boolean;
};

export type AdminTest = {
  key: string;
  type: 'seconds' | 'count' | 'scale';
  label: L10n;
  how: L10n;
  scale?: { fr: string[]; es: string[] };
};

export type AdminProgramDetail = {
  id: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  level: number;
  track: string;
  goals: string[];
  title: L10n;
  promise: L10n;
  forWho: L10n;
  notFor: L10n;
  coachNote: L10n;
  weeks: number;
  perWeek: number;
  minutesRange: string;
  coverUrl: string;
  nextProgramId: string | null;
  liveStyle: string;
  tests: AdminTest[];
  weekRows: AdminWeek[];
  steps: AdminStep[];
  updatedAt: string | null;
};

export type AdminVideo = {
  id: string;
  title: string;
  folder: string;
  durationS: number | null;
  thumb: string;
  embedUrl: string | null;
  vimeoId: string | null;
  usedIn: number;
};

export type AdminStats = {
  active: number;
  activeNew7: number;
  completed: number;
  finishRate: number | null;
  catalogRate: number | null;
  drop: { n: number; title: string; hardPct: number | null } | null;
};

export const ADMIN_LEVELS: Record<number, string> = { 0: 'Tous niveaux', 1: 'Débutante', 2: 'Intermédiaire', 3: 'Avancée' };
export const ADMIN_TRACKS: Record<string, string> = { pilates: 'Pilates', barre: 'Barre', cardio: 'Cardio & silhouette', 'bien-etre': 'Bien-être' };
export const ADMIN_GOALS: Record<string, string> = {
  debuter: 'Débuter en douceur',
  tonifier: 'Tonifier',
  dos: 'Dos & posture',
  cardio: 'Cardio',
  souplesse: 'Souplesse',
  express: 'Peu de temps',
};

/** « 1:01:11 » / « 30:00 » → secondes ; null si illisible. */
export function parseClock(input: string): number | null {
  const parts = input.trim().split(':').map((p) => p.trim());
  if (!parts.length || parts.some((p) => !/^\d+$/.test(p))) return null;
  const nums = parts.map(Number);
  if (nums.length === 1) return nums[0] * 60;
  if (nums.length === 2) return nums[1] < 60 ? nums[0] * 60 + nums[1] : null;
  if (nums.length === 3) return nums[1] < 60 && nums[2] < 60 ? nums[0] * 3600 + nums[1] * 60 + nums[2] : null;
  return null;
}

export function formatClock(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null) return '';
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' et ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}
