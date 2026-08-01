/**
 * Client PhotoLabs / PHOTA — entraînement profil visage + génération Nano Banana 2.
 * Indépendant de Dupliq.me (API développeur directe).
 * Docs: https://docs.photalabs.com/
 */

export const PHOTA_API_BASE = 'https://api.photalabs.com/v1/phota';

export type PhotaTrainingTier = 'standard' | 'fast';
export type PhotaProfileStatus =
  | 'VALIDATING'
  | 'QUEUING'
  | 'IN_PROGRESS'
  | 'READY'
  | 'ERROR'
  | 'INACTIVE'
  | 'UNKNOWN';

export function resolvePhotaApiKey(): string | null {
  return (
    process.env.PHOTALABS_API_KEY?.trim() ||
    process.env.PHOTA_API_KEY?.trim() ||
    process.env.PHOTOLABS_API_KEY?.trim() ||
    null
  );
}

async function photaFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const apiKey = resolvePhotaApiKey();
  if (!apiKey) {
    return {
      ok: false,
      status: 0,
      error: 'Clé PHOTALABS_API_KEY manquante (portal PhotoLabs / PHOTA).',
    };
  }

  try {
    const res = await fetch(`${PHOTA_API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        ...(init?.headers || {}),
      },
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    if (!res.ok) {
      const detail =
        json && typeof json === 'object' && 'detail' in json
          ? String((json as { detail: unknown }).detail)
          : text.slice(0, 240) || `HTTP ${res.status}`;
      return { ok: false, status: res.status, error: detail };
    }
    return { ok: true, data: json as T };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : 'Erreur réseau PHOTA.' };
  }
}

export async function photaAddProfile(input: {
  imageUrls: string[];
  trainingTier?: PhotaTrainingTier;
  tag?: string;
}): Promise<{ ok: true; profileId: string } | { ok: false; error: string }> {
  const tier = input.trainingTier ?? 'standard';
  const min = tier === 'fast' ? 5 : 10;
  const max = tier === 'fast' ? 10 : 50;
  if (input.imageUrls.length < min) {
    return { ok: false, error: `PHOTA ${tier} : minimum ${min} photos (tu en as ${input.imageUrls.length}).` };
  }
  const image_urls = input.imageUrls.slice(0, max);
  const result = await photaFetch<{ profile_id: string }>('/profiles/add', {
    method: 'POST',
    body: JSON.stringify({
      image_urls,
      training_tier: tier,
      tag: input.tag || 'fitmangas_alejandra',
    }),
  });
  if (!result.ok) return { ok: false, error: result.error };
  if (!result.data?.profile_id) return { ok: false, error: 'Réponse PHOTA sans profile_id.' };
  return { ok: true, profileId: result.data.profile_id };
}

export async function photaGetProfileStatus(
  profileId: string,
): Promise<{ ok: true; status: PhotaProfileStatus; message: string } | { ok: false; error: string }> {
  const result = await photaFetch<{ profile_id?: string; status?: string; message?: string }>(
    `/profiles/${encodeURIComponent(profileId)}/status`,
  );
  if (!result.ok) return { ok: false, error: result.error };
  const status = (result.data.status || 'UNKNOWN') as PhotaProfileStatus;
  return {
    ok: true,
    status,
    message: result.data.message || '',
  };
}

export async function photaGenerateImage(input: {
  profileId: string;
  prompt: string;
  aspectRatio?: '3:4' | '9:16' | '1:1' | '4:3' | '16:9' | 'auto';
  resolution?: '1K' | '2K' | '4K';
}): Promise<{ ok: true; buffer: Buffer } | { ok: false; error: string }> {
  // [[profile_id]] = syntaxe identité PHOTA (génération from scratch)
  const prompt = input.prompt.includes(`[[${input.profileId}]]`)
    ? input.prompt
    : `Photorealistic editorial photo of [[${input.profileId}]] (Alejandra, FitMangas Pilates coach). ${input.prompt}`;

  const result = await photaFetch<{ images?: string[]; download_urls?: string[] }>('/generate', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      num_output_images: 1,
      aspect_ratio: input.aspectRatio ?? '3:4',
      resolution: input.resolution ?? '1K',
      base_model: 'nb2',
      output_format: 'jpg',
      response_mode: 'bytes',
    }),
  });
  if (!result.ok) return { ok: false, error: result.error };
  const b64 = result.data.images?.[0];
  if (!b64) return { ok: false, error: 'PHOTA n’a renvoyé aucune image.' };
  return { ok: true, buffer: Buffer.from(b64, 'base64') };
}
