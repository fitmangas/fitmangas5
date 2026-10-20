'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Check, ChevronLeft, Lightbulb, Music2 } from 'lucide-react';

import { A_VALIDER_LOT5 } from '@/content/a-valider';

/**
 * Habillage de la page du live (maquette D03) — ESTHÉTIQUE SEULEMENT.
 * `children` = la salle existante (LiveVisitRecorder + JitsiRoomLoader), rendue une seule fois,
 * toujours au même endroit de l'arbre : le compte à rebours ne la démonte jamais.
 * Heures et compte à rebours calculés dans le navigateur après le montage (pas d'écart serveur / navigateur).
 */

type Lang = 'fr' | 'es';

type Props = {
  title: string;
  languageLabel: string | null;
  startsAt: string | null;
  endsAt: string | null;
  backHref: string;
  backLabel: string;
  spotifyUrl: string | null;
  /** Langue de l'habillage ; par défaut celle du live (« en español » → espagnol). */
  lang?: Lang;
  children: ReactNode;
};

const COPY = {
  fr: {
    live: 'Live',
    today: 'aujourd’hui',
    with: 'avec Alejandra',
    before: 'avant le début',
    min: 'min',
    sec: 's',
    statusLive: 'En direct',
    statusDone: 'Terminé',
    statusBefore: 'Avant le cours',
    room: 'Tu es déjà dans la salle du live : ta caméra s’affiche dans le cadre, c’est ton test. Ton micro est coupé à l’entrée ; active-le pour parler à Alejandra. Pendant le cours, passe en « Plein écran ».',
    advice: 'Le conseil d’Alejandra',
    checklist: 'Avant de commencer',
    checks: ['Ton tapis est déroulé', 'Une bouteille d’eau à portée de main', 'Ta caméra te voit en entier, de face', 'Une serviette ou un coussin'],
    playlist: 'Playlist de la séance :',
    locale: 'fr-FR',
  },
  es: {
    live: 'Live',
    today: 'hoy',
    with: 'con Alejandra',
    before: 'para empezar',
    min: 'min',
    sec: 's',
    statusLive: 'En vivo',
    statusDone: 'Terminada',
    statusBefore: 'Antes de la clase',
    room: 'Ya estás en la sala del live: tu cámara aparece en el recuadro, es tu prueba. Tu micrófono entra silenciado; actívalo para hablar con Alejandra. Durante la clase, pasa a « Pantalla completa ».',
    advice: 'El consejo de Alejandra',
    checklist: 'Antes de empezar',
    checks: ['Tu tapete está listo', 'Una botella de agua a mano', 'Tu cámara te ve de cuerpo entero, de frente', 'Una toalla o un cojín'],
    playlist: 'Playlist de la clase:',
    locale: 'es-MX',
  },
} as const;

/** Conservé pour compatibilité (export du lot 5). */
export const CHECKS_ES = COPY.es.checks;

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, '0');
}

function sameLocalDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function LiveHabillage({ title, languageLabel, startsAt, endsAt, backHref, backLabel, spotifyUrl, lang, children }: Props) {
  const l: Lang = lang ?? (languageLabel === 'en español' ? 'es' : 'fr');
  const t = COPY[l];
  // null tant que le composant n'est pas monté : le serveur et le navigateur rendent la même chose.
  const [now, setNow] = useState<number | null>(null);
  const [checks, setChecks] = useState([false, false, false, false]);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startMs = startsAt ? new Date(startsAt).getTime() : null;
  const endMs = endsAt ? new Date(endsAt).getTime() : null;
  const status =
    now == null || startMs == null ? null : now < startMs ? 'before' : endMs != null && now > endMs ? 'done' : 'live';

  const remain = now != null && startMs != null ? Math.max(0, startMs - now) : 0;
  const hours = Math.floor(remain / 3_600_000);
  const mins = Math.floor((remain % 3_600_000) / 60_000);
  const secs = Math.floor((remain % 60_000) / 1000);

  let whenLabel: string | null = null;
  if (now != null && startMs != null && endMs != null) {
    const fmt = (ms: number) => new Date(ms).toLocaleTimeString(t.locale, { hour: '2-digit', minute: '2-digit' });
    const day = sameLocalDay(new Date(startMs), new Date(now))
      ? t.today
      : new Date(startMs).toLocaleDateString(t.locale, { weekday: 'long', day: 'numeric', month: 'long' });
    whenLabel = `${day} ${fmt(startMs)} – ${fmt(endMs)}`;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1b1815] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(900px_600px_at_20%_0%,rgba(196,93,62,0.28),rgba(27,24,21,0)_70%),linear-gradient(180deg,rgba(27,24,21,0.6)_0%,#1b1815_70%)]" />
      <header className="relative flex items-center justify-between px-5 py-4 md:px-10">
        <Link href={backHref} className="inline-flex items-center gap-2 text-[13px] text-white/70 hover:text-white">
          <ChevronLeft size={16} />
          {l === 'es' && backLabel === 'Mon espace' ? 'Mi espacio' : backLabel}
        </Link>
        {status ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 ring-1 ring-white/15">
            <span
              className={`h-2 w-2 rounded-full ${status === 'live' ? 'animate-pulse bg-[#ef4444]' : status === 'done' ? 'bg-white/40' : 'bg-[#f3c58e]'}`}
            />
            {status === 'live' ? t.statusLive : status === 'done' ? t.statusDone : t.statusBefore}
          </span>
        ) : null}
      </header>

      <main className="relative mx-auto grid max-w-6xl gap-6 px-5 pb-16 pt-4 md:px-10 lg:grid-cols-[1fr_1.1fr] lg:gap-x-10 lg:gap-y-6 lg:pt-10">
        <section className="order-1 lg:col-start-1 lg:row-start-1">
          <p className="fm-kicker !text-[#f3c58e]">
            {t.live}
            {whenLabel ? ` · ${whenLabel}` : ''}
            {languageLabel ? ` · ${languageLabel}` : ''}
          </p>
          <h1 className="fm-display mt-3 text-[2.6rem] leading-[1.02] !text-white md:text-[3.6rem]">{title}</h1>
          <p className="mt-3 flex items-center gap-2.5 text-[15px] text-white/75">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/landing/alejandra-avatar.jpg" alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover ring-2 ring-white/20" />
            {t.with}
          </p>
          {status === 'before' && startMs ? (
            <div className="mt-7 flex items-end gap-3" aria-live="off">
              {hours > 0 ? (
                <div className="rounded-[1.4rem] bg-white/[0.07] px-5 py-4 text-center ring-1 ring-white/10 backdrop-blur">
                  <p className="text-[48px] font-semibold leading-none tabular-nums tracking-tight md:text-[60px]">{pad(hours)}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">h</p>
                </div>
              ) : null}
              <div className="rounded-[1.4rem] bg-white/[0.07] px-5 py-4 text-center ring-1 ring-white/10 backdrop-blur">
                <p className="text-[48px] font-semibold leading-none tabular-nums tracking-tight md:text-[60px]">{pad(mins)}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">{t.min}</p>
              </div>
              <div className="rounded-[1.4rem] bg-white/[0.07] px-5 py-4 text-center ring-1 ring-white/10 backdrop-blur">
                <p className="text-[48px] font-semibold leading-none tabular-nums tracking-tight md:text-[60px]">{pad(secs)}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">{t.sec}</p>
              </div>
              <p className="pb-3 text-[14px] text-white/60">{t.before}</p>
            </div>
          ) : null}
        </section>

        <section className="order-2 space-y-3 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {children}
          <p className="text-[12.5px] leading-relaxed text-white/60">{t.room}</p>
          <div className="rounded-[1.4rem] bg-white/[0.06] p-4 text-[13px] leading-relaxed text-white/70 ring-1 ring-white/10">
            <p className="flex items-center gap-2 font-semibold text-white">
              <Lightbulb size={16} className="text-[#f3c58e]" />
              {t.advice}
            </p>
            <p className="mt-1">{A_VALIDER_LOT5.liveAdvice[l]}</p>
          </div>
        </section>

        <section className="order-3 lg:col-start-1 lg:row-start-2">
          <div className="max-w-md rounded-[1.4rem] bg-white/[0.06] p-5 ring-1 ring-white/10">
            <p className="text-[14px] font-semibold">{t.checklist}</p>
            <ul className="mt-3 space-y-2.5 text-[14px] text-white/80">
              {t.checks.map((label, i) => (
                <li key={label}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checks[i]}
                    className="flex w-full items-center gap-3 text-left"
                    onClick={() => setChecks((c) => c.map((v, j) => (j === i ? !v : v)))}
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${checks[i] ? 'bg-[#2f7d5b]' : 'border border-white/30'}`}>
                      {checks[i] ? <Check size={14} /> : null}
                    </span>
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {spotifyUrl ? (
            <p className="mt-4 text-[13px] text-white/60">
              <Music2 size={14} className="mr-1.5 inline text-[#f3c58e]" />
              {t.playlist}{' '}
              <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#f3c58e] underline-offset-4 hover:underline">
                Spotify
              </a>
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
