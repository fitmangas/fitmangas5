'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';

import { startProgramAction } from '@/app/compte/programmes/actions';
import { coverUrl, LEVEL_LABEL, type CatalogProgram } from '@/lib/programmes/catalogue';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const TIMES = ['07:00', '12:30', '18:00', '20:00'];

export function StartProgramModal({
  program,
  open,
  onClose,
  preview,
  pauseWarning,
}: {
  program: CatalogProgram;
  open: boolean;
  onClose: () => void;
  preview?: boolean;
  pauseWarning?: boolean;
}) {
  const [days, setDays] = useState<number[]>([1, 3, 5]);
  const [time, setTime] = useState('18:00');
  const [customTime, setCustomTime] = useState('');
  const [start, setStart] = useState<'today' | 'monday'>('monday');
  const [doStartTest, setDoStartTest] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open) return null;

  function toggleDay(n: number) {
    setDays((cur) => (cur.includes(n) ? cur.filter((d) => d !== n) : [...cur, n].sort()));
  }

  async function confirm() {
    if (preview) {
      onClose();
      return;
    }
    setBusy(true);
    setError(null);
    const startDate = start === 'today' ? new Date() : nextMonday();
    const res = await startProgramAction({
      programId: program.slug,
      startDate: startDate.toISOString().slice(0, 10),
      chosenDays: days,
      reminderTime: customTime || time,
      reminderEmail: true,
      reminderInapp: true,
      reminderPush: false,
    });
    setBusy(false);
    if (!res.ok) setError(res.message);
    else onClose();
    void doStartTest;
  }

  return (
    <div className="kpi-modal-backdrop fixed inset-0 z-[200] flex items-end justify-center bg-[rgba(29,26,23,0.42)] backdrop-blur-[6px] md:items-center md:p-6">
      <div role="dialog" aria-modal="true" className="kpi-modal-panel relative flex max-h-[94vh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-[2rem] bg-cream shadow-[0_40px_100px_-20px_rgba(29,26,23,0.55)] md:max-h-[92vh] md:rounded-[2rem]">
        <div className="fm-media relative h-[132px] shrink-0 md:h-[150px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl(program)} alt="" className="absolute inset-0 object-[50%_35%]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(29,26,23,0.15)_0%,rgba(29,26,23,0.72)_100%)]" />
          <span className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-full bg-white/70 md:hidden" />
          <button type="button" aria-label="Fermer" onClick={onClose} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-luxury-ink shadow-md">
            <X size={18} />
          </button>
          <div className="absolute bottom-4 left-6 right-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
              Nouveau programme · {LEVEL_LABEL[program.level]?.fr}
            </p>
            <h2 className="fm-display mt-1 text-[1.9rem] leading-none !text-white md:text-[2.2rem]">On démarre {program.title.fr}&nbsp;?</h2>
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-6 md:px-8">
          <p className="text-[14px] leading-relaxed text-luxury-muted">
            {program.weeks} semaines · {program.sessions_per_week} séances par semaine · {program.minutes_range}. Trois réglages et c&apos;est parti : tu pourras tout changer plus tard.
          </p>
          {pauseWarning ? (
            <p className="rounded-2xl bg-[#fff4e5] px-4 py-3 text-[13px] text-[#8a5a1f]">Ton programme en cours sera mis en pause. Tu pourras le reprendre plus tard, là où tu l&apos;avais laissé.</p>
          ) : null}
          <section>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-luxury-ink">
                <span className="mr-2 text-luxury-orange">1.</span>Tes jours d&apos;entraînement
              </h3>
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-success">
                <Check size={14} /> {days.length} jours choisis
              </span>
            </div>
            <p className="fm-hint !mt-1">3 jours conseillés, avec un jour de repos entre deux séances.</p>
            <div className="mt-3 grid grid-cols-7 gap-2">
              {DAYS.map((d, i) => {
                const on = days.includes(i + 1);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleDay(i + 1)}
                    className={`flex h-14 flex-col items-center justify-center rounded-2xl text-[12px] font-semibold ${
                      on ? 'bg-luxury-ink text-white shadow-[0_8px_18px_rgba(29,29,31,0.22)]' : 'border border-black/10 bg-white text-luxury-muted'
                    }`}
                  >
                    {d}
                    {on ? <span className="mt-1 text-white/80"><Check size={12} strokeWidth={3} /></span> : null}
                  </button>
                );
              })}
            </div>
          </section>
          <section>
            <h3 className="text-[15px] font-semibold text-luxury-ink">
              <span className="mr-2 text-luxury-orange">2.</span>Heure du rappel
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTime(t);
                    setCustomTime('');
                  }}
                  className={`rounded-full px-4 py-2 text-[13px] font-semibold ${time === t && !customTime ? 'bg-luxury-ink text-white' : 'border border-[#D9C9B4] bg-white text-luxury-muted'}`}
                >
                  {t}
                </button>
              ))}
              <input
                className="w-24 rounded-full border border-[#D9C9B4] px-3 py-2 text-center text-[13px]"
                placeholder="autre"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
              />
            </div>
          </section>
          <section>
            <h3 className="text-[15px] font-semibold text-luxury-ink">
              <span className="mr-2 text-luxury-orange">3.</span>Début
            </h3>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setStart('today')} className={`rounded-full px-4 py-2 text-[13px] font-semibold ${start === 'today' ? 'bg-luxury-ink text-white' : 'border border-[#D9C9B4] bg-white'}`}>
                Aujourd&apos;hui
              </button>
              <button type="button" onClick={() => setStart('monday')} className={`rounded-full px-4 py-2 text-[13px] font-semibold ${start === 'monday' ? 'bg-luxury-ink text-white' : 'border border-[#D9C9B4] bg-white'}`}>
                Lundi prochain (conseillé)
              </button>
            </div>
          </section>
          <button
            type="button"
            onClick={() => setDoStartTest((v) => !v)}
            className="flex w-full items-start gap-4 rounded-2xl border border-black/[0.07] bg-white p-4 text-left"
          >
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${doStartTest ? 'border-luxury-orange' : 'border-black/20'}`}>
              {doStartTest ? <Check size={12} className="text-luxury-orange" strokeWidth={3} /> : null}
            </span>
            <span>
              <span className="block text-[14px] font-semibold text-luxury-ink">Faire mon test de départ (2 min)</span>
              <span className="mt-0.5 block text-[12.5px] leading-relaxed text-luxury-muted">
                Planche sur les avant-bras · Hundred : séries de 10 respirations sans perdre le dos · Pont sur une jambe (côté le plus faible). Tu le refais à la fin pour voir tes progrès.
              </span>
            </span>
          </button>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>
        <div className="border-t border-black/[0.06] p-4">
          <button type="button" disabled={busy} onClick={() => void confirm()} className="btn-luxury-primary w-full">
            {busy ? '…' : 'C’est parti'}
          </button>
        </div>
      </div>
    </div>
  );
}

function nextMonday() {
  const d = new Date();
  const day = d.getDay();
  const add = day === 1 ? 7 : (8 - day) % 7 || 7;
  d.setDate(d.getDate() + add);
  return d;
}
