import Link from 'next/link';
import { Play } from 'lucide-react';

export function MonProgrammeCard({
  state,
  title,
  nextSession,
  minutes,
  progressLabel,
  percent,
  href,
}: {
  state: 'active' | 'empty';
  title?: string;
  nextSession?: string;
  minutes?: number;
  progressLabel?: string;
  percent?: number;
  href: string;
}) {
  if (state === 'empty') {
    return (
      <section className="space-y-2.5">
        <article className="glass-card flex flex-wrap items-center gap-x-6 gap-y-4 p-4 md:p-5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-orange">Mon programme</p>
            <p className="mt-1 text-[16px] font-semibold text-luxury-ink">
              Configure ton programme : <span className="fm-display text-luxury-orange">on s&apos;occupe du reste.</span>
            </p>
            <p className="mt-0.5 text-[13px] text-luxury-muted">Ton objectif, tes jours, ton heure : tes séances arrivent dans le bon ordre, entre deux lives. 2 minutes.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/test-niveau" className="btn-luxury-ghost !px-5">
              Faire le test (2 min)
            </Link>
            <Link href={href} className="btn-luxury-primary !px-5">
              Configurer mon programme
            </Link>
          </div>
        </article>
      </section>
    );
  }
  return (
    <section className="space-y-2.5">
      <article className="glass-card flex flex-wrap items-center gap-x-6 gap-y-4 p-4 md:p-5">
        <span className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/programmes/alejandra-tapis.jpg" alt="" className="h-full w-full object-cover object-top" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-orange">Mon programme · {progressLabel}</p>
          <p className="mt-1.5 text-[16px] font-semibold leading-snug text-luxury-ink md:text-[17px]">
            Prochaine séance : {nextSession} <span className="font-normal text-luxury-muted">· {minutes} min</span>
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="fm-progress min-w-[140px] max-w-[280px] flex-1">
              <span style={{ width: `${percent ?? 0}%` }} />
            </div>
            <span className="text-[12px] text-luxury-muted">{title}</span>
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Link href={href} className="btn-luxury-primary !px-5">
            <Play size={13} /> Commencer
          </Link>
          <Link href={href} className="btn-luxury-ghost !px-5">
            Voir le programme
          </Link>
        </div>
      </article>
    </section>
  );
}
