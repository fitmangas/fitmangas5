'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { GlassCard } from '@/components/ui/GlassCard';
import type { ClientLang } from '@/lib/compte/i18n';
import type { JournalEntryRow, ReadingResourceRow } from '@/lib/self-knowledge/store';

type Prompt = {
  id: string;
  slug: string;
  title_fr: string;
  title_es: string;
  body_fr: string;
  body_es: string;
};

type Challenge = Prompt & { completed?: boolean };

type Props = {
  lang: ClientLang;
  journal: JournalEntryRow[];
  prompts: Prompt[];
  challenges: Challenge[];
  resources: ReadingResourceRow[];
};

export function DeveloppementPersoView({ lang, journal, prompts, challenges, resources }: Props) {
  const locale = lang === 'es' ? 'es' : 'fr';
  const router = useRouter();
  const [victory, setVictory] = useState('');
  const [friction, setFriction] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t =
    locale === 'es'
      ? {
          journal: 'Diario guiado',
          victory: 'Una victoria',
          friction: 'Un tropiezo',
          next: 'Un próximo paso',
          save: 'Guardar',
          history: 'Entradas recientes',
          reflections: 'Reflexiones guiadas',
          challenges: 'Desafíos suaves',
          done: 'Hecho',
          mark: 'Marcar hecho',
          reading: 'Club de lectura',
          affiliate: 'Enlace de afiliado',
          open: 'Abrir',
          empty: 'Aún vacío.',
          type: 'Tipo',
        }
      : {
          journal: 'Journal guidé',
          victory: 'Une victoire',
          friction: 'Un accroc',
          next: 'Un prochain pas',
          save: 'Enregistrer',
          history: 'Entrées récentes',
          reflections: 'Réflexions guidées',
          challenges: 'Défis doux',
          done: 'Fait',
          mark: 'Marquer fait',
          reading: 'Club de lecture',
          affiliate: 'Lien affilié',
          open: 'Ouvrir',
          empty: 'Encore vide.',
          type: 'Type',
        };

  async function saveJournal(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/self-knowledge/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ victory, friction, nextStep, locale }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? 'Erreur');
        return;
      }
      setVictory('');
      setFriction('');
      setNextStep('');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function completeChallenge(challengeId: string) {
    await fetch('/api/self-knowledge/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId }),
    });
    router.refresh();
  }

  async function trackAffiliate(resourceId: string, url: string) {
    await fetch('/api/self-knowledge/affiliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceId }),
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  const dateFmt = new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'fr-FR', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="mt-8 space-y-10">
      <section>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c45d3e]">{t.journal}</h2>
        <GlassCard className="mt-4 p-5 md:p-6">
          <form onSubmit={saveJournal} className="space-y-3">
            <label className="block text-xs text-luxury-muted">
              {t.victory}
              <textarea
                required
                value={victory}
                onChange={(e) => setVictory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-luxury-ink/10 bg-white/80 px-3 py-2 text-sm"
                rows={2}
              />
            </label>
            <label className="block text-xs text-luxury-muted">
              {t.friction}
              <textarea
                required
                value={friction}
                onChange={(e) => setFriction(e.target.value)}
                className="mt-1 w-full rounded-xl border border-luxury-ink/10 bg-white/80 px-3 py-2 text-sm"
                rows={2}
              />
            </label>
            <label className="block text-xs text-luxury-muted">
              {t.next}
              <textarea
                required
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                className="mt-1 w-full rounded-xl border border-luxury-ink/10 bg-white/80 px-3 py-2 text-sm"
                rows={2}
              />
            </label>
            {error ? <p className="text-sm text-[#c45d3e]">{error}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="btn-luxury-primary px-5 py-2.5 text-[11px] tracking-[0.12em] disabled:opacity-60"
            >
              {t.save}
            </button>
          </form>
        </GlassCard>
        <h3 className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">{t.history}</h3>
        {journal.length === 0 ? (
          <p className="mt-2 text-sm text-luxury-muted">{t.empty}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {journal.map((j) => (
              <li key={j.id}>
                <GlassCard className="p-4">
                  <p className="text-[10px] text-luxury-soft">{dateFmt.format(new Date(j.created_at))}</p>
                  <p className="mt-2 text-sm text-luxury-ink">
                    <strong>{t.victory} :</strong> {j.victory}
                  </p>
                  <p className="mt-1 text-sm text-luxury-muted">
                    <strong>{t.friction} :</strong> {j.friction}
                  </p>
                  <p className="mt-1 text-sm text-luxury-muted">
                    <strong>{t.next} :</strong> {j.next_step}
                  </p>
                </GlassCard>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">{t.reflections}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {prompts.map((p) => (
            <GlassCard key={p.id} className="p-4">
              <h3 className="font-serif text-base italic text-luxury-ink">
                {locale === 'es' ? p.title_es : p.title_fr}
              </h3>
              <p className="mt-2 text-sm text-luxury-muted">{locale === 'es' ? p.body_es : p.body_fr}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">{t.challenges}</h2>
        <ul className="mt-4 space-y-3">
          {challenges.map((c) => (
            <li key={c.id}>
              <GlassCard className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <h3 className="font-medium text-luxury-ink">{locale === 'es' ? c.title_es : c.title_fr}</h3>
                  <p className="mt-1 text-sm text-luxury-muted">{locale === 'es' ? c.body_es : c.body_fr}</p>
                </div>
                {c.completed ? (
                  <span className="rounded-full bg-[#c45d3e]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#c45d3e]">
                    {t.done}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => completeChallenge(c.id)}
                    className="rounded-full border border-[#c45d3e] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#c45d3e]"
                  >
                    {t.mark}
                  </button>
                )}
              </GlassCard>
            </li>
          ))}
        </ul>
      </section>

      <section data-testid="reading-club">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">{t.reading}</h2>
        {resources.length === 0 ? (
          <p className="mt-4 text-sm text-luxury-muted">{t.empty}</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {resources.map((r) => (
              <GlassCard key={r.id} className="p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">
                  {r.resource_type ?? 'book'} · {r.theme}
                </p>
                <h3 className="mt-1 font-medium text-luxury-ink">{r.title}</h3>
                <p className="text-xs text-luxury-muted">{r.author}</p>
                {r.why_text ? <p className="mt-2 text-sm text-luxury-muted">{r.why_text}</p> : null}
                {r.affiliate_url ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => trackAffiliate(r.id, r.affiliate_url!)}
                      className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#c45d3e] underline"
                    >
                      {t.open}
                    </button>
                    {(r.disclosure || true) && (
                      <span className="rounded-full border border-luxury-ink/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-luxury-soft">
                        {t.affiliate}
                      </span>
                    )}
                  </div>
                ) : null}
              </GlassCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
