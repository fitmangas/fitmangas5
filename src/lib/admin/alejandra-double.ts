import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { createAdminClient } from '@/lib/supabase/admin';
import {
  photaAddProfile,
  photaGenerateImage,
  photaGetProfileStatus,
  resolvePhotaApiKey,
  type PhotaProfileStatus,
  type PhotaTrainingTier,
} from '@/lib/admin/phota-client';
import { SOCIAL_LIBRARY_IMAGES } from '@/lib/admin/social-comms';

/** Profil « Double Alejandra » — PHOTA (entraînement) + fallback refs Gemini. */
export const ALEJANDRA_DOUBLE_SETTING_KEY = 'alejandra_double_profile';

/** Nano Banana 2 (Flash Image) : jusqu’à 4 images personnage pour la cohérence visage (fallback). */
export const ALEJANDRA_DOUBLE_MAX_REFS_PER_REQUEST = 4;

/** Pack max = plafond PHOTA Full Train. */
export const ALEJANDRA_DOUBLE_MAX_PACK = 50;

/** Pack par défaut : toute la biblio Alejandra (idéal pour Full Train ≥10). */
export const ALEJANDRA_DOUBLE_DEFAULT_REFS = [...SOCIAL_LIBRARY_IMAGES];

export type AlejandraDoubleEngine = 'phota' | 'gemini_refs';

export type AlejandraDoubleProfile = {
  enabled: boolean;
  /** Chemins publics (bibliothèque) pour entraînement PHOTA / fallback refs. */
  referencePaths: string[];
  /** Moteur prioritaire quand PHOTA est READY. */
  engine: AlejandraDoubleEngine;
  photaProfileId: string | null;
  photaStatus: PhotaProfileStatus | null;
  photaTrainingTier: PhotaTrainingTier;
  photaMessage: string | null;
  photaTrainedAt: string | null;
  updatedAt: string | null;
};

export type GeminiInlineImagePart = {
  inlineData: { mimeType: string; data: string };
};

export function emptyAlejandraDouble(): AlejandraDoubleProfile {
  return {
    enabled: true,
    referencePaths: [...ALEJANDRA_DOUBLE_DEFAULT_REFS],
    engine: 'phota',
    photaProfileId: null,
    photaStatus: null,
    photaTrainingTier: 'standard',
    photaMessage: null,
    photaTrainedAt: null,
    updatedAt: null,
  };
}

export function parseAlejandraDouble(raw: unknown): AlejandraDoubleProfile {
  const defaults = emptyAlejandraDouble();
  if (!raw || typeof raw !== 'object') return defaults;
  const row = raw as Record<string, unknown>;
  const paths = Array.isArray(row.referencePaths)
    ? row.referencePaths
        .map(String)
        .filter((p) => (SOCIAL_LIBRARY_IMAGES as readonly string[]).includes(p))
        .slice(0, ALEJANDRA_DOUBLE_MAX_PACK)
    : [...ALEJANDRA_DOUBLE_DEFAULT_REFS];
  const engine: AlejandraDoubleEngine = row.engine === 'gemini_refs' ? 'gemini_refs' : 'phota';
  const tier: PhotaTrainingTier = row.photaTrainingTier === 'fast' ? 'fast' : 'standard';
  return {
    enabled: row.enabled !== false,
    referencePaths: paths.length ? paths : [...ALEJANDRA_DOUBLE_DEFAULT_REFS],
    engine,
    photaProfileId: typeof row.photaProfileId === 'string' && row.photaProfileId ? row.photaProfileId : null,
    photaStatus:
      typeof row.photaStatus === 'string' && row.photaStatus
        ? (row.photaStatus as PhotaProfileStatus)
        : null,
    photaTrainingTier: tier,
    photaMessage: typeof row.photaMessage === 'string' ? row.photaMessage : null,
    photaTrainedAt: typeof row.photaTrainedAt === 'string' ? row.photaTrainedAt : null,
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : null,
  };
}

export async function getAlejandraDoubleProfile(): Promise<AlejandraDoubleProfile> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('admin_settings')
      .select('value')
      .eq('key', ALEJANDRA_DOUBLE_SETTING_KEY)
      .maybeSingle();
    if (error || !data?.value) return emptyAlejandraDouble();
    try {
      return parseAlejandraDouble(JSON.parse(String(data.value)));
    } catch {
      return emptyAlejandraDouble();
    }
  } catch {
    return emptyAlejandraDouble();
  }
}

