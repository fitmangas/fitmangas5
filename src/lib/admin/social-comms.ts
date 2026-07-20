import { createAdminClient } from '@/lib/supabase/admin';

export type SocialNetwork = 'instagram' | 'whatsapp' | 'facebook' | 'tiktok';
export type SocialPostFormat = 'feed' | 'story' | 'reel' | 'carousel' | 'text';
export type SocialPostStatus = 'idea' | 'ready' | 'scheduled' | 'published' | 'skipped';
export type SocialPostSource = 'manual' | 'ai' | 'blog' | 'pillar' | 'course';

export type SocialPost = {
  id: string;
  network: SocialNetwork;
  format: SocialPostFormat;
  title: string;
  caption: string;
  hashtags: string[];
  cta: string;
  imageHint: string;
  imagePath: string | null;
  overlayText: string | null;
  useOverlay: boolean;
  plannedAt: string | null;
  status: SocialPostStatus;
  sourceType: SocialPostSource;
  sourceRef: string | null;
  whyItWorks: string;
  metaExternalId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SocialCommsBoard = {
  version: 2;
  posts: SocialPost[];
  lastGeneratedAt: string | null;
};

export type MetaSocialConnection = {
  connected: boolean;
  pageId: string | null;
  pageName: string | null;
  igUserId: string | null;
  igUsername: string | null;
  accessToken: string | null;
  tokenExpiresAt: string | null;
  updatedAt: string | null;
};

export const SOCIAL_COMMS_SETTING_KEY = 'social_comms_board';
export const META_SOCIAL_SETTING_KEY = 'meta_social_connection';

export const SOCIAL_NETWORK_LABELS: Record<SocialNetwork, string> = {
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  tiktok: 'TikTok',
};

export const SOCIAL_STATUS_LABELS: Record<SocialPostStatus, string> = {
  idea: 'Idée',
  ready: 'Prêt',
  scheduled: 'Programmé',
  published: 'Publié',
  skipped: 'Ignoré',
};

/** Images fiables pour posts (priorité portraits/exercices, pas de screenshots). */
export const SOCIAL_LIBRARY_IMAGES = [
  '/Photo Alejandra pose pour photographe.JPG',
  '/Photo Alejandra exercice avec anneau.PNG',
  '/Photo Alejandra exercice sur la plage.JPG',
  '/library/alejandra/portraits/portrait-studio-sourire.png',
  '/library/alejandra/portraits/portrait-studio-sourire-large.png',
  '/library/alejandra/exercices/exercice-anneau-variation.png',
  '/library/alejandra/exercices/exercice-elastique.png',
  '/library/alejandra/exercices/exercice-rouleau.png',
  '/library/alejandra/exercices/exercice-ballon.jpg',
  '/library/alejandra/exercices/exercice-ballon-2.jpg',
  '/library/alejandra/exercices/exercice-chaise.jpg',
  '/alejandra.png',
  '/landing/offer-v-coll.jpg',
] as const;

export function emptySocialCommsBoard(): SocialCommsBoard {
  return { version: 2, posts: [], lastGeneratedAt: null };
}

export function emptyMetaConnection(): MetaSocialConnection {
  return {
    connected: false,
    pageId: null,
    pageName: null,
    igUserId: null,
    igUsername: null,
    accessToken: null,
    tokenExpiresAt: null,
    updatedAt: null,
  };
}

function isSocialNetwork(value: unknown): value is SocialNetwork {
  return value === 'instagram' || value === 'whatsapp' || value === 'facebook' || value === 'tiktok';
}

function isSocialStatus(value: unknown): value is SocialPostStatus {
  return value === 'idea' || value === 'ready' || value === 'scheduled' || value === 'published' || value === 'skipped';
}

function isSocialFormat(value: unknown): value is SocialPostFormat {
  return value === 'feed' || value === 'story' || value === 'reel' || value === 'carousel' || value === 'text';
}

export function pickLibraryImage(seed = 0): string {
  const list = SOCIAL_LIBRARY_IMAGES;
  return list[Math.abs(seed) % list.length]!;
}

function normalizePost(raw: unknown, index = 0): SocialPost | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.id !== 'string' || !isSocialNetwork(row.network) || !isSocialFormat(row.format) || !isSocialStatus(row.status)) {
    return null;
  }
  const rawImage = typeof row.imagePath === 'string' ? row.imagePath : null;
  const imagePath =
    rawImage && (SOCIAL_LIBRARY_IMAGES as readonly string[]).includes(rawImage)
      ? rawImage
      : row.network === 'whatsapp' && row.format === 'text'
        ? null
        : pickLibraryImage(index + row.id.length);

  return {
    id: row.id,
    network: row.network,
    format: row.format,
    title: typeof row.title === 'string' ? row.title : 'Sans titre',
    caption: typeof row.caption === 'string' ? row.caption : '',
    hashtags: Array.isArray(row.hashtags) ? row.hashtags.map(String).filter(Boolean).slice(0, 12) : [],
    cta: typeof row.cta === 'string' ? row.cta : '',
    imageHint: typeof row.imageHint === 'string' ? row.imageHint : '',
    imagePath,
    overlayText: typeof row.overlayText === 'string' ? row.overlayText : typeof row.title === 'string' ? row.title : null,
    useOverlay: Boolean(row.useOverlay),
    plannedAt: typeof row.plannedAt === 'string' ? row.plannedAt : null,
    status: row.status,
    sourceType:
      row.sourceType === 'manual' ||
      row.sourceType === 'ai' ||
      row.sourceType === 'blog' ||
      row.sourceType === 'pillar' ||
      row.sourceType === 'course'
        ? row.sourceType
        : 'manual',
    sourceRef: typeof row.sourceRef === 'string' ? row.sourceRef : null,
    whyItWorks: typeof row.whyItWorks === 'string' ? row.whyItWorks : '',
    metaExternalId: typeof row.metaExternalId === 'string' ? row.metaExternalId : null,
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : new Date().toISOString(),
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : new Date().toISOString(),
  };
}

