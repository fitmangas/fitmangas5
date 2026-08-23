import { createAdminClient } from '@/lib/supabase/admin';

export type SocialNetwork = 'instagram' | 'whatsapp' | 'facebook' | 'linkedin' | 'tiktok';
export type SocialPostFormat = 'feed' | 'story' | 'reel' | 'carousel' | 'text';
export type SocialPostStatus = 'idea' | 'ready' | 'scheduled' | 'published' | 'skipped';
export type SocialPostSource = 'manual' | 'ai' | 'blog' | 'pillar' | 'course';
export type SocialLocale = 'fr' | 'es';

export type SocialImageSource = 'library' | 'ai' | 'unsplash' | 'brand' | 'none';
export type SocialVideoStatus = 'brief' | 'raw_uploaded' | 'editing' | 'edited' | 'ready';

export type SocialPost = {
  id: string;
  network: SocialNetwork;
  format: SocialPostFormat;
  /** Langue du contenu (FR / ES). */
  locale: SocialLocale;
  title: string;
  caption: string;
  hashtags: string[];
  cta: string;
  imageHint: string;
  imagePath: string | null;
  imageSource: SocialImageSource;
  aiImagePrompt: string;
  imageFeedback: string;
  overlayText: string | null;
  useOverlay: boolean;
  /** Reel / vidéo */
  hookTitle: string;
  reelScript: string;
  shotList: string;
  rawVideoPath: string | null;
  editedVideoPath: string | null;
  videoStatus: SocialVideoStatus | null;
  carouselPaths: string[];
  /** Titres overlay par slide (carousel, longueur 7). */
  carouselSlideTitles?: string[];
  /** Série « 50 conseils » (portée). */
  seriesKind?: 'conseil_50' | null;
  seriesNumber?: number | null;
  seriesKeyword?: string | null;
  plannedAt: string | null;
  status: SocialPostStatus;
  sourceType: SocialPostSource;
  sourceRef: string | null;
  whyItWorks: string;
  metaExternalId: string | null;
  /** Titre rejeté 2× par le gate qualité — à corriger avant publish. */
  titleNeedsReview?: boolean;
  /** Overlays carousel invalides — pack figé interdit ; à corriger avant publish. */
  overlaysNeedReview?: boolean;
  /** whyItWorks hors langue du post (ex. anglais sur post FR). */
  whyItWorksNeedsReview?: boolean;
  /** Carousel : au moins une slide image manquante (pas de duplication silencieuse). */
  carouselMissingSlides?: boolean;
  /** Variante ES périmée après édition / regen FR (comme blog ES stale). */
  esStale?: boolean;
  /** Pilier / thème (id ContentTheme). */
  pillarId?: string | null;
  /** Famille éditoriale CM v4. */
  contentFamily?: 'portee' | 'confiance' | 'conversion' | null;
  /** WhatsApp / LinkedIn : copie manuelle marquée envoyée. */
  manualSentAt?: string | null;
  /** Instagram → aussi publier sur la Page Facebook (même contenu). */
  alsoPublishFacebook: boolean;
  /** Post LinkedIn créé depuis un autre post (id source). */
  adaptedFromId: string | null;
  /** Id Meta Facebook si miroir IG→FB publié. */
  facebookExternalId: string | null;
  /** Suivi génération CM progressive (post par post). */
  generationStatus?: 'pending' | 'done' | 'failed' | 'retrying' | null;
  generationError?: string | null;
  generationRunId?: string | null;
  generationSlot?: number | null;
  generationMediaKind?: string | null;
  generationDayOffset?: number | null;
  generationSlotIndex?: number | null;
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
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
};

export const SOCIAL_LOCALE_LABELS: Record<SocialLocale, string> = {
  fr: 'Français',
  es: 'Español',
};

/** Couleurs logo / marque pour calendrier & pastilles. */
export const SOCIAL_NETWORK_COLORS: Record<
  SocialNetwork,
  { bg: string; text: string; border: string; short: string }
