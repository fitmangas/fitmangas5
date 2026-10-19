'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Check, ChevronLeft, Lightbulb, Music2 } from 'lucide-react';

import { A_VALIDER_LOT5 } from '@/content/a-valider';

type Props = {
  title: string;
  languageLabel: string | null;
  startsAt: string | null;
  endsAt: string | null;
  backHref: string;
  backLabel: string;
  spotifyUrl: string | null;
  children: ReactNode;
};

const CHECKS_FR = ['Ton tapis est déroulé', "Une bouteille d'eau à portée de main", 'Ta caméra te voit en entier, de face', 'Une serviette ou un coussin'];
const CHECKS_ES = ['Tu tapete está listo', 'Una botella de agua a mano', 'Tu cámara te ve de cuerpo entero', 'Una toalla o un cojín'];

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, '0');
}

export function LiveHabillage({ title, languageLabel, startsAt, endsAt, backHref, backLabel, spotifyUrl, children }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [checks, setChecks] = useState([false, false, false, false]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const startMs = startsAt ? new Date(startsAt).getTime() : null;
  const endMs = endsAt ? new Date(endsAt).getTime() : null;
  const status = useMemo(() => {
    if (startMs == null) return null;
    if (now < startMs) return 'before';
    if (endMs != null && now > endMs) return 'done';
    return 'live';
  }, [now, startMs, endMs]);

  const remain = startMs != null ? Math.max(0, startMs - now) : 0;
  const mins = Math.floor(remain / 60000);
  const secs = Math.floor((remain % 60000) / 1000);
  const timeLabel =
    startMs && endMs
      ? `${new Date(startMs).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} – ${new Date(endMs).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
      : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1b1815] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(900px_600px_at_20%_0%,rgba(196,93,62,0.28),rgba(27,24,21,0)_70%),linear-gradient(180deg,rgba(27,24,21,0.6)_0%,#1b1815_70%)]" />
      <header className="relative flex items-center justify-between px-5 py-4 md:px-10">
        <Link href={backHref} className="inline-flex items-center gap-2 text-[13px] text-white/70">
          <ChevronLeft size={16} />
          {backLabel}
        </Link>
        {status ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 ring-1 ring-white/15">
            <span className={`h-2 w-2 rounded-full ${status === 'live' ? 'bg-[#ef4444]' : status === 'done' ? 'bg-white/40' : 'bg-[#f3c58e]'}`} />
            {status === 'live' ? 'En direct' : status === 'done' ? 'Terminé' : 'Avant le cours'}
          </span>
        ) : null}
      </header>

      <main className="relative mx-auto grid max-w-6xl gap-6 px-5 pb-16 pt-4 md:px-10 lg:grid-cols-[1fr_1.1fr] lg:gap-x-10 lg:gap-y-6 lg:pt-10">
        <section className="order-1 lg:col-start-1 lg:row-start-1">
          <p className="fm-kicker !text-[#f3c58e]">
            Live{timeLabel ? ` · aujourd’hui ${timeLabel}` : ''}
            {languageLabel ? ` · ${languageLabel}` : ''}
          </p>
          <h1 className="fm-display mt-3 text-[2.6rem] leading-[1.02] !text-white md:text-[3.6rem]">{title}</h1>
          <p className="mt-3 text-[15px] text-white/75">avec Alejandra</p>
          {status === 'before' && startMs ? (
            <div className="mt-7 flex items-end gap-3">
              <div className="rounded-[1.4rem] bg-white/[0.07] px-5 py-4 text-center ring-1 ring-white/10 backdrop-blur">
                <p className="text-[48px] font-semibold leading-none tabular-nums tracking-tight md:text-[60px]">{pad(mins)}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">min</p>
              </div>
              <div className="rounded-[1.4rem] bg-white/[0.07] px-5 py-4 text-center ring-1 ring-white/10 backdrop-blur">
                <p className="text-[48px] font-semibold leading-none tabular-nums tracking-tight md:text-[60px]">{pad(secs)}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">s</p>
              </div>
              <p className="pb-3 text-[14px] text-white/60">avant le début</p>
            </div>
          ) : null}
        </section>

        <section className="order-2 space-y-3 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {children}
          <p className="text-[12.5px] leading-relaxed text-white/60">
            Tu es déjà dans la salle du live : ta caméra s’affiche dans le cadre, c’est ton test. Ton micro est coupé à l’entrée ; active-le pour parler à Alejandra. Pendant le cours, passe en « Plein écran ».
          </p>
          <div className="rounded-[1.4rem] bg-white/[0.06] p-4 text-[13px] leading-relaxed text-white/70 ring-1 ring-white/10">
            <p className="flex items-center gap-2 font-semibold text-white">
              <Lightbulb size={16} className="text-[#f3c58e]" />
              Le conseil d’Alejandra
            </p>
            <p className="mt-1">{A_VALIDER_LOT5.liveAdvice.fr}</p>
          </div>
        </section>

        <section className="order-3 lg:col-start-1 lg:row-start-2">
          <div className="max-w-md rounded-[1.4rem] bg-white/[0.06] p-5 ring-1 ring-white/10">
            <p className="text-[14px] font-semibold">Avant de commencer</p>
            <ul className="mt-3 space-y-2.5 text-[14px] text-white/80">
              {CHECKS_FR.map((label, i) => (
                <li key={label}>
                  <button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => setChecks((c) => c.map((v, j) => (j === i ? !v : v)))}>
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full ${checks[i] ? 'bg-[#2f7d5b]' : 'border border-white/30'}`}>
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
              Playlist de la séance :{' '}
              <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#f3c58e] underline-offset-4">
                Spotify
              </a>
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}

export { CHECKS_ES };