export function parseSocialCommsBoard(raw: unknown): SocialCommsBoard {
  if (!raw || typeof raw !== 'object') return emptySocialCommsBoard();
  const board = raw as Record<string, unknown>;
  const posts = Array.isArray(board.posts)
    ? board.posts.map((item, index) => normalizePost(item, index)).filter((post): post is SocialPost => Boolean(post))
    : [];
  return {
    version: 2,
    posts,
    lastGeneratedAt: typeof board.lastGeneratedAt === 'string' ? board.lastGeneratedAt : null,
  };
}

export async function getSocialCommsBoard(): Promise<SocialCommsBoard> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('admin_settings')
      .select('value')
      .eq('key', SOCIAL_COMMS_SETTING_KEY)
      .maybeSingle();
    if (error || !data?.value) return emptySocialCommsBoard();
    try {
      return parseSocialCommsBoard(JSON.parse(String(data.value)));
    } catch {
      return emptySocialCommsBoard();
    }
  } catch {
    return emptySocialCommsBoard();
  }
}

export async function saveSocialCommsBoard(board: SocialCommsBoard): Promise<void> {
  const admin = createAdminClient();
  const payload = {
    version: 2 as const,
    posts: board.posts,
    lastGeneratedAt: board.lastGeneratedAt,
  };
  const { error } = await admin.from('admin_settings').upsert(
    {
      key: SOCIAL_COMMS_SETTING_KEY,
      value: JSON.stringify(payload),
    },
    { onConflict: 'key' },
  );
  if (error) throw new Error(error.message);
}

export async function getMetaSocialConnection(): Promise<MetaSocialConnection> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('admin_settings')
      .select('value')
      .eq('key', META_SOCIAL_SETTING_KEY)
      .maybeSingle();
    if (error || !data?.value) return emptyMetaConnection();
    const parsed = JSON.parse(String(data.value)) as Partial<MetaSocialConnection>;
    return {
      ...emptyMetaConnection(),
      ...parsed,
      connected: Boolean(parsed.accessToken && parsed.pageId),
    };
  } catch {
    return emptyMetaConnection();
  }
}

export async function saveMetaSocialConnection(connection: MetaSocialConnection): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from('admin_settings').upsert(
    {
      key: META_SOCIAL_SETTING_KEY,
      value: JSON.stringify({ ...connection, connected: Boolean(connection.accessToken && connection.pageId) }),
    },
    { onConflict: 'key' },
  );
  if (error) throw new Error(error.message);
}

export function createSocialPostId(): string {
  return `sp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function upcomingSocialPosts(board: SocialCommsBoard, limit = 3): SocialPost[] {
  const now = Date.now();
  return [...board.posts]
    .filter((post) => post.status !== 'published' && post.status !== 'skipped')
    .sort((a, b) => {
      const aTime = a.plannedAt ? new Date(a.plannedAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.plannedAt ? new Date(b.plannedAt).getTime() : Number.MAX_SAFE_INTEGER;
      if (aTime !== bTime) return aTime - bTime;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    })
    .filter((post) => !post.plannedAt || new Date(post.plannedAt).getTime() >= now - 1000 * 60 * 60 * 24)
    .slice(0, limit);
}

export function startOfWeekMonday(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d;
}

export function absolutePublicUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(/\/$/, '');
  if (path.startsWith('http')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  // Encode chaque segment (espaces dans noms de fichiers publics, etc.)
  const encoded = normalized
    .split('/')
    .map((segment, index) => (index === 0 ? segment : encodeURIComponent(segment)))
    .join('/');
  return `${base}${encoded}`;
}

/** Jour local YYYY-MM-DD (évite le décalage UTC du calendrier). */
export function localDayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
