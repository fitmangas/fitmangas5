import Link from 'next/link';
import { Award, Play, Route } from 'lucide-react';

import type { ActiveSummary } from '@/lib/programmes/view-models';

type Lang = 'fr' | 'es';

const C = {
  fr: {
    kicker: 'Mon programme',
    week: (w: number, ww: number) => `semaine ${w} sur ${ww}`,
    paused: 'en pause',
    finished: 'toutes les séances sont faites',
    next: 'Prochaine séance :',
    pausedLine: (title: string) => `« ${title} » est en pause.`,
    pausedSub: 'Tes séances reprennent dès que tu relances le programme.',
    doneLine: 'Bravo, tu as fait toutes les séances !',
    doneSub: 'Valide la fin du programme pour recevoir ton certificat.',
    sessions: (d: number, t: number) => `${d} / ${t} séances`,
    start: 'Commencer',
    resume: 'Reprendre',
    resumeProgram: 'Reprendre le programme',
    finish: 'Terminer le programme',
    see: 'Voir le programme',
    emptyTitle: 'Configure ton programme :',
    emptyAccent: 'on s’occupe du reste.',
    emptySub: 'Ton objectif, tes jours, ton heure : tes séances arrivent dans le bon ordre, entre deux lives. 2 minutes.',
    test: 'Faire le test (2 min)',
    configure: 'Configurer mon programme',
    recommended: (title: string) => `Ton test de niveau recommande « ${title} » : 2 minutes de réglages et c’est parti.`,
  },
  es: {
    kicker: 'Mi programa',
    week: (w: number, ww: number) => `semana ${w} de ${ww}`,
    paused: 'en pausa',
    finished: 'todas las sesiones hechas',
    next: 'Próxima sesión:',
    pausedLine: (title: string) => `« ${title} » está en pausa.`,
    pausedSub: 'Tus sesiones vuelven en cuanto reanudes el programa.',
    doneLine: '¡Bravo, hiciste todas las sesiones!',
    doneSub: 'Valida el final del programa para recibir tu certificado.',
    sessions: (d: number, t: number) => `${d} / ${t} sesiones`,
    start: 'Empezar',
    resume: 'Retomar',
    resumeProgram: 'Retomar el programa',
    finish: 'Terminar el programa',
    see: 'Ver el programa',
    emptyTitle: 'Configura tu programa:',
    emptyAccent: 'nosotras nos ocupamos del resto.',
    emptySub: 'Tu objetivo, tus días, tu hora: tus sesiones llegan en el orden correcto, entre dos lives. 2 minutos.',
    test: 'Hacer el test (2 min)',
    configure: 'Configurar mi programa',
    recommended: (title: string) => `Tu test de nivel recomienda « ${title} »: 2 minutos de ajustes y listo.`,
  },
} as const;

const lowerFirst = (s: string) => (s.length > 1 && s[1] === s[1].toLowerCase() ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** B06 — bloc « Mon programme » tout en haut du tableau de bord (compact ; « Configure ton programme » sans programme). */
export function MonProgrammeCard({
  summary,
  lang = 'fr',
  canTest = true,
  recommended = null,
  hideKicker = false,
}: {
  summary: ActiveSummary | null;
  lang?: Lang;
  canTest?: boolean;
  /** Programme recommandé par le test de niveau (cookie), ouvert directement sur la modale de démarrage. */
  recommended?: { slug: string; title: string } | null;
  /** Tableau de bord : le titre « Mon programme sur mesure » est déjà au-dessus de la carte, on ne répète pas « Mon programme ». */
  hideKicker?: boolean;
}) {
  const t = C[lang];
  if (!summary) {
    return (
      <section className="space-y-2.5">
        <article className="glass-card flex flex-wrap items-center justify-between gap-4 p-4 md:p-5">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#fdf2ec] text-[#b0583a]">
              <Route size={24} aria-hidden />
            </span>
            <div className="min-w-0">
              {hideKicker ? null : (
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-orange">{t.kicker}</p>
              )}
              <p className={`${hideKicker ? '' : 'mt-1 '}text-[16px] font-semibold text-luxury-ink`}>
                {t.emptyTitle} <span className="fm-display text-luxury-orange">{t.emptyAccent}</span>
              </p>
              <p className="mt-0.5 text-[13px] text-luxury-muted">{recommended ? t.recommended(recommended.title) : t.emptySub}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canTest && !recommended ? (
              <Link href="/test-niveau" className="btn-luxury-ghost !px-5">
                {t.test}
              </Link>
            ) : null}
            <Link href={recommended ? `/compte/programmes/${recommended.slug}?demarrer=1` : '/compte/programmes'} className="btn-luxury-primary !px-5">
              {t.configure}
            </Link>
          </div>
        </article>
      </section>
    );
  }

  const s = summary;
  const state = s.completable ? 'done' : s.paused ? 'paused' : 'active';
  const stateLabel = state === 'done' ? t.finished : state === 'paused' ? t.paused : t.week(s.weekIndex, s.weeks);
  const kicker = hideKicker ? stateLabel : `${t.kicker} · ${stateLabel}`;
  const primary =
    state === 'done'
      ? { href: s.programHref, label: t.finish, icon: <Award size={13} aria-hidden /> }
      : state === 'paused' || !s.next
        ? { href: s.programHref, label: t.resumeProgram, icon: <Play size={13} strokeWidth={2.4} aria-hidden /> }
        : { href: s.next.href, label: s.next.started ? t.resume : t.start, icon: <Play size={13} strokeWidth={2.4} aria-hidden /> };

  return (
    <section className="space-y-2.5">
      <article className="glass-card flex flex-wrap items-center gap-x-6 gap-y-4 p-4 md:p-5">
        <Link href={s.programHref} className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.next && state === 'active' ? s.next.thumb : s.coverUrl} alt="" className="h-full w-full object-cover object-top" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-orange">{kicker}</p>
          {state === 'active' && s.next ? (
            <p className="mt-1.5 text-[16px] font-semibold leading-snug text-luxury-ink md:text-[17px]">
              {t.next} {lowerFirst(s.next.title)}{' '}
              <span className="font-normal text-luxury-muted">
                {s.next.minutes ? `· ${s.next.minutes} min` : ''}
                {s.next.when ? ` · ${s.next.when}` : ''}
              </span>
            </p>
          ) : state === 'paused' ? (
            <p className="mt-1.5 text-[16px] font-semibold leading-snug text-luxury-ink md:text-[17px]">
              {t.pausedLine(s.title)} <span className="font-normal text-luxury-muted">{t.pausedSub}</span>
            </p>
          ) : (
            <p className="mt-1.5 text-[16px] font-semibold leading-snug text-luxury-ink md:text-[17px]">
              {t.doneLine} <span className="font-normal text-luxury-muted">{t.doneSub}</span>
            </p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="fm-progress min-w-[140px] max-w-[280px] flex-1">
              <span style={{ width: `${s.percent}%` }} />
            </div>
            <span className="text-[12px] font-semibold text-luxury-ink">{t.sessions(s.done, s.total)}</span>
            <span className="text-[12px] text-luxury-muted">{s.title}</span>
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Link href={primary.href} className="btn-luxury-primary !px-5">
            {primary.icon}
            {primary.label}
          </Link>
          {state === 'active' ? (
            <Link href={s.programHref} className="btn-luxury-ghost !px-5">
              {t.see}
            </Link>
          ) : null}
        </div>
      </article>
    </section>
  );
}
