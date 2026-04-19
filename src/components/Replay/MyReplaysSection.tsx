import { ReplayLibraryCard } from '@/components/Replay/ReplayLibraryCard';
import { getReplayLibraryForUser, type ReplayLibraryItem } from '@/lib/replay-library';

export async function MyReplaysSection({ userId }: { userId: string }) {
  let items: ReplayLibraryItem[] = [];
  try {
    items = await getReplayLibraryForUser(userId);
  } catch {
    items = [];
  }

  return (
    <section className="rounded-[32px] border border-brand-ink/[0.04] bg-gradient-to-b from-[#faf8f5] via-white to-[#f7f5f2] p-8 shadow-[0_16px_56px_rgba(0,0,0,0.06)] md:p-10">
      <div className="mb-10 flex flex-col gap-3 border-b border-brand-ink/[0.06] pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.38em] text-brand-accent">Bibliothèque</p>
          <h2 className="mt-2 font-serif text-3xl italic tracking-tight text-brand-ink md:text-[2.1rem]">Mes replays</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-ink/50">
            Une sélection de tes séances enregistrées — même esprit qu’un catalogue streaming, pensé pour le bien-être.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-ink/[0.1] bg-white/60 px-6 py-16 text-center backdrop-blur-sm">
          <p className="font-serif text-xl italic text-brand-ink/45">Aucun replay pour l’instant</p>
          <p className="mt-3 text-sm leading-relaxed text-brand-ink/42">
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
    </section>
  );
}
