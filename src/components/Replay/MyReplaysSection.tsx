import Link from 'next/link';
import { ReplayLibraryCard } from '@/components/Replay/ReplayLibraryCard';
import { StandaloneVimeoFlatCards } from '@/components/Replay/StandaloneVimeoFlatCards';
import { GlassCard } from '@/components/ui/GlassCard';
import { getReplayLibraryForUser, type ReplayLibraryItem } from '@/lib/replay-library';
import { getStandaloneVimeoLibraryForUser } from '@/lib/standalone-vimeo-library';

type Props = {
  userId: string;
  lang?: 'fr' | 'en' | 'es';
  limitReplays?: number;
  limitLibrary?: number;
  showSeeAll?: boolean;
};

export async function MyReplaysSection({
  userId,
  lang = 'fr',
  limitReplays = 3,
  limitLibrary = 3,
  showSeeAll = false,
}: Props) {
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

  const replayItems = items.slice(0, limitReplays);
  const libraryItems = standalone.slice(0, limitLibrary);

  const t =
    lang === 'en'
      ? {
          eyebrow: 'My replays & my library',
          title: 'Your on-demand content',
          emptyTitle: 'No content for now',
          emptyText: 'Session replays and subscription videos will appear here when available.',
          seeAll: 'See all',
          replays: 'My replays',
          onDemand: 'My library',
        }
      : lang === 'es'
        ? {
            eyebrow: 'Mis replays y mi biblioteca',
            title: 'Tus contenidos a la carta',
            emptyTitle: 'Sin contenido por ahora',
            emptyText: 'Los replays de sesión y los videos de suscripción aparecerán aquí cuando estén disponibles.',
            seeAll: 'Ver todo',
            replays: 'Mis replays',
            onDemand: 'Mi biblioteca',
          }
        : {
            eyebrow: 'Mes replays & ma bibliothèque',
            title: 'Tes contenus à la demande',
            emptyTitle: 'Aucun contenu pour l’instant',
            emptyText: 'Les replays de séance et les vidéos abonnement apparaîtront ici lorsqu’ils seront disponibles.',
            seeAll: 'Voir tout',
            replays: 'Mes replays',
            onDemand: 'Ma bibliothèque',
          };

  const subsectionTitleClass =
    'text-lg font-semibold tracking-tight text-luxury-ink md:text-xl';
  const seeAllClass =
    'shrink-0 rounded-full border border-[#C45D3E]/35 bg-[#C45D3E]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#C45D3E] transition hover:bg-[#C45D3E]/15';

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="relative z-10 px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">{t.eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-luxury-ink md:mt-2 md:text-[1.7rem]">{t.title}</h2>
      </div>

      <GlassCard className="p-4 md:p-10">
        {libraryItems.length === 0 && replayItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/45 bg-white/25 px-4 py-8 text-center backdrop-blur-md md:px-6 md:py-16">
            <p className="text-lg font-semibold tracking-tight text-luxury-ink/70 md:text-xl">{t.emptyTitle}</p>
            <p className="mt-3 text-sm leading-relaxed text-luxury-muted">{t.emptyText}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {replayItems.length > 0 ? (
              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className={subsectionTitleClass}>{t.replays}</h3>
                  {showSeeAll ? (
                    <Link href="/compte/replays" className={seeAllClass}>
                      {t.seeAll} →
                    </Link>
                  ) : null}
                </div>
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
                  {replayItems.map((item) => (
                    <li key={item.recordingId}>
                      <ReplayLibraryCard item={item} lang={lang} from="/compte" />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {libraryItems.length > 0 ? (
              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className={subsectionTitleClass}>{t.onDemand}</h3>
                  {showSeeAll ? (
                    <Link href="/compte/replays?section=library" className={seeAllClass}>
                      {t.seeAll} →
                    </Link>
                  ) : null}
                </div>
                <StandaloneVimeoFlatCards videos={libraryItems} lang={lang} />
              </div>
            ) : null}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
