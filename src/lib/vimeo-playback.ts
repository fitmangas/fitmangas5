import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeDurationSeconds } from '@/lib/vimeo';

const VIMEO_API_BASE = 'https://api.vimeo.com';

export type VimeoPlaybackProbe = {
  vimeoId: string;
  isPlayable: boolean;
  durationSeconds: number | null;
  title: string | null;
  status: string | null;
};

function getToken(): string | null {
  return process.env.VIMEO_ACCESS_TOKEN?.trim() || null;
}

/**
 * Sonde légère : une vidéo est-elle réellement lisible côté Vimeo ?
 * (évite d’afficher « cette vidéo n’existe pas » / upload bloqué)
 */
export async function probeVimeoPlayback(vimeoId: string): Promise<VimeoPlaybackProbe> {
  const safeId = String(vimeoId).trim();
  if (!/^\d+$/.test(safeId)) {
    return { vimeoId: safeId, isPlayable: false, durationSeconds: null, title: null, status: 'invalid' };
  }

  const token = getToken();
  if (!token) {
    // Sans token : on ne bloque pas la lecture (comportement permissif).
    return { vimeoId: safeId, isPlayable: true, durationSeconds: null, title: null, status: null };
  }

  try {
    const res = await fetch(
      `${VIMEO_API_BASE}/videos/${safeId}?fields=name,duration,status,is_playable,transcode.status`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        next: { revalidate: 300 },
      } as RequestInit & { next?: { revalidate: number } },
    );

    if (res.status === 404) {
      return { vimeoId: safeId, isPlayable: false, durationSeconds: null, title: null, status: 'not_found' };
    }
    if (!res.ok) {
      // Erreur API ponctuelle : ne pas blacklister la vidéo côté cliente.
      console.error('[vimeo-playback] probe failed', safeId, res.status);
      return { vimeoId: safeId, isPlayable: true, durationSeconds: null, title: null, status: 'error' };
    }

    const data = (await res.json()) as {
      name?: string | null;
      duration?: number | null;
      status?: string | null;
      is_playable?: boolean | null;
      transcode?: { status?: string | null } | null;
    };

    const status = data.status ?? null;
    const transcode = data.transcode?.status ?? null;
    const durationSeconds = normalizeDurationSeconds(data.duration);
    const explicitlyPlayable = data.is_playable === true;
    const available =
      explicitlyPlayable ||
      (status === 'available' && (transcode === 'complete' || transcode == null) && (durationSeconds ?? 0) > 0);

    return {
      vimeoId: safeId,
      isPlayable: available,
      durationSeconds,
      title: data.name ?? null,
      status,
    };
  } catch (e) {
    console.error('[vimeo-playback] probe error', safeId, e);
    return { vimeoId: safeId, isPlayable: true, durationSeconds: null, title: null, status: 'error' };
  }
}

export async function probeVimeoPlaybackMany(
  ids: string[],
  concurrency = 4,
): Promise<Map<string, VimeoPlaybackProbe>> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  const out = new Map<string, VimeoPlaybackProbe>();
  let i = 0;
  async function worker() {
    while (i < unique.length) {
      const idx = i;
      i += 1;
      const id = unique[idx]!;
      out.set(id, await probeVimeoPlayback(id));
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, unique.length) }, () => worker()));
  return out;
}

/** Persiste duration_seconds quand l’API renvoie une durée réelle (sans migration). */
export async function persistRecordingDurations(
  updates: Array<{ recordingId: string; durationSeconds: number }>,
): Promise<void> {
  if (updates.length === 0) return;
  try {
    const admin = createAdminClient();
    await Promise.all(
      updates.map((u) =>
        admin
          .from('video_recordings')
          .update({ duration_seconds: u.durationSeconds, upload_status: 'ready' })
          .eq('id', u.recordingId),
      ),
    );
  } catch (e) {
    console.error('[vimeo-playback] persist durations', e);
  }
}

export async function persistStandaloneDurations(
  updates: Array<{ videoId: string; durationSeconds: number }>,
): Promise<void> {
  if (updates.length === 0) return;
  try {
    const admin = createAdminClient();
    await Promise.all(
      updates.map((u) =>
        admin.from('standalone_vimeo_videos').update({ duration_seconds: u.durationSeconds }).eq('id', u.videoId),
      ),
    );
  } catch (e) {
    console.error('[vimeo-playback] persist standalone durations', e);
  }
}
