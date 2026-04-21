import Link from 'next/link';

import { StandaloneVimeoPendingActions } from '@/components/Admin/StandaloneVimeoPendingActions';
import { VimeoSyncAllButton } from '@/components/Admin/VimeoSyncAllButton';
import { requireAdmin } from '@/lib/auth/require-admin';
import { sortFolderKeys, VIMEO_FOLDER_UNCATEGORIZED } from '@/lib/vimeo-folder';
import { createAdminClient } from '@/lib/supabase/admin';

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

type Row = {
  id: string;
  vimeo_video_id: string;
  title: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  validation_status: string;
  created_at: string;
  vimeo_folder_name: string | null;
};

function groupByFolder(items: Row[]): Map<string, Row[]> {
  const m = new Map<string, Row[]>();
  for (const item of items) {
    const key = item.vimeo_folder_name?.trim() || VIMEO_FOLDER_UNCATEGORIZED;
    const arr = m.get(key) ?? [];
    arr.push(item);
    m.set(key, arr);
  }
  return m;
}

export default async function AdminVimeoLibraryPage() {
  await requireAdmin();

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from('standalone_vimeo_videos')
    .select(
      'id, vimeo_video_id, title, thumbnail_url, duration_seconds, validation_status, created_at, vimeo_folder_name',
    )
    .order('created_at', { ascending: false });

  const list = (rows ?? []) as Row[];
  const pending = list.filter((r) => r.validation_status === 'pending');
  const published = list.filter((r) => r.validation_status === 'published');
  const rejected = list.filter((r) => r.validation_status === 'rejected');

  const publishedByFolder = groupByFolder(published);
  const publishedFolderKeys = sortFolderKeys([...publishedByFolder.keys()]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-white/25 pb-8">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Vimeo</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-luxury-ink md:text-4xl">Bibliothèque vidéo</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-luxury-muted">
            Les vidéos sont rangées comme tes <strong>dossiers Vimeo</strong>. Le webhook crée des entrées{' '}
            <strong>en attente</strong> ; la synchro importe toute ta bibliothèque existante en{' '}
            <strong>publié</strong>. Abonnés online uniquement côté client.
          </p>
          {error ? (
            <p className="mt-3 text-sm text-red-700">
              Impossible de lire la bibliothèque — vérifie les migrations Supabase <code className="font-mono">010–011</code>.
            </p>
          ) : null}
          <div className="mt-6">
            <VimeoSyncAllButton />
          </div>
        </div>
        <Link href="/admin" className="btn-luxury-ghost shrink-0 px-5 py-2.5 text-[10px] tracking-[0.14em]">
          ← Dashboard
        </Link>
      </div>

      {pending.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-luxury-soft">
            À valider <span className="text-luxury-orange">({pending.length})</span>
          </h2>
          <div className="mt-4 space-y-4">
            {pending.map((v) => (
              <div
                key={v.id}
                className="glass-card flex flex-col gap-4 border-[#ff7a00]/35 bg-white/45 p-5 backdrop-blur-2xl sm:flex-row sm:items-center"
              >
                <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl bg-black/10 sm:h-28 sm:w-44">
                  {v.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URLs Vimeo externes
                    <img src={v.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[11px] text-luxury-soft">Pas d’aperçu</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-luxury-ink">{v.title ?? `Vidéo ${v.vimeo_video_id}`}</p>
                  <p className="mt-1 text-xs text-luxury-muted">
                    <span className="font-medium text-luxury-ink/80">{v.vimeo_folder_name ?? VIMEO_FOLDER_UNCATEGORIZED}</span>
                    {' · '}
                    Vimeo ID {v.vimeo_video_id} · Durée {formatDuration(v.duration_seconds)} · Reçue{' '}
                    {new Date(v.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
                <StandaloneVimeoPendingActions videoId={v.id} />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-10">
          <div className="rounded-2xl border border-dashed border-white/60 bg-white/30 px-4 py-10 text-center text-sm text-luxury-muted backdrop-blur-md">
            Aucune vidéo en attente. Utilise{' '}
            <strong className="text-luxury-ink/90">Synchroniser toute la bibliothèque</strong> ou le webhook{' '}
            <code className="rounded bg-white/50 px-1.5 py-0.5 font-mono text-xs text-luxury-ink">/api/webhooks/vimeo</code>.
          </div>
        </section>
      )}

      <section className="mt-14">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-luxury-soft">
          Publiées <span className="text-luxury-muted">({published.length})</span>
        </h2>
        {published.length === 0 ? (
          <p className="mt-5 text-center text-sm text-luxury-muted">Aucune vidéo publiée pour l’instant.</p>
        ) : (
          <div className="mt-8 space-y-12">
            {publishedFolderKeys.map((folder) => (
              <div key={folder}>
                <h3 className="border-b border-white/25 pb-2 text-sm font-semibold uppercase tracking-[0.12em] text-luxury-ink">
                  {folder}
                  <span className="ml-2 text-xs font-normal normal-case tracking-normal text-luxury-muted">
                    ({publishedByFolder.get(folder)?.length ?? 0})
                  </span>
                </h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {(publishedByFolder.get(folder) ?? []).map((v) => (
                    <article
                      key={v.id}
                      className="glass-card overflow-hidden border-white/80 bg-white/40 backdrop-blur-2xl transition hover:border-white"
                    >
                      <div className="relative aspect-video bg-black/10">
                        {v.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.thumbnail_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[11px] text-luxury-soft">
                            Pas d’aperçu
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="line-clamp-2 text-sm font-semibold text-luxury-ink">
                          {v.title ?? `Vidéo ${v.vimeo_video_id}`}
                        </p>
                        <p className="mt-1 text-[11px] text-luxury-muted">{formatDuration(v.duration_seconds)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {rejected.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-luxury-soft">
            Rejetées <span className="text-luxury-muted">({rejected.length})</span>
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-luxury-muted">
            {rejected.map((v) => (
              <li key={v.id}>
                {v.title ?? v.vimeo_video_id} · ID {v.vimeo_video_id}
                {v.vimeo_folder_name ? ` · ${v.vimeo_folder_name}` : ''}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
