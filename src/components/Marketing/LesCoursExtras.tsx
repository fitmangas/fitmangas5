import Image from 'next/image';
import Link from 'next/link';

import { A_VALIDER_LOT5 } from '@/content/a-valider';

export type WeekLive = {
  id: string;
  title: string;
  startsAt: string;
  language: string | null;
};

function flag(lang: string | null) {
  if (lang === 'es') return '🇪🇸';
  if (lang === 'fr') return '🇫🇷';
  return '';
}

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Paris',
  });
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
}

function groupByDay(lives: WeekLive[]) {
  const map = new Map<string, WeekLive[]>();
  for (const live of lives) {
    const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date(live.startsAt));
    const bucket = map.get(key) ?? [];
    bucket.push(live);
    map.set(key, bucket);
  }
  return [...map.entries()];
}

export function LesCoursExtras({ lives }: { lives: WeekLive[] }) {
  const days = groupByDay(lives);
  const styles = A_VALIDER_LOT5.courseStyles;
  const rundown = A_VALIDER_LOT5.liveRundown;

  return (
    <>
      {days.length > 0 ? (
        <section className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-ink/45">Cette semaine en direct</p>
              <h2 className="mt-2 text-[1.7rem] font-semibold tracking-tight text-brand-ink">Les prochains lives</h2>
            </div>
            <p className="text-[13px] text-brand-ink/55">Heures de Paris · ouverts à toutes les abonnées, sans inscription</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {days.map(([key, items]) => (
              <div key={key} className="rounded-[1.4rem] bg-white p-4 shadow-[0_10px_26px_-16px_rgba(29,26,23,0.2)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-ink/45">{dayLabel(items[0].startsAt)}</p>
                <div className="mt-3 space-y-2">
                  {items.map((live) => (
                    <div key={live.id} className="rounded-xl border-l-[3px] border-l-luxury-orange bg-[#faf7f3] px-3 py-2.5">
                      <p className="flex items-center justify-between text-[14px] font-semibold text-brand-ink">
                        <span className="tabular-nums">{timeLabel(live.startsAt)}</span>
                        <span className="text-[12px]">{flag(live.language)}</span>
                      </p>
                      <p className="text-[13px] font-medium text-brand-ink">{live.title}</p>
                      <p className="text-[11.5px] text-brand-ink/50">Visio</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-14">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-ink/45">Les styles</p>
        <h2 className="mt-2 text-[1.7rem] font-semibold tracking-tight text-brand-ink">Ce qu’on fait pendant les lives</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {styles.map((style) => (
            <article key={style.title} className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_10px_26px_-16px_rgba(29,26,23,0.2)]">
              <div className="relative aspect-[16/9]">
                <Image src={style.image} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-brand-ink">
                  {style.level}
                </span>
              </div>
              <div className="p-5">
                <p className="text-[16px] font-semibold text-brand-ink">{style.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-brand-ink/60">{style.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-6 rounded-[2.2rem] bg-white p-6 shadow-[0_18px_44px_-24px_rgba(29,26,23,0.25)] md:grid-cols-[0.9fr_1.1fr] md:p-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-ink/45">{rundown.kicker}</p>
          <h2 className="mt-2 text-[1.7rem] font-semibold leading-tight tracking-tight text-brand-ink">{rundown.title}</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-brand-ink/60">{rundown.intro}</p>
        </div>
        <ol className="space-y-4">
          {rundown.steps.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-luxury-orange text-[14px] font-semibold text-white">
                {i + 1}
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-brand-ink">{step.title}</span>
                <span className="block text-[13.5px] text-brand-ink/60">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="my-14 rounded-[2.2rem] bg-[#23201d] px-6 py-10 text-center text-white md:py-14">
        <p className="fm-display text-[2rem] !text-white md:text-[2.6rem]">Ta première semaine est offerte.</p>
        <p className="mt-2 text-[14px] text-white/70">0 € aujourd&apos;hui · puis 39 €/mois · sans engagement</p>
        <Link href="/?offer=v-coll" className="btn-luxury-primary mt-6 inline-flex">
          Essai gratuit 7 jours
        </Link>
      </section>
    </>
  );
}