export async function saveAlejandraDoubleProfile(profile: AlejandraDoubleProfile): Promise<void> {
  const admin = createAdminClient();
  const payload: AlejandraDoubleProfile = {
    ...profile,
    referencePaths: profile.referencePaths
      .filter((p) => (SOCIAL_LIBRARY_IMAGES as readonly string[]).includes(p))
      .slice(0, ALEJANDRA_DOUBLE_MAX_PACK),
    updatedAt: new Date().toISOString(),
  };
  if (!payload.referencePaths.length) {
    payload.referencePaths = [...ALEJANDRA_DOUBLE_DEFAULT_REFS];
  }
  const { error } = await admin.from('admin_settings').upsert(
    {
      key: ALEJANDRA_DOUBLE_SETTING_KEY,
      value: JSON.stringify(payload),
    },
    { onConflict: 'key' },
  );
  if (error) throw new Error(error.message);
}

function mimeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

export async function loadPublicImageBuffer(publicPath: string): Promise<{ buffer: Buffer; mime: string } | null> {
  const clean = publicPath.replace(/^\/+/, '');
  const abs = path.join(process.cwd(), 'public', clean);
  try {
    const buffer = await fs.readFile(abs);
    if (buffer.length < 500 || buffer.length > 12_000_000) return null;
    return { buffer, mime: mimeFromPath(clean) };
  } catch (e) {
    console.warn('[alejandra-double] lecture image', publicPath, e);
    return null;
  }
}

/** Lit une image public/ en base64 (serveur only) — fallback Gemini refs. */
export async function loadPublicImageAsInlinePart(publicPath: string): Promise<GeminiInlineImagePart | null> {
  const loaded = await loadPublicImageBuffer(publicPath);
  if (!loaded) return null;
  return {
    inlineData: {
      mimeType: loaded.mime,
      data: loaded.buffer.toString('base64'),
    },
  };
}

export function pickDoubleRefsForRequest(paths: string[], variationSeed = 0): string[] {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return [...ALEJANDRA_DOUBLE_DEFAULT_REFS].slice(0, ALEJANDRA_DOUBLE_MAX_REFS_PER_REQUEST);
  if (unique.length <= ALEJANDRA_DOUBLE_MAX_REFS_PER_REQUEST) return unique;
  const start = Math.abs(variationSeed) % unique.length;
  const picked: string[] = [];
  for (let i = 0; i < unique.length && picked.length < ALEJANDRA_DOUBLE_MAX_REFS_PER_REQUEST; i += 1) {
    picked.push(unique[(start + i) % unique.length]!);
  }
  return picked;
}

export async function loadAlejandraDoubleInlineParts(
  profile: AlejandraDoubleProfile,
  variationSeed = 0,
): Promise<GeminiInlineImagePart[]> {
  if (!profile.enabled || !profile.referencePaths.length) return [];
  const selected = pickDoubleRefsForRequest(profile.referencePaths, variationSeed);
  const parts: GeminiInlineImagePart[] = [];
  for (const ref of selected) {
    const part = await loadPublicImageAsInlinePart(ref);
    if (part) parts.push(part);
  }
  return parts;
}

export function alejandraDoubleIdentityPrompt(refCount: number): string {
  if (refCount <= 0) return '';
  return `IDENTITY LOCK — Alejandra (FitMangas coach): the ${refCount} attached photo(s) show the SAME real woman. The generated image MUST depict this exact person (same face, bone structure, eyes, nose, mouth, hair color/texture, age ~30s, skin tone). Do not invent a different model. Use the references ONLY for identity/likeness; create a NEW scene, pose and framing matching the brief below. Photorealistic, natural skin texture, no beauty-filter plastic look.`;
}

