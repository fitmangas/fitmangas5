import Link from 'next/link';
import Image from 'next/image';
import type { SeoPillarPage } from '@/lib/seo-pillar-pages';

type Props = {
  page: SeoPillarPage;
  relatedPages: SeoPillarPage[];
};

export function SeoPillarPageShell({ page, relatedPages }: Props) {
  const heroImage =
    page.slug === 'pilates-debutant-maison'
      ? '/Photo Alejandra exercice avec anneau.PNG'
      : page.slug === 'cours-pilates-visio'
        ? '/Photo Alejandra pose pour photographe.JPG'
        : '/Photo Alejandra exercice sur la plage.JPG';
  const appPreviewImage =
    page.slug === 'cours-pilates-visio'
      ? '/espace cliente replays.png'
      : page.slug === 'pilates-debutant-maison'
        ? '/Espace client sur Mobile Dashboard.jpg'
        : '/espace cliente dashboard.png';

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="mb-8 flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-luxury-muted">
        <Link href="/" className="hover:text-luxury-ink">
          Accueil
        </Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-luxury-ink">
          Blog Pilates
        </Link>
        <span>/</span>
        <span className="text-luxury-ink">{page.shortTitle}</span>
      </nav>

      <header className="overflow-hidden rounded-[2.2rem] border border-white/60 bg-white/70 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-10">
          <div>
            <Image src="/logo.png" alt="FitMangas" width={74} height={74} className="mb-5 h-16 w-16 object-contain" priority />
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">
              Guide Pilates FitMangas
            </p>
            <h1 className="hero-signature-title mt-4 max-w-4xl text-4xl text-luxury-ink md:text-6xl">{page.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-luxury-muted">{page.intro}</p>
            <div className="mt-7 flex max-w-xl flex-col gap-3 xl:flex-row">
              <Link href="/?offer=v-coll" className="btn-luxury-primary justify-center whitespace-nowrap px-6 py-3 text-center text-[10px] tracking-[0.12em] sm:text-[11px]">
                Découvrir l’offre visio à 39 €/mois
              </Link>
              <Link href="/blog" className="btn-luxury-ghost justify-center whitespace-nowrap px-6 py-3 text-center text-[10px] tracking-[0.12em] sm:text-[11px]">
                Lire le blog Pilates
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-brand-beige shadow-[0_22px_48px_rgba(48,35,28,0.18)]">
              <Image
                src={heroImage}
                alt="Alejandra, coach FitMangas"
                width={720}
                height={900}
                className="aspect-[4/5] h-full w-full object-cover object-top"
                priority
              />
            </div>
            <div className="absolute -bottom-4 left-4 right-4 rounded-[1.35rem] border border-white/70 bg-white/90 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.12)]">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#C45D3E]">Inclus avec FitMangas</p>
              <p className="mt-1 text-sm font-semibold text-luxury-ink">Lives, replays, blog et espace cliente</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.75rem] border border-white/60 bg-white/55 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Pour qui ?</p>
          <p className="mt-3 text-sm leading-7 text-luxury-muted">{page.audience}</p>
        </div>
        <div className="rounded-[1.75rem] border border-white/60 bg-white/55 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Objectif</p>
          <p className="mt-3 text-sm leading-7 text-luxury-muted">{page.promise}</p>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-[#C45D3E]/20 bg-[#fffaf5]/90 p-6 shadow-[0_18px_42px_rgba(120,80,20,0.08)] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">Après le guide</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-luxury-ink">
              L’étape suivante : pratiquer avec Alejandra
            </h2>
            <p className="mt-3 text-sm leading-7 text-luxury-muted">
              Ces pages servent à te donner les bases, mais le vrai progrès vient de la pratique régulière :
              cours en visio, replays, planning et suivi dans l’espace cliente.
            </p>
            <Link href="/?offer=v-coll" className="btn-luxury-primary mt-5 inline-flex px-7 py-3 text-[11px] tracking-[0.14em]">
              Voir l’offre visio
            </Link>
          </div>
          <div className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/70 p-2 shadow-[0_18px_42px_rgba(15,23,42,0.14)]">
            <div className="relative overflow-hidden rounded-[1.35rem] bg-brand-beige">
              <Image
                src={appPreviewImage}
                alt="Aperçu de l'espace cliente FitMangas"
                width={1200}
                height={760}
                className="h-full max-h-[360px] w-full object-cover object-top"
              />
              <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#C45D3E]">Aperçu espace cliente</p>
                <p className="mt-1 text-sm font-semibold text-luxury-ink">Planning, replays, blog et progression</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-3">
        {page.sections.map((section) => (
          <article key={section.title} className="rounded-[1.85rem] border border-white/60 bg-white/60 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
            <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-luxury-muted">{section.body}</p>
            <ul className="mt-5 space-y-2 text-sm leading-6 text-luxury-muted">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span className="text-[#C45D3E]">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="mt-12 rounded-[2rem] border border-[#C45D3E]/20 bg-[#fffaf5]/90 p-6 shadow-[0_18px_42px_rgba(120,80,20,0.08)] md:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">Maillage interne</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-luxury-ink">Guides liés pour progresser</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {relatedPages.map((related) => (
            <Link
              key={related.slug}
              href={`/${related.slug}`}
              className="rounded-[1.4rem] border border-white/70 bg-white/70 p-5 transition hover:border-[#C45D3E]/30 hover:bg-white"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C45D3E]">
                Guide pilier
              </p>
              <h3 className="mt-2 text-base font-semibold leading-snug text-luxury-ink">{related.shortTitle}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-luxury-muted">{related.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-[2rem] border border-white/60 bg-white/60 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)] md:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">FAQ</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-luxury-ink">Questions fréquentes</h2>
        <div className="mt-5 divide-y divide-white/70">
          {page.faqs.map((faq) => (
            <details key={faq.question} className="group py-4">
              <summary className="cursor-pointer list-none text-base font-semibold text-luxury-ink">
                {faq.question}
              </summary>
              <p className="mt-3 text-sm leading-7 text-luxury-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
