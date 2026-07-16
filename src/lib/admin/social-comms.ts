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
  plannedAt: string | null;
  status: SocialPostStatus;
  sourceType: SocialPostSource;
  sourceRef: string | null;
  whyItWorks: string;
  createdAt: string;
  updatedAt: string;
};

export type SocialCommsBoard = {
  version: 1;
  posts: SocialPost[];
  lastGeneratedAt: string | null;
};

export const SOCIAL_COMMS_SETTING_KEY = 'social_comms_board';

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

export const SOCIAL_LIBRARY_IMAGES = [
  '/library/alejandra/portraits/portrait-studio-sourire.png',
  '/library/alejandra/portraits/portrait-studio-sourire-large.png',
  '/library/alejandra/exercices/exercice-anneau-variation.png',
  '/library/alejandra/exercices/exercice-elastique.png',
  '/library/alejandra/exercices/exercice-rouleau.png',
  '/library/alejandra/exercices/exercice-ballon.jpg',
  '/library/alejandra/exercices/exercice-ballon-2.jpg',
  '/library/alejandra/exercices/exercice-chaise.jpg',
  '/Photo Alejandra exercice avec anneau.PNG',
  '/Photo Alejandra pose pour photographe.JPG',
  '/Photo Alejandra exercice sur la plage.JPG',
  '/espace cliente dashboard.png',
  '/espace cliente replays.png',
  '/library/espace-client/desktop/blog-desktop.png',
  '/library/espace-client/desktop/progression-desktop.png',
] as const;

export function emptySocialCommsBoard(): SocialCommsBoard {
  return { version: 1, posts: [], lastGeneratedAt: null };
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

function normalizePost(raw: unknown): SocialPost | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.id !== 'string' || !isSocialNetwork(row.network) || !isSocialFormat(row.format) || !isSocialStatus(row.status)) {
    return null;
  }
  return {
    id: row.id,
    network: row.network,
    format: row.format,
    title: typeof row.title === 'string' ? row.title : 'Sans titre',
    caption: typeof row.caption === 'string' ? row.caption : '',
    hashtags: Array.isArray(row.hashtags) ? row.hashtags.map(String).filter(Boolean).slice(0, 12) : [],
    cta: typeof row.cta === 'string' ? row.cta : '',
    imageHint: typeof row.imageHint === 'string' ? row.imageHint : '',
    imagePath: typeof row.imagePath === 'string' ? row.imagePath : null,
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
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : new Date().toISOString(),
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : new Date().toISOString(),
  };
}

export function parseSocialCommsBoard(raw: unknown): SocialCommsBoard {
  if (!raw || typeof raw !== 'object') return emptySocialCommsBoard();
  const board = raw as Record<string, unknown>;
  const posts = Array.isArray(board.posts)
    ? board.posts.map(normalizePost).filter((post): post is SocialPost => Boolean(post))
    : [];
  return {
    version: 1,
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
    version: 1 as const,
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