> = {
  instagram: { bg: '#fce7f3', text: '#9d174d', border: '#E1306C', short: 'IG' },
  whatsapp: { bg: '#ecfdf5', text: '#065f46', border: '#25D366', short: 'WA' },
  facebook: { bg: '#eff6ff', text: '#1e3a8a', border: '#1877F2', short: 'FB' },
  linkedin: { bg: '#e8f4fc', text: '#0a66c2', border: '#0A66C2', short: 'LI' },
  tiktok: { bg: '#f4f4f5', text: '#18181b', border: '#111111', short: 'TT' },
};

export function socialImageProviderLabel(source: SocialImageSource): string {
  if (source === 'ai') return 'Nano Banana / marque';
  if (source === 'library') return 'Bibliothèque';
  if (source === 'brand') return 'Fond de marque';
  if (source === 'unsplash') return 'Unsplash';
  return '—';
}

export const SOCIAL_STATUS_LABELS: Record<SocialPostStatus, string> = {
  idea: 'Idée',
  ready: 'Prêt',
  scheduled: 'Programmé',
  published: 'Publié',
  skipped: 'Ignoré',
};

/** Images fiables pour posts (manifest library + alias SEO). */
export const SOCIAL_LIBRARY_IMAGES = [
  '/library/portraits/portrait-01.webp',
  '/library/portraits/portrait-01-4x5.webp',
  '/library/portraits/portrait-02.webp',
  '/library/pilates-mat/pilates-mat-01.webp',
  '/library/pilates-mat/pilates-mat-01-4x5.webp',
  '/library/barre/barre-01.webp',
  '/library/renfo-core/renfo-core-01.webp',
  '/library/coaching-visio/coaching-visio-01.webp',
  '/Photo Alejandra pose pour photographe.JPG',
  '/Photo Alejandra exercice avec anneau.JPG',
  '/Photo Alejandra exercice sur la plage.JPG',
  '/alejandra.jpg',
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

function isSocialLocale(value: unknown): value is SocialLocale {
  return value === 'fr' || value === 'es';
}

function isSocialNetwork(value: unknown): value is SocialNetwork {
  return (
    value === 'instagram' ||
    value === 'whatsapp' ||
    value === 'facebook' ||
    value === 'linkedin' ||
    value === 'tiktok'
  );
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

/** Exclut les chemins déjà utilisés (publiés, programmés, ou dans le board). */
export function pickUnusedLibraryImage(
  usedPaths: Set<string>,
  seed = 0,
): string | null {
  const list = [...SOCIAL_LIBRARY_IMAGES];
  const start = Math.abs(seed) % list.length;
  for (let i = 0; i < list.length; i += 1) {
    const path = list[(start + i) % list.length]!;
    if (!usedPaths.has(path)) return path;
  }
  return null;
}

export function collectUsedLibraryPaths(posts: SocialPost[]): Set<string> {
  const used = new Set<string>();
  for (const post of posts) {
    if (post.status === 'skipped') continue;
    if (post.imagePath && (SOCIAL_LIBRARY_IMAGES as readonly string[]).includes(post.imagePath)) {
      used.add(post.imagePath);
    }
    for (const path of post.carouselPaths ?? []) {
      if ((SOCIAL_LIBRARY_IMAGES as readonly string[]).includes(path)) used.add(path);
    }
  }
  return used;
}

function normalizeVideoStatus(value: unknown): SocialVideoStatus | null {
  if (value === 'brief' || value === 'raw_uploaded' || value === 'editing' || value === 'edited' || value === 'ready') {
    return value;
  }
  return null;
}

function normalizePost(raw: unknown, _index = 0): SocialPost | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.id !== 'string' || !isSocialNetwork(row.network) || !isSocialFormat(row.format) || !isSocialStatus(row.status)) {
    return null;
  }
  const rawImage = typeof row.imagePath === 'string' ? row.imagePath : null;
  const isKnownLibrary = rawImage && (SOCIAL_LIBRARY_IMAGES as readonly string[]).includes(rawImage);
  const isRemoteImage =
    rawImage &&
    (rawImage.startsWith('http') ||
      rawImage.startsWith('/library/social/') ||
      rawImage.includes('/storage/v1/object/public/'));
  const isReel = row.format === 'reel';
  // Jamais de pickLibraryImage silencieux : absence d’image = null + badge « image manquante ».
  const imagePath =
    isKnownLibrary || isRemoteImage
      ? rawImage
      : rawImage && (rawImage.startsWith('/') || rawImage.startsWith('http'))
        ? rawImage
        : null;

  const carouselPaths =
    row.format === 'carousel'
      ? sanitizeCarouselPathsClient(Array.isArray(row.carouselPaths) ? row.carouselPaths.map(String) : [])
      : Array.isArray(row.carouselPaths)
        ? row.carouselPaths.map(String).filter(Boolean)
        : [];
  const carouselMissing =
    row.format === 'carousel' && carouselMissingSlideIndexes(carouselPaths).length > 0;

  let imageSource: SocialImageSource =
    row.imageSource === 'ai' ||
    row.imageSource === 'unsplash' ||
    row.imageSource === 'library' ||
    row.imageSource === 'brand' ||
    row.imageSource === 'none'
      ? row.imageSource === 'brand'
        ? 'ai'
        : row.imageSource
      : !imagePath
        ? 'none'
        : 'library';
  // Legacy pollinations / sources inconnues → none (jamais badge pollinations).
  if (typeof row.imageSource === 'string' && row.imageSource === 'pollinations') {
    imageSource = 'none';
  }

  return {
    id: row.id,
    network: row.network,
    format: row.format,
    locale: isSocialLocale(row.locale) ? row.locale : 'fr',
    title: typeof row.title === 'string' ? row.title : 'Sans titre',
    caption: typeof row.caption === 'string' ? row.caption : '',
    hashtags: Array.isArray(row.hashtags) ? row.hashtags.map(String).filter(Boolean).slice(0, 12) : [],
    cta: typeof row.cta === 'string' ? row.cta : '',
    imageHint: typeof row.imageHint === 'string' ? row.imageHint : '',
    imagePath,
    imageSource,
    aiImagePrompt: typeof row.aiImagePrompt === 'string' ? row.aiImagePrompt : '',
    imageFeedback: typeof row.imageFeedback === 'string' ? row.imageFeedback : '',
    overlayText: typeof row.overlayText === 'string' ? row.overlayText : typeof row.title === 'string' ? row.title : null,
    useOverlay: row.useOverlay === undefined ? false : Boolean(row.useOverlay),
    hookTitle: typeof row.hookTitle === 'string' ? row.hookTitle : '',
    reelScript: typeof row.reelScript === 'string' ? row.reelScript : '',
    shotList: typeof row.shotList === 'string' ? row.shotList : '',
    rawVideoPath: typeof row.rawVideoPath === 'string' ? row.rawVideoPath : null,
    editedVideoPath: typeof row.editedVideoPath === 'string' ? row.editedVideoPath : null,
    videoStatus: normalizeVideoStatus(row.videoStatus) ?? (isReel ? 'brief' : null),
    carouselPaths,
    carouselSlideTitles: Array.isArray(row.carouselSlideTitles)
      ? row.carouselSlideTitles.map((x) => String(x || '').trim()).slice(0, 6)
      : [],
    seriesKind: row.seriesKind === 'conseil_50' ? 'conseil_50' : null,
    seriesNumber: typeof row.seriesNumber === 'number' ? row.seriesNumber : null,
    seriesKeyword: typeof row.seriesKeyword === 'string' ? row.seriesKeyword : null,
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
    titleNeedsReview: Boolean(row.titleNeedsReview),
    overlaysNeedReview: Boolean(row.overlaysNeedReview),
    whyItWorksNeedsReview: Boolean(row.whyItWorksNeedsReview),
    carouselMissingSlides: Boolean(row.carouselMissingSlides) || carouselMissing,
    esStale: Boolean(row.esStale),
    pillarId: typeof row.pillarId === 'string' ? row.pillarId : null,
    contentFamily:
      row.contentFamily === 'portee' || row.contentFamily === 'confiance' || row.contentFamily === 'conversion'
        ? row.contentFamily
        : null,
    manualSentAt: typeof row.manualSentAt === 'string' ? row.manualSentAt : null,
    alsoPublishFacebook:
      row.alsoPublishFacebook === undefined
        ? row.network === 'instagram'
        : Boolean(row.alsoPublishFacebook),
    adaptedFromId: typeof row.adaptedFromId === 'string' ? row.adaptedFromId : null,
    facebookExternalId: typeof row.facebookExternalId === 'string' ? row.facebookExternalId : null,
    generationStatus:
      row.generationStatus === 'pending' ||
      row.generationStatus === 'done' ||
      row.generationStatus === 'failed' ||
      row.generationStatus === 'retrying'
        ? row.generationStatus
        : null,
    generationError: typeof row.generationError === 'string' ? row.generationError : null,
    generationRunId: typeof row.generationRunId === 'string' ? row.generationRunId : null,
    generationSlot: typeof row.generationSlot === 'number' ? row.generationSlot : null,
    generationMediaKind: typeof row.generationMediaKind === 'string' ? row.generationMediaKind : null,
    generationDayOffset: typeof row.generationDayOffset === 'number' ? row.generationDayOffset : null,
    generationSlotIndex: typeof row.generationSlotIndex === 'number' ? row.generationSlotIndex : null,
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : new Date().toISOString(),
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : new Date().toISOString(),
  };
}

