import Link from 'next/link';

import { requireAdmin } from '@/lib/auth/require-admin';

export default async function AdminVimeoLibraryPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-white/25 pb-8">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Vimeo</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-luxury-ink md:text-4xl">Bibliothèque vidéo</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-luxury-muted">
            Espace réservé à la gestion des replays et uploads Vimeo. La grille ci-dessous accueillera bientôt tes vidéos,
            métadonnées et statuts de publication.
          </p>
        </div>
        <Link
          href="/admin"
          className="btn-luxury-ghost shrink-0 px-5 py-2.5 text-[10px] tracking-[0.14em]"
        >
          ← Dashboard
        </Link>
      </div>

      <section className="mt-10">
        <div className="glass-card border-white/80 bg-white/40 p-6 backdrop-blur-2xl md:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">Contenu</p>
          <p className="mt-2 text-sm text-luxury-muted">Aucune vidéo pour le moment — connecte l’API ou importe depuis l’admin.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`placeholder-${i}`}
                className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-white/50 bg-white/25 text-[11px] font-medium text-luxury-soft backdrop-blur-md"
              >
                Emplacement {i + 1}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
