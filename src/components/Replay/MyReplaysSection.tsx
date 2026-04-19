import { ReplayLibraryCard } from '@/components/Replay/ReplayLibraryCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { getReplayLibraryForUser, type ReplayLibraryItem } from '@/lib/replay-library';

export async function MyReplaysSection({ userId }: { userId: string }) {
  let items: ReplayLibraryItem[] = [];
  try {
    items = await getReplayLibraryForUser(userId);
  } catch {
    items = [];
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

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/45 bg-white/25 px-6 py-16 text-center backdrop-blur-md">
          <p className="text-xl font-semibold tracking-tight text-luxury-ink/70">Aucun replay pour l’instant</p>
          <p className="mt-3 text-sm leading-relaxed text-luxury-muted">
            Dès qu’une vidéo est publiée pour une séance terminée, elle apparaît ici.
          </p>
        </div>
      ) : (
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:gap-10">
          {items.map((item) => (
            <li key={item.recordingId}>
              <ReplayLibraryCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
