'use client';

import { useState, type FormEvent } from 'react';

import { GlassCard } from '@/components/ui/GlassCard';
import type { ClientLang } from '@/lib/compte/i18n';
import type { HealthScores } from '@/lib/self-knowledge/types';

type Props = {
  lang: ClientLang;
  consentId: string;
};

export function HealthMetricsForm({ lang, consentId }: Props) {
  const [sessionsPerWeek, setSessionsPerWeek] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [restingHr, setRestingHr] = useState('');
  const [hrvMs, setHrvMs] = useState('');
  const [activeMinutes, setActiveMinutes] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<HealthScores | null>(null);

  const t =
    lang === 'es'
      ? {
          title: 'Indicadores de la semana',
          disclaimer: 'Indicativo, no médico. Consulta a un profesional si tienes dudas.',
          sessions: 'Sesiones / semana',
          sleep: 'Horas de sueño (media)',
          hr: 'FC reposo (lpm)',
          hrv: 'VFC (ms) — opcional',
          active: 'Minutos activos / semana',
          note: 'Nota (opcional)',
          cta: 'Calcular mis puntuaciones',
          loading: 'Guardando…',
          regularite: 'Regularidad',
          recuperation: 'Recuperación',
          energie: 'Energía',
        }
      : lang === 'en'
        ? {
            title: 'Weekly indicators',
            disclaimer: 'Indicative only, not medical. See a professional if unsure.',
            sessions: 'Sessions / week',
            sleep: 'Sleep hours (avg)',
            hr: 'Resting HR (bpm)',
            hrv: 'HRV (ms) — optional',
            active: 'Active minutes / week',
            note: 'Note (optional)',
            cta: 'Calculate my scores',
            loading: 'Saving…',
            regularite: 'Consistency',
            recuperation: 'Recovery',
            energie: 'Energy',
          }
        : {
            title: 'Indicateurs de la semaine',
            disclaimer: 'Indicatif, non médical. Consulte un professionnel en cas de doute.',
            sessions: 'Séances / semaine',
            sleep: 'Heures de sommeil (moyenne)',
            hr: 'FC repos (bpm)',
            hrv: 'VFC (ms) — optionnel',
            active: 'Minutes actives / semaine',
            note: 'Note (optionnel)',
            cta: 'Calculer mes scores',
            loading: 'Enregistrement…',
            regularite: 'Régularité',
            recuperation: 'Récupération',
            energie: 'Énergie',
          };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/self-knowledge/health/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentId,
          metrics: {
            sessionsPerWeek: sessionsPerWeek ? Number(sessionsPerWeek) : null,
            sleepHours: sleepHours ? Number(sleepHours) : null,
            restingHr: restingHr ? Number(restingHr) : null,
            hrvMs: hrvMs ? Number(hrvMs) : null,
            activeMinutes: activeMinutes ? Number(activeMinutes) : null,
          },
          note: note.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; scores?: HealthScores };
      if (!res.ok) {
        setError(data.error ?? 'Erreur.');
        return;
      }
      if (data.scores) setScores(data.scores);
    } catch {
      setError(lang === 'es' ? 'Error de red.' : 'Erreur réseau.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-white/45 bg-white/55 px-4 py-3 text-sm text-luxury-ink outline-none ring-orange-400/25 focus:ring-2';

  return (
    <GlassCard className="p-6 md:p-8">
      <h2 className="text-xl font-semibold text-luxury-ink">{t.title}</h2>
      <p className="mt-2 text-xs text-luxury-muted">{t.disclaimer}</p>

      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <label className="block space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">{t.sessions}</span>
          <input type="number" min={0} max={14} step={0.5} value={sessionsPerWeek} onChange={(e) => setSessionsPerWeek(e.target.value)} className={inputClass} />
        </label>
        <label className="block space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">{t.sleep}</span>
          <input type="number" min={0} max={16} step={0.5} value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} className={inputClass} />
        </label>
        <label className="block space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">{t.hr}</span>
          <input type="number" min={30} max={120} value={restingHr} onChange={(e) => setRestingHr(e.target.value)} className={inputClass} />
        </label>
        <label className="block space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">{t.hrv}</span>
          <input type="number" min={5} max={200} value={hrvMs} onChange={(e) => setHrvMs(e.target.value)} className={inputClass} />
        </label>
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">{t.active}</span>
          <input type="number" min={0} max={2000} value={activeMinutes} onChange={(e) => setActiveMinutes(e.target.value)} className={inputClass} />
        </label>
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">{t.note}</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={300} className={inputClass} />
        </label>

        {error ? (
          <p className="sm:col-span-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={loading} className="btn-luxury-primary sm:col-span-2 px-7 py-3 text-[11px] tracking-[0.14em]">
          {loading ? t.loading : t.cta}
        </button>
      </form>

      {scores ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {(
            [
              ['regularite', t.regularite],
              ['recuperation', t.recuperation],
              ['energie', t.energie],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="rounded-2xl border border-white/40 bg-white/45 p-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-luxury-ink">{scores[key]}</p>
              <p className="text-[10px] text-luxury-muted">/100</p>
            </div>
          ))}
        </div>
      ) : null}
    </GlassCard>
  );
}