/** Flag OFF par défaut — panneau Double/PHOTA masqué tant que non activé. */
export function isAlejandraDoubleEnabled(): boolean {
  const v = process.env.ALEJANDRA_DOUBLE_ENABLED?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

export function isPhotaDoubleReady(profile: AlejandraDoubleProfile): boolean {
  return Boolean(
    profile.enabled &&
      profile.engine === 'phota' &&
      profile.photaProfileId &&
      profile.photaStatus === 'READY',
  );
}

/** Upload le pack vers Storage public pour que PHOTA puisse télécharger les URLs. */
export async function uploadAlejandraTrainImageUrls(paths: string[]): Promise<string[]> {
  const admin = createAdminClient();
  const urls: string[] = [];
  for (const publicPath of paths.slice(0, ALEJANDRA_DOUBLE_MAX_PACK)) {
    const loaded = await loadPublicImageBuffer(publicPath);
    if (!loaded) continue;
    const hash = createHash('sha1').update(loaded.buffer).digest('hex').slice(0, 16);
    const ext = loaded.mime === 'image/png' ? 'png' : loaded.mime === 'image/webp' ? 'webp' : 'jpg';
    const storagePath = `alejandra-double/train/${hash}.${ext}`;
    const { error } = await admin.storage.from('avatars').upload(storagePath, loaded.buffer, {
      contentType: loaded.mime,
      upsert: true,
    });
    if (error) {
      console.warn('[alejandra-double] upload train', publicPath, error.message);
      continue;
    }
    const { data } = admin.storage.from('avatars').getPublicUrl(storagePath);
    if (data.publicUrl) urls.push(data.publicUrl);
  }
  return urls;
}

export async function startAlejandraPhotaTraining(
  profile: AlejandraDoubleProfile,
  tier: PhotaTrainingTier = 'standard',
): Promise<{ ok: true; profile: AlejandraDoubleProfile; message: string } | { ok: false; error: string }> {
  if (!resolvePhotaApiKey()) {
    return {
      ok: false,
      error: 'Ajoute PHOTALABS_API_KEY (clé API PhotoLabs / PHOTA — pas Dupliq).',
    };
  }
  const min = tier === 'fast' ? 5 : 10;
  if (profile.referencePaths.length < min) {
    return {
      ok: false,
      error: `Sélectionne au moins ${min} photos pour l’entraînement ${tier === 'fast' ? 'Quick' : 'Full'}.`,
    };
  }

  const imageUrls = await uploadAlejandraTrainImageUrls(profile.referencePaths);
  if (imageUrls.length < min) {
    return {
      ok: false,
      error: `Seulement ${imageUrls.length} URLs uploadées (min ${min}). Vérifie les fichiers bibliothèque.`,
    };
  }

  const created = await photaAddProfile({
    imageUrls,
    trainingTier: tier,
    tag: 'fitmangas_alejandra',
  });
  if (!created.ok) return created;

  const next: AlejandraDoubleProfile = {
    ...profile,
    enabled: true,
    engine: 'phota',
    photaProfileId: created.profileId,
    photaStatus: 'QUEUING',
    photaTrainingTier: tier,
    photaMessage: `Entraînement lancé (${imageUrls.length} photos, tier ${tier}).`,
    photaTrainedAt: null,
    updatedAt: new Date().toISOString(),
  };
  await saveAlejandraDoubleProfile(next);
  return {
    ok: true,
    profile: next,
    message: `Entraînement PHOTA démarré (${imageUrls.length} photos, ~${tier === 'fast' ? '3' : '8'} min). profile_id=${created.profileId}`,
  };
}

export async function refreshAlejandraPhotaStatus(
  profile: AlejandraDoubleProfile,
): Promise<{ ok: true; profile: AlejandraDoubleProfile; message: string } | { ok: false; error: string }> {
  if (!profile.photaProfileId) {
    return { ok: false, error: 'Aucun profil PHOTA — lance d’abord l’entraînement.' };
  }
  const status = await photaGetProfileStatus(profile.photaProfileId);
  if (!status.ok) return status;

  const next: AlejandraDoubleProfile = {
    ...profile,
    photaStatus: status.status,
    photaMessage: status.message || profile.photaMessage,
    photaTrainedAt: status.status === 'READY' ? profile.photaTrainedAt || new Date().toISOString() : profile.photaTrainedAt,
    updatedAt: new Date().toISOString(),
  };
  if (status.status === 'READY') {
    next.engine = 'phota';
    next.enabled = true;
  }
  await saveAlejandraDoubleProfile(next);

  const label =
    status.status === 'READY'
      ? 'Double PHOTA prêt — Nano Banana 2 utilise le profil entraîné.'
      : status.status === 'ERROR'
        ? `Erreur PHOTA : ${status.message || 'training failed'}`
        : `Statut PHOTA : ${status.status}${status.message ? ` — ${status.message}` : ''}`;

  return { ok: true, profile: next, message: label };
}

export async function generateWithAlejandraPhota(
  profile: AlejandraDoubleProfile,
  scenePrompt: string,
): Promise<{ ok: true; buffer: Buffer } | { ok: false; error: string }> {
  if (!isPhotaDoubleReady(profile) || !profile.photaProfileId) {
    return { ok: false, error: 'Profil PHOTA pas READY.' };
  }
  return photaGenerateImage({
    profileId: profile.photaProfileId,
    prompt: scenePrompt,
    aspectRatio: '3:4',
    resolution: '1K',
  });
}