/** Remap client-safe des chemins carousel fantômes (pas de fs — usable dans le board React). */
export function remapCarouselPathClient(path: string): string {
  if (/dashboard-desktop(-4x5)?\./i.test(path)) {
    return '/library/produit-captures/produit-dashboard-02-4x5.webp';
  }
  return path;
}

/**
 * Remap client des chemins carousel — NE remplit / NE duplique JAMAIS.
 * Les index manquants restent '' pour que l’UI affiche « slide manquante ».
 */
export function sanitizeCarouselPathsClient(paths: string[] | null | undefined): string[] {
  const source = Array.isArray(paths) ? paths.map((p) => remapCarouselPathClient(String(p || ''))) : [];
  const out: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const raw = (source[i] || '').trim();
    out.push(raw);
  }
  return out;
}

export function carouselMissingSlideIndexes(paths: string[] | null | undefined): number[] {
  const sanitized = sanitizeCarouselPathsClient(paths);
  return sanitized.map((p, i) => (p.trim() ? -1 : i)).filter((i) => i >= 0);
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

export class SocialCommsBoardLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SocialCommsBoardLoadError';
  }
}

/** Charge le board CM. Erreur DB / JSON → throw (jamais un board vide silencieux). Absence de clé = board vide légitime. */
export async function getSocialCommsBoard(): Promise<SocialCommsBoard> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('admin_settings')
      .select('value')
      .eq('key', SOCIAL_COMMS_SETTING_KEY)
      .maybeSingle();
    if (error) {
      console.error('[social-comms] getSocialCommsBoard DB', error.message);
      throw new SocialCommsBoardLoadError(`Board CM indisponible (DB) : ${error.message}`);
    }
    if (!data?.value) return emptySocialCommsBoard();
    try {
      return parseSocialCommsBoard(JSON.parse(String(data.value)));
    } catch (e) {
      console.error('[social-comms] getSocialCommsBoard JSON', e);
      throw new SocialCommsBoardLoadError('Board CM corrompu (JSON invalide).');
    }
  } catch (e) {
    if (e instanceof SocialCommsBoardLoadError) throw e;
    console.error('[social-comms] getSocialCommsBoard', e);
    throw new SocialCommsBoardLoadError(
      e instanceof Error ? e.message : 'Board CM indisponible.',
    );
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

/** Permalink Facebook depuis l’ID stocké (post_id feed ou video_id Reel). */
export function facebookPermalinkUrl(
  externalId: string,
  format: SocialPostFormat = 'feed',
): string {
  const id = externalId.trim();
  if (!id) return '';
  if (format === 'reel') return `https://www.facebook.com/reel/${id}/`;
  if (id.includes('_')) return `https://www.facebook.com/${id}`;
  return `https://www.facebook.com/photo/?fbid=${id}`;
}

/** Jour local YYYY-MM-DD (évite le décalage UTC du calendrier). */
export function localDayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
