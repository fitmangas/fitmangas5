import fs from 'node:fs';
import { stat } from 'node:fs/promises';

const VIMEO_API_BASE = 'https://api.vimeo.com';
const TUS_VERSION = '1.0.0';
const DEFAULT_CHUNK_SIZE = 64 * 1024 * 1024;

export const REPLAY_VIMEO_PRIVACY = {
  view: 'unlisted' as const,
  embed: 'public' as const,
  download: true,
  add: true,
  comments: 'anybody' as const,
};

function getToken(): string {
  const t = process.env.VIMEO_ACCESS_TOKEN?.trim();
  if (!t) throw new Error('VIMEO_ACCESS_TOKEN manquant');
  return t;
}

function headers(extra?: Record<string, string>) {
  return {
    Authorization: `Bearer ${getToken()}`,
    Accept: 'application/vnd.vimeo.*+json;version=3.4',
    ...extra,
  };
}

function extractId(uri: string): string {
  const m = uri.match(/\/videos\/(\d+)/);
  if (!m?.[1]) throw new Error(`URI Vimeo invalide: ${uri}`);
  return m[1];
}

/** Upload TUS par chunks — adapté aux MP4 cours (~1–3 Go) sans OOM. */
export async function uploadMp4ToVimeoChunked(
  filePath: string,
  name: string,
  description: string,
  opts?: { chunkSize?: number; onProgress?: (pct: number) => void },
): Promise<{ vimeoId: string; vimeoUri: string }> {
  const chunkSize = opts?.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const fileStats = await stat(filePath);
  const totalSize = fileStats.size;
  if (!fileStats.isFile() || totalSize <= 0) {
    throw new Error(`Fichier MP4 invalide: ${filePath}`);
  }

  const initRes = await fetch(`${VIMEO_API_BASE}/me/videos`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      upload: { approach: 'tus', size: String(totalSize) },
      name,
      description,
      privacy: REPLAY_VIMEO_PRIVACY,
    }),
  });
  if (!initRes.ok) {
    throw new Error(`Init upload Vimeo ${initRes.status}: ${await initRes.text()}`);
  }

  const initJson = (await initRes.json()) as { uri: string; upload?: { upload_link?: string } };
  const uploadLink = initJson.upload?.upload_link;
  if (!uploadLink) throw new Error('upload_link absent');

  let offset = 0;
  const fd = fs.openSync(filePath, 'r');
  try {
    while (offset < totalSize) {
      const len = Math.min(chunkSize, totalSize - offset);
      const buffer = Buffer.alloc(len);
      fs.readSync(fd, buffer, 0, len, offset);

      let patchRes: Response | null = null;
      let lastErr: unknown = null;
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        try {
          patchRes = await fetch(uploadLink, {
            method: 'PATCH',
            headers: {
              'Tus-Resumable': TUS_VERSION,
              'Upload-Offset': String(offset),
              'Content-Type': 'application/offset+octet-stream',
            },
            body: buffer,
          });
          break;
        } catch (e) {
          lastErr = e;
          await new Promise((r) => setTimeout(r, attempt * 3000));
        }
      }
      if (!patchRes) {
        throw new Error(`PATCH échec offset ${offset}: ${lastErr instanceof Error ? lastErr.message : lastErr}`);
      }
      if (!(patchRes.status === 204 || patchRes.ok)) {
        throw new Error(`PATCH ${patchRes.status} offset ${offset}: ${await patchRes.text()}`);
      }

      const newOffset = patchRes.headers.get('Upload-Offset');
      offset = newOffset ? parseInt(newOffset, 10) : offset + len;
      opts?.onProgress?.(Math.round((offset / totalSize) * 100));
    }
  } finally {
    fs.closeSync(fd);
  }

  if (offset !== totalSize) {
    throw new Error(`Upload incomplet (${offset}/${totalSize})`);
  }

  return { vimeoId: extractId(initJson.uri), vimeoUri: initJson.uri };
}

export async function applyVimeoPrivacy(vimeoId: string): Promise<void> {
  const res = await fetch(`${VIMEO_API_BASE}/videos/${vimeoId}`, {
    method: 'PATCH',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ privacy: REPLAY_VIMEO_PRIVACY }),
  });
  if (!res.ok) console.warn(`[vimeo-tus] privacy ${vimeoId}: ${res.status}`);
}
