import { readFile, stat } from 'fs/promises';
import { createAdminClient } from '@/lib/supabase/admin';

const VIMEO_API_BASE = 'https://api.vimeo.com';
const TUS_VERSION = '1.0.0';

type VimeoUploadInitResponse = {
  uri: string;
  upload?: {
    upload_link?: string;
  };
};

type VimeoVideoMetadataResponse = {
  uri: string;
  name: string | null;
  description: string | null;
  link: string | null;
  duration: number | null;
  embed?: {
    html?: string;
  };
  pictures?: {
    sizes?: Array<{
      link?: string;
    }>;
  };
  privacy?: {
    view?: string;
  };
  transcode?: {
    status?: string;
  };
  /** Dossier Vimeo (album / folder selon type de compte). */
  parent_folder?: { name?: string | null } | null;
  folder?: { name?: string | null } | null;
};

export type VimeoVideoMetadata = {
  vimeoId: string;
  vimeoUri: string;
  title: string | null;
  description: string | null;
  link: string | null;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  privacyView: string | null;
  transcodeStatus: string | null;
  isReady: boolean;
  /** Nom dossier Vimeo brut (API) — peut être null si non classé côté Vimeo. */
  folderName: string | null;
};

function requiredEnv(name: 'VIMEO_ACCESS_TOKEN' | 'VIMEO_CLIENT_ID' | 'VIMEO_CLIENT_SECRET'): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} manquant.`);
  return value;
}

function getVimeoHeaders(extra?: HeadersInit): HeadersInit {
  const token = requiredEnv('VIMEO_ACCESS_TOKEN');
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    ...extra,
  };
}

function extractVimeoIdFromUri(uri: string): string {
  const match = uri.match(/\/videos\/(\d+)/);
  if (!match?.[1]) {
    throw new Error(`URI Vimeo invalide: ${uri}`);
  }
  return match[1];
}

function extractEmbedUrl(embedHtml?: string): string | null {
  if (!embedHtml) return null;
  const src = embedHtml.match(/src="([^"]+)"/i)?.[1] ?? null;
  if (!src) return null;
  return src.replace(/&amp;/g, '&');
}

function extractApiFolderName(data: VimeoVideoMetadataResponse): string | null {
  return data.parent_folder?.name?.trim() || data.folder?.name?.trim() || null;
}

/** Champs communs liste / détail vidéo Vimeo. */
const VIDEO_API_FIELDS =
  'uri,name,description,link,duration,embed.html,pictures.sizes.link,privacy.view,transcode.status,parent_folder.name,folder.name';

export function mapVimeoVideoResponseToMetadata(data: VimeoVideoMetadataResponse): VimeoVideoMetadata {
  const thumbnailUrl = data.pictures?.sizes?.at(-1)?.link ?? data.pictures?.sizes?.[0]?.link ?? null;
  const transcodeStatus = data.transcode?.status ?? null;
  const isReady = transcodeStatus === 'complete' || transcodeStatus === null;
  return {
    vimeoId: extractVimeoIdFromUri(data.uri),
    vimeoUri: data.uri,
    title: data.name ?? null,
    description: data.description ?? null,
    link: data.link ?? null,
    embedUrl: extractEmbedUrl(data.embed?.html),
    thumbnailUrl: thumbnailUrl ?? null,
    durationSeconds: data.duration ?? null,
    privacyView: data.privacy?.view ?? null,
    transcodeStatus,
    isReady,
    folderName: extractApiFolderName(data),
  };
}

type VimeoListApiResponse = {
  data?: VimeoVideoMetadataResponse[];
  paging?: { next?: string | null };
};

/**
 * Vérifie que les variables d'app Vimeo sont présentes.
 * Elles ne sont pas utilisées directement avec Personal Access Token,
 * mais requises pour la future extension OAuth/refresh.
 */
export function assertVimeoClientConfig() {
  requiredEnv('VIMEO_CLIENT_ID');
  requiredEnv('VIMEO_CLIENT_SECRET');
  requiredEnv('VIMEO_ACCESS_TOKEN');
}

export type VimeoMeUser = {
  uri: string;
  name: string | null;
  link: string | null;
  account?: string;
};

/**
 * Retourne le profil associé au token (GET /me).
 * Utilisé pour valider VIMEO_ACCESS_TOKEN côté serveur.
 */
export async function getVimeoAccount(): Promise<VimeoMeUser> {
  assertVimeoClientConfig();
  const res = await fetch(`${VIMEO_API_BASE}/me?fields=uri,name,link,location,account`, {
    method: 'GET',
    headers: getVimeoHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Vimeo GET /me failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as VimeoMeUser & { location?: unknown };
  return {
    uri: data.uri,
    name: data.name ?? null,
    link: data.link ?? null,
    account: typeof data.account === 'string' ? data.account : undefined,
  };
}

/**
 * Upload serveur -> Vimeo via approche TUS.
 * NOTE: cette implémentation envoie le fichier en un bloc (readFile).
 */
export async function uploadToVimeo(filePath: string, title: string, description: string): Promise<{
  vimeoId: string;
  vimeoUri: string;
}> {
  assertVimeoClientConfig();

  const fileStats = await stat(filePath);
  if (!fileStats.isFile()) {
    throw new Error(`Fichier introuvable pour upload Vimeo: ${filePath}`);
  }

  const initRes = await fetch(`${VIMEO_API_BASE}/me/videos`, {
    method: 'POST',
    headers: getVimeoHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      upload: {
        approach: 'tus',
        size: String(fileStats.size),
      },
      name: title,
      description,
      privacy: {
        view: 'unlisted',
      },
    }),
  });

  if (!initRes.ok) {
    throw new Error(`Vimeo init upload failed (${initRes.status}): ${await initRes.text()}`);
  }

  const initJson = (await initRes.json()) as VimeoUploadInitResponse;
  const uploadLink = initJson.upload?.upload_link;
  if (!uploadLink) {
    throw new Error('Vimeo upload_link absent.');
  }

  const fileBuffer = await readFile(filePath);
  const uploadRes = await fetch(uploadLink, {
    method: 'PATCH',
    headers: {
      'Tus-Resumable': TUS_VERSION,
      'Upload-Offset': '0',
      'Content-Type': 'application/offset+octet-stream',
    },
    body: fileBuffer,
  });

  if (!(uploadRes.status === 204 || uploadRes.ok)) {
    throw new Error(`Vimeo upload patch failed (${uploadRes.status}): ${await uploadRes.text()}`);
  }

  const vimeoUri = initJson.uri;
  const vimeoId = extractVimeoIdFromUri(vimeoUri);
  return { vimeoId, vimeoUri };
}

export async function getVideoMetadata(vimeoId: string): Promise<VimeoVideoMetadata> {
  assertVimeoClientConfig();
  const safeId = String(vimeoId).trim();
  if (!/^\d+$/.test(safeId)) {
    throw new Error(`Identifiant Vimeo invalide: ${vimeoId}`);
  }

  const res = await fetch(`${VIMEO_API_BASE}/videos/${safeId}?fields=${VIDEO_API_FIELDS}`, {
    method: 'GET',
    headers: getVimeoHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Vimeo metadata failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as VimeoVideoMetadataResponse;
  return mapVimeoVideoResponseToMetadata(data);
}

/**
 * Parcourt /me/videos (pagination `paging.next`) et retourne toutes les vidéos du compte du token.
 */
export async function listAllMeVideos(): Promise<VimeoVideoMetadata[]> {
  assertVimeoClientConfig();
  const out: VimeoVideoMetadata[] = [];
  const fieldsParam = encodeURIComponent(VIDEO_API_FIELDS);
  let nextUrl: string | null = `${VIMEO_API_BASE}/me/videos?fields=${fieldsParam}&per_page=50`;

  let guard = 0;
  while (nextUrl && guard < 200) {
    guard += 1;
    const res = await fetch(nextUrl, { method: 'GET', headers: getVimeoHeaders() });
    if (!res.ok) {
      throw new Error(`Vimeo list /me/videos failed (${res.status}): ${await res.text()}`);
    }
    const json = (await res.json()) as VimeoListApiResponse;
    for (const item of json.data ?? []) {
      try {
        out.push(mapVimeoVideoResponseToMetadata(item));
      } catch {
        /* uri invalide — ignoré */
      }
    }
    nextUrl = json.paging?.next?.trim() || null;
  }

  return out;
}

/**
 * Synchronise la table video_recordings depuis l'état Vimeo.
 */
export async function syncVideoRecording(params: {
  courseId: string;
  vimeoId: string;
  createdBy?: string | null;
}): Promise<VimeoVideoMetadata> {
  const metadata = await getVideoMetadata(params.vimeoId);
  const admin = createAdminClient();

  const payload = {
    course_id: params.courseId,
    vimeo_video_id: metadata.vimeoId,
    vimeo_uri: metadata.vimeoUri,
    title: metadata.title,
    description: metadata.description,
    embed_url: metadata.embedUrl ?? metadata.link,
    thumbnail_url: metadata.thumbnailUrl,
    duration_seconds: metadata.durationSeconds,
    privacy_view: metadata.privacyView ?? 'unlisted',
    upload_status: metadata.isReady ? 'ready' : 'transcoding',
    is_ready: metadata.isReady,
    available_at: metadata.isReady ? new Date().toISOString() : null,
    metadata: {
      link: metadata.link,
      transcode_status: metadata.transcodeStatus,
    },
    created_by: params.createdBy ?? null,
  };

  const { error } = await admin
    .from('video_recordings')
    .upsert(payload, { onConflict: 'vimeo_video_id' });

  if (error) {
    throw new Error(`Sync video_recordings failed: ${error.message}`);
  }

  return metadata;
}
