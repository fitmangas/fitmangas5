import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeDurationSeconds } from '@/lib/vimeo';

const VIMEO_API_BASE = 'https://api.vimeo.com';

/**
 * confirmed = Vimeo a répondu et is_playable / status est fiable
 * unknown = pas de token / erreur réseau / 4xx-5xx hors 404 → JAMAIS isPlayable:true
 * unavailable = confirmé non lisible (404, transcode KO, etc.)
 */
export type VimeoPlaybackConfidence = 'confirmed' | 'unknown' | 'unavailable';

export type VimeoPlaybackProbe = {
  vimeoId: string;
  /** true UNIQUEMENT si Vimeo confirme explicitement la lecture. */
  isPlayable: boolean;
  durationSeconds: number | null;
  title: string | null;
  status: string | null;
  confidence: VimeoPlaybackConfidence;
};

function getToken(): string | null {
  return process.env.VIMEO_ACCESS_TOKEN?.trim() || null;
}

function probeResult(
  partial: Omit<VimeoPlaybackProbe, 'confidence' | 'isPlayable'> & {
    isPlayable: boolean;
    confidence: VimeoPlaybackConfidence;
  },
): VimeoPlaybackProbe {
  // Garde-fou absolu : unknown / unavailable ne peuvent jamais être playable.
  if (partial.confidence !== 'confirmed' && partial.isPlayable) {
    console.error('[vimeo-playback] refus isPlayable:true hors confirmation', partial);
    return { ...partial, isPlayable: false };
  }
  return partial;
}

/**
 * Sonde légère : une vidéo est-elle réellement lisible côté Vimeo ?
 * En cas d’erreur / absence de token → isPlayable:false + confidence:unknown (jamais true).
 */
export async function probeVimeoPlayback(vimeoId: string): Promise<VimeoPlaybackProbe> {
  const safeId = String(vimeoId).trim();
  if (!/^\d+$/.test(safeId)) {
    return probeResult({
      vimeoId: safeId,
      isPlayable: false,
      durationSeconds: null,
      title: null,
      status: 'invalid',
      confidence: 'unavailable',
    });
  }

  const token = getToken();
  if (!token) {
    // Point 1 — sans token : ne PAS prétendre que c’est lisible.
    console.error('[vimeo-playback] VIMEO_ACCESS_TOKEN absent — isPlayable=false (unknown)', safeId);
    return probeResult({
      vimeoId: safeId,
      isPlayable: false,
      durationSeconds: null,
      title: null,
      status: 'no_token',
      confidence: 'unknown',
    });
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
      console.error('[vimeo-playback] vidéo introuvable (404)', safeId);
      return probeResult({
        vimeoId: safeId,
        isPlayable: false,
        durationSeconds: null,
        title: null,
        status: 'not_found',
        confidence: 'unavailable',
      });
    }
    if (!res.ok) {
      // Point 2 — erreur HTTP : jamais isPlayable:true
      console.error('[vimeo-playback] probe HTTP failed', safeId, res.status, await res.text().catch(() => ''));
      return probeResult({
        vimeoId: safeId,
        isPlayable: false,
        durationSeconds: null,
        title: null,
        status: `http_${res.status}`,
        confidence: 'unknown',
      });
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

    return probeResult({
      vimeoId: safeId,
      isPlayable: available,
      durationSeconds,
      title: data.name ?? null,
      status,
      confidence: available ? 'confirmed' : 'unavailable',
    });
  } catch (e) {
    // Point 3 — exception réseau : jamais isPlayable:true
    console.error('[vimeo-playback] probe network/exception', safeId, e);
    return probeResult({
      vimeoId: safeId,
      isPlayable: false,
      durationSeconds: null,
      title: null,
      status: 'network_error',
      confidence: 'unknown',
    });
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
