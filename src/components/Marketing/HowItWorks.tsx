import Image from 'next/image';

const STEPS_FR = [
  { n: 1, title: 'Tu choisis ton live', body: 'Pilates, Barre, Stretch… 2 lives par semaine en français, à heure fixe. Pas d’inscription : tu viens quand tu veux.', img: '/landing/comment-1-live.jpg' },
  { n: 2, title: 'Tu allumes ta caméra', body: 'Depuis ton ordinateur ou ton téléphone, écran à 2–3 m. Ton micro est coupé en entrant.', img: '/landing/comment-2-camera.jpg' },
  { n: 3, title: 'Alejandra te corrige', body: 'Elle te voit, t’appelle par ton prénom et ajuste ta posture en direct. Raté ? Le replay est là.', img: '/landing/comment-3-correction.jpg' },
] as const;

const STEPS_ES = [
  { n: 1, title: 'Eliges tu clase en vivo', body: 'Pilates, Barre, Stretch… 2 lives por semana en español, a hora fija. Sin reserva: llegas cuando quieres.', img: '/landing/comment-1-live.jpg' },
  { n: 2, title: 'Enciendes tu cámara', body: 'Desde tu ordenador o teléfono, pantalla a 2–3 m. El micro entra silenciado.', img: '/landing/comment-2-camera.jpg' },
  { n: 3, title: 'Alejandra te corrige', body: 'Te ve, te llama por tu nombre y ajusta tu postura en directo. ¿Te la perdiste? El replay está ahí.', img: '/landing/comment-3-correction.jpg' },
] as const;

export function HowItWorks({ lang }: { lang: 'FR' | 'ES' }) {
  const steps = lang === 'ES' ? STEPS_ES : STEPS_FR;
  return (
    <section className="relative pb-16 md:pb-24">
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-ink/45">
        {lang === 'ES' ? 'Cómo funciona' : 'Comment ça marche'}
      </p>
      <h2 className="fm-display mt-3 text-center text-[1.9rem] leading-tight text-brand-ink md:text-[2.6rem]">
        {lang === 'ES' ? 'Una clase de verdad, desde tu salón' : 'Un vrai cours, depuis ton salon'}
      </h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <article key={s.n} className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_14px_36px_-18px_rgba(29,26,23,0.25)]">
            <div className="relative aspect-[16/10]">
              <Image src={s.img} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
              <span className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[15px] font-semibold text-brand-ink shadow">
                {s.n}
              </span>
            </div>
            <div className="p-5">
              <p className="text-[16px] font-semibold text-brand-ink">{s.title}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-brand-ink/60">{s.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
