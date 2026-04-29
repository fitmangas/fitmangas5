import { ReplayLibraryCard } from '@/components/Replay/ReplayLibraryCard';
import { StandaloneVimeoGrid } from '@/components/Replay/StandaloneVimeoGrid';
import { GlassCard } from '@/components/ui/GlassCard';
import { getReplayLibraryForUser, type ReplayLibraryItem } from '@/lib/replay-library';
import { getStandaloneVimeoLibraryForUser } from '@/lib/standalone-vimeo-library';

export async function MyReplaysSection({ userId, lang = 'fr' }: { userId: string; lang?: 'fr' | 'en' | 'es' }) {
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

  const t =
    lang === 'en'
      ? {
          library: 'Library',
          title: 'My replays',
          subtitle: 'A selection of your recorded sessions, with a streaming-catalog spirit designed for wellbeing.',
          emptyTitle: 'No content for now',
          emptyText: 'Session replays and subscription videos will appear here when available.',
        }
      : lang === 'es'
        ? {
            library: 'Biblioteca',
            title: 'Mis replays',
            subtitle: 'Una selección de tus sesiones grabadas, con estilo catálogo streaming pensado para el bienestar.',
            emptyTitle: 'Sin contenido por ahora',
            emptyText: 'Los replays de sesión y los videos de suscripción aparecerán aquí cuando estén disponibles.',
          }
        : {
            library: 'Bibliothèque',
            title: 'Mes replays',
            subtitle: 'Une sélection de tes séances enregistrées — même esprit qu’un catalogue streaming, pensé pour le bien-être.',
            emptyTitle: 'Aucun contenu pour l’instant',
            emptyText: 'Les replays de séance et les vidéos abonnement apparaîtront ici lorsqu’ils seront disponibles.',
          };

  return (
    <GlassCard className="p-8 md:p-10">
      <div className="mb-10 flex flex-col gap-3 border-b border-white/35 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-luxury-soft">{t.library}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-luxury-ink md:text-[2rem]">{t.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-luxury-muted">
            {t.subtitle}
          </p>
        </div>
      </div>

      {standalone.length > 0 ? <StandaloneVimeoGrid videos={standalone} lang={lang} /> : null}

      {items.length === 0 && standalone.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/45 bg-white/25 px-6 py-16 text-center backdrop-blur-md">
          <p className="text-xl font-semibold tracking-tight text-luxury-ink/70">{t.emptyTitle}</p>
          <p className="mt-3 text-sm leading-relaxed text-luxury-muted">
            {t.emptyText}
          </p>
        </div>
      ) : items.length > 0 ? (
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:gap-10">
          {items.map((item) => (
            <li key={item.recordingId}>
              <ReplayLibraryCard item={item} lang={lang} />
            </li>
          ))}
        </ul>
      ) : null}
    </GlassCard>
  );
}
