import { A_VALIDER_LOT5 } from '@/content/a-valider';

export function LandingFaq({ lang }: { lang: 'FR' | 'ES' }) {
  const items = lang === 'ES' ? A_VALIDER_LOT5.faq.es : A_VALIDER_LOT5.faq.fr;
  return (
    <section className="relative pb-16 md:pb-24">
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-ink/45">
        {lang === 'ES' ? 'Preguntas frecuentes' : 'Questions fréquentes'}
      </p>
      <h2 className="fm-display mt-3 text-center text-[1.9rem] leading-tight text-brand-ink md:text-[2.6rem]">
        {lang === 'ES' ? 'Antes de empezar' : 'Avant de te lancer'}
      </h2>
      <div className="mx-auto mt-8 max-w-3xl divide-y divide-brand-ink/[0.07] overflow-hidden rounded-[1.6rem] bg-white shadow-[0_14px_36px_-20px_rgba(29,26,23,0.2)]">
        {items.map((item, i) => (
          <details key={item.q} className="px-6 py-4" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-brand-ink [&::-webkit-details-marker]:hidden">
              {item.q}
            </summary>
            <p className="mt-2 text-[14px] leading-relaxed text-brand-ink/60">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
