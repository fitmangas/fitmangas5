import { ReplayLibraryCard } from '@/components/Replay/ReplayLibraryCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { sortFolderKeys, VIMEO_FOLDER_UNCATEGORIZED } from '@/lib/vimeo-folder';
import { getReplayLibraryForUser, type ReplayLibraryItem } from '@/lib/replay-library';
import { getStandaloneVimeoLibraryForUser } from '@/lib/standalone-vimeo-library';

function formatStandaloneDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export async function MyReplaysSection({ userId }: { userId: string }) {
  let items: ReplayLibraryItem[] = [];
  let standalone: Awaited<ReturnType<typeof getStandaloneVimeoLibraryForUser>> = [];
  try {
    items = await getReplayLibraryForUser(userId);
  } catch {
    items = [];
  }
  try {
    standalone = await getStandaloneVimeoLibraryForUser();
  } catch {
    standalone = [];
  }

  return (
    <GlassCard className="p-8 md:p-10">
      <div className="mb-10 flex flex-col gap-3 border-b border-white/35 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-luxury-soft">Bibliothèque</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-luxury-ink md:text-[2rem]">Mes replays</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-luxury-muted">
            Une sélection de tes séances enregistrées — même esprit qu’un catalogue streaming, pensé pour le bien-être.
          </p>
        </div>
      </div>

      {standalone.length > 0 ? (
        <div className="mb-12 space-y-10">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Abonnement online</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-luxury-ink">Vidéos exclusives</h3>
          </div>
          {(() => {
            const byFolder = new Map<string, typeof standalone>();
            for (const v of standalone) {
              const key = v.folderName?.trim() || VIMEO_FOLDER_UNCATEGORIZED;
              const arr = byFolder.get(key) ?? [];
              arr.push(v);
              byFolder.set(key, arr);
            }
            const keys = sortFolderKeys([...byFolder.keys()]);
            return keys.map((folder) => (
              <div key={folder}>
                <h4 className="border-b border-white/30 pb-2 text-sm font-semibold uppercase tracking-[0.12em] text-luxury-ink">
                  {folder}
                </h4>
                <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {(byFolder.get(folder) ?? []).map((v) => {
                    const href = v.embedUrl ?? `https://vimeo.com/${v.vimeoVideoId}`;
                    return (
                      <li key={v.id}>
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block overflow-hidden rounded-2xl border border-white/50 bg-white/35 shadow-sm backdrop-blur-md transition hover:border-[#ff7a00]/40 hover:shadow-md"
                        >
                          <div className="relative aspect-video bg-black/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {v.thumbnailUrl ? (
                              <img
                                src={v.thumbnailUrl}
                                alt=""
                                className="h-full w-full object-cover transition group-hover:opacity-95"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-luxury-soft">Vimeo</div>
                            )}
                          </div>
                          <div className="p-4">
                            <p className="line-clamp-2 font-semibold text-luxury-ink">
                              {v.title ?? `Vidéo ${v.vimeoVideoId}`}
                            </p>
                            {v.durationSeconds != null ? (
                              <p className="mt-1 text-xs tabular-nums text-luxury-muted">
                                {formatStandaloneDuration(v.durationSeconds)}
                              </p>
                            ) : null}
                          </div>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ));
          })()}
        </div>
      ) : null}

      {items.length === 0 && standalone.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/45 bg-white/25 px-6 py-16 text-center backdrop-blur-md">
          <p className="text-xl font-semibold tracking-tight text-luxury-ink/70">Aucun contenu pour l’instant</p>
          <p className="mt-3 text-sm leading-relaxed text-luxury-muted">
            Les replays de séance et les vidéos abonnement apparaîtront ici lorsqu’ils seront disponibles.
          </p>
        </div>
      ) : items.length > 0 ? (
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:gap-10">
          {items.map((item) => (
            <li key={item.recordingId}>
              <ReplayLibraryCard item={item} />
            </li>
          ))}
        </ul>
      ) : null}
    </GlassCard>
  );
}
