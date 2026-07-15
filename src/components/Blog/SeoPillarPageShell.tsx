import Link from 'next/link';
import type { SeoPillarPage } from '@/lib/seo-pillar-pages';

type Props = {
  page: SeoPillarPage;
  relatedPages: SeoPillarPage[];
};

export function SeoPillarPageShell({ page, relatedPages }: Props) {
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

      <header className="rounded-[2.2rem] border border-white/60 bg-white/65 p-6 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">
          Guide Pilates FitMangas
        </p>
        <h1 className="hero-signature-title mt-4 max-w-4xl text-4xl text-luxury-ink md:text-6xl">{page.title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-luxury-muted">{page.intro}</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href="/#offers" className="btn-luxury-primary px-7 py-3 text-[11px] tracking-[0.14em]">
            Découvrir les cours
          </Link>
          <Link href="/blog" className="btn-luxury-ghost px-7 py-3 text-[11px] tracking-[0.14em]">
            Lire le blog Pilates
          </Link>
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
