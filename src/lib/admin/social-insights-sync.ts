/**
 * Sync IG Insights → admin_settings snapshot (et table post_metrics si migration appliquée).
 * Désactivé par défaut : SOCIAL_INSIGHTS_SYNC_ENABLED=true pour activer.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import { getMetaSocialConnection, getSocialCommsBoard } from '@/lib/admin/social-comms';

const GRAPH = 'https://graph.facebook.com/v21.0';

export type PostMetricsSnapshot = {
  postId: string;
  igMediaId: string | null;
  facebookId: string | null;
  permalink: string | null;
  publishedAt: string | null;
  reach: number | null;
  saved: number | null;
  shares: number | null;
  views: number | null;
  avgWatchTime: number | null;
  fetchedAt: string;
  locale: string | null;
  format: string | null;
  pillarId: string | null;
  hook: string | null;
  imageSource: string | null;
};

export function isSocialInsightsSyncEnabled(): boolean {
  const v = process.env.SOCIAL_INSIGHTS_SYNC_ENABLED?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

async function fetchIgInsights(
  mediaId: string,
  token: string,
): Promise<{ reach: number | null; saved: number | null; views: number | null; shares: number | null }> {
  const metrics = ['reach', 'saved', 'views', 'shares'].join(',');
  const url = `${GRAPH}/${mediaId}/insights?metric=${metrics}&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  const data = (await res.json()) as {
    data?: Array<{ name?: string; values?: Array<{ value?: number }> }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `Insights HTTP ${res.status}`);
  }
  const map = new Map<string, number>();
  for (const row of data.data ?? []) {
    if (row.name && row.values?.[0]?.value != null) map.set(row.name, Number(row.values[0].value));
  }
  return {
    reach: map.get('reach') ?? null,
    saved: map.get('saved') ?? null,
    views: map.get('views') ?? null,
    shares: map.get('shares') ?? null,
  };
}

export async function syncSocialPostInsights(): Promise<{
  ok: boolean;
  synced: number;
  skipped: number;
  error?: string;
  snapshots: PostMetricsSnapshot[];
}> {
  if (!isSocialInsightsSyncEnabled()) {
    return {
      ok: false,
      synced: 0,
      skipped: 0,
      error: 'SOCIAL_INSIGHTS_SYNC_ENABLED=false — sync Insights désactivée (attendre token Meta valide).',
      snapshots: [],
    };
  }

  const meta = await getMetaSocialConnection();
  if (!meta.accessToken || !meta.igUserId) {
    return { ok: false, synced: 0, skipped: 0, error: 'Meta non connecté (token / IG User ID).', snapshots: [] };
  }

  const board = await getSocialCommsBoard();
  const published = board.posts.filter((p) => p.status === 'published' && (p.metaExternalId || p.facebookExternalId));
  const snapshots: PostMetricsSnapshot[] = [];
  let synced = 0;
  let skipped = 0;

  for (const post of published) {
    const mediaId = post.metaExternalId;
    if (!mediaId) {
      skipped += 1;
      continue;
    }
    try {
      const insights = await fetchIgInsights(mediaId, meta.accessToken);
      snapshots.push({
        postId: post.id,
        igMediaId: mediaId,
        facebookId: post.facebookExternalId,
        permalink: null,
        publishedAt: post.plannedAt,
        reach: insights.reach,
        saved: insights.saved,
        shares: insights.shares,
        views: insights.views,
        avgWatchTime: null,
        fetchedAt: new Date().toISOString(),
        locale: post.locale,
        format: post.format,
        pillarId: post.pillarId ?? null,
        hook: post.hookTitle || post.title,
        imageSource: post.imageSource,
      });
      synced += 1;
    } catch (e) {
      console.warn('[insights]', post.id, e);
      skipped += 1;
    }
  }

  // Snapshot JSON dans admin_settings (sans migration)
  const admin = createAdminClient();
  await admin.from('admin_settings').upsert(
    {
      key: 'social_post_metrics_snapshot',
      value: JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), items: snapshots }),
    },
    { onConflict: 'key' },
  );

  // Si table post_metrics existe (migration appliquée), tenter insert
  try {
    if (snapshots.length) {
      await admin.from('post_metrics').upsert(
        snapshots.map((s) => ({
          post_id: s.postId,
          ig_media_id: s.igMediaId,
          permalink: s.permalink,
          published_at: s.publishedAt,
          reach: s.reach,
          saved: s.saved,
          shares: s.shares,
          views: s.views,
          avg_watch_time: s.avgWatchTime,
          fetched_at: s.fetchedAt,
          locale: s.locale,
          format: s.format,
          pilier: s.pillarId,
          hook: s.hook,
          image_source: s.imageSource,
        })),
        { onConflict: 'post_id,fetched_at' },
      );
    }
  } catch {
    // table absente = OK (proposition de migration non appliquée)
  }

  return { ok: true, synced, skipped, snapshots };
}

export function averagesByPillarAndFormat(snapshots: PostMetricsSnapshot[]) {
  const groups = new Map<string, { n: number; reach: number; saved: number; views: number }>();
  for (const s of snapshots) {
    const key = `${s.pillarId || '—'}|${s.format || '—'}`;
    const g = groups.get(key) ?? { n: 0, reach: 0, saved: 0, views: 0 };
    g.n += 1;
    g.reach += s.reach ?? 0;
    g.saved += s.saved ?? 0;
    g.views += s.views ?? 0;
    groups.set(key, g);
  }
  return [...groups.entries()].map(([key, g]) => {
    const [pillarId, format] = key.split('|');
    return {
      pillarId,
      format,
      count: g.n,
      avgReach: g.n ? g.reach / g.n : 0,
      avgSaved: g.n ? g.saved / g.n : 0,
      avgViews: g.n ? g.views / g.n : 0,
    };
  });
}
