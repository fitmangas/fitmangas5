'use client';

import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { HubEmptyState, HubSectionHero } from '@/components/SelfKnowledge/compte/HubVisuals';
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
          eyebrow: 'Crecimiento',
          title: 'Desarrollo personal',
          lead: 'Diario, desafíos suaves y lecturas — sin presión.',
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
          open: 'Ver el recurso',
          emptyJournalTitle: 'Escribe tu primera victoria del día',
          emptyJournalLead: 'Una línea basta — la constancia nace de lo pequeño.',
          emptyJournalCta: 'Empezar el diario',
          emptyReadingTitle: 'Las lecturas llegan pronto',
          emptyReadingLead: 'Cuando haya un recurso, lo verás aquí con su enlace claro.',
          emptyChallenges: 'Los desafíos suaves aparecerán aquí.',
          type: 'Tipo',
        }
      : {
          eyebrow: 'Croissance',
          title: 'Développement personnel',
          lead: 'Journal, défis doux et lectures — sans pression.',
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
          open: 'Voir la ressource',
          emptyJournalTitle: 'Écris ta première victoire du jour',
          emptyJournalLead: 'Une ligne suffit — la constance naît du petit.',
          emptyJournalCta: 'Commencer le journal',
          emptyReadingTitle: 'Les lectures arrivent bientôt',
          emptyReadingLead: 'Quand une ressource sera prête, tu la verras ici avec son lien clairement signalé.',
          emptyChallenges: 'Les défis doux apparaîtront ici.',
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

  const card =
    'rounded-[26px] border border-white/70 bg-[#FFFAF5] p-5 shadow-[0_14px_40px_rgba(60,40,30,0.1)] sm:p-6';

  return (
    <div className="mt-2 space-y-8">
      <HubSectionHero
        imageSrc="/library/portraits/portrait-07-4x5.webp"
        imageAlt=""
        eyebrow={t.eyebrow}
        title={t.title}
        lead={t.lead}
      />

      <section id="journal">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c45d3e]">{t.journal}</h2>
        {journal.length === 0 ? (
          <div className="mt-4">
            <HubEmptyState
              imageSrc="/library/lifestyle-coulisses/lifestyle-02-4x5.webp"
              imageAlt=""
              title={t.emptyJournalTitle}
              lead={t.emptyJournalLead}
              ctaLabel={t.emptyJournalCta}
              ctaHref="#journal-form"
              testId="journal-empty"
            />
          </div>
        ) : null}

        <div id="journal-form" className={`mt-4 ${card}`}>
          <form onSubmit={saveJournal} className="space-y-3">
            <label className="block text-xs text-brand-ink/55">
              {t.victory}
              <textarea
                required
                value={victory}
                onChange={(e) => setVictory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-brand-ink/10 bg-white/90 px-3 py-2.5 text-sm text-brand-ink"
                rows={2}
              />
            </label>
            <label className="block text-xs text-brand-ink/55">
              {t.friction}
              <textarea
                required
                value={friction}
                onChange={(e) => setFriction(e.target.value)}
                className="mt-1 w-full rounded-xl border border-brand-ink/10 bg-white/90 px-3 py-2.5 text-sm text-brand-ink"
                rows={2}
              />
            </label>
            <label className="block text-xs text-brand-ink/55">
              {t.next}
              <textarea
                required
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                className="mt-1 w-full rounded-xl border border-brand-ink/10 bg-white/90 px-3 py-2.5 text-sm text-brand-ink"
                rows={2}
              />
            </label>
            {error ? <p className="text-sm text-[#c45d3e]">{error}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-[#c45d3e] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_10px_24px_rgba(196,93,62,0.28)] disabled:opacity-60"
            >
              {t.save}
            </button>
          </form>
        </div>

        {journal.length > 0 ? (
          <>
            <h3 className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/40">{t.history}</h3>
            <ul className="mt-3 space-y-3">
              {journal.map((j) => (
                <li key={j.id} className={card}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c45d3e]">
                    {dateFmt.format(new Date(j.created_at))}
                  </p>
                  <p className="mt-2 text-sm text-brand-ink">
                    <strong>{t.victory} :</strong> {j.victory}
                  </p>
                  <p className="mt-1 text-sm text-brand-ink/60">
                    <strong>{t.friction} :</strong> {j.friction}
                  </p>
                  <p className="mt-1 text-sm text-brand-ink/60">
                    <strong>{t.next} :</strong> {j.next_step}
                  </p>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      {prompts.length > 0 ? (
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-ink/45">{t.reflections}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {prompts.map((p) => (
              <div key={p.id} className={card}>
                <h3 className="font-serif text-base italic text-brand-ink">
                  {locale === 'es' ? p.title_es : p.title_fr}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-ink/60">
                  {locale === 'es' ? p.body_es : p.body_fr}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-ink/45">{t.challenges}</h2>
        {challenges.length === 0 ? (
          <p className="mt-3 text-sm text-brand-ink/50">{t.emptyChallenges}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {challenges.map((c) => (
              <li
                key={c.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-[22px] border px-4 py-4 transition ${
                  c.completed
                    ? 'border-[#c45d3e]/40 bg-gradient-to-r from-[#c45d3e]/12 to-[#FFFAF5] shadow-[0_8px_20px_rgba(196,93,62,0.12)]'
                    : 'border-white/70 bg-[#FFFAF5] shadow-[0_14px_40px_rgba(60,40,30,0.08)]'
                }`}
              >
                <div>
                  <h3 className="font-medium text-brand-ink">{locale === 'es' ? c.title_es : c.title_fr}</h3>
                  <p className="mt-1 text-sm text-brand-ink/55">{locale === 'es' ? c.body_es : c.body_fr}</p>
                </div>
                {c.completed ? (
                  <span className="rounded-full bg-[#c45d3e] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                    {t.done} ✓
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
              </li>
            ))}
          </ul>
        )}
      </section>

      <section data-testid="reading-club">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-ink/45">{t.reading}</h2>
        {resources.length === 0 ? (
          <div className="mt-4">
            <HubEmptyState
              imageSrc="/library/ambiance-studio/ambiance-studio-02-4x5.webp"
              imageAlt=""
              title={t.emptyReadingTitle}
              lead={t.emptyReadingLead}
              ctaLabel={locale === 'es' ? 'Ver tests' : 'Voir les tests'}
              ctaHref="/compte/connaissance-de-soi/tests"
              testId="reading-empty"
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {resources.map((r) => (
              <article key={r.id} className={`overflow-hidden ${card} !p-0`}>
                <div className="relative h-28 w-full">
                  <Image
                    src="/library/ambiance-studio/ambiance-studio-01-4x5.webp"
                    alt=""
                    fill
                    className="object-cover object-center"
                    sizes="(max-width:640px) 100vw, 400px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1410]/55 to-transparent" />
                  <p className="absolute bottom-3 left-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white/90">
                    {r.resource_type ?? 'book'} · {r.theme}
                  </p>
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-lg italic text-brand-ink">{r.title}</h3>
                  <p className="text-xs text-brand-ink/50">{r.author}</p>
                  {r.why_text ? <p className="mt-2 text-sm leading-relaxed text-brand-ink/60">{r.why_text}</p> : null}
                  {r.affiliate_url ? (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => trackAffiliate(r.id, r.affiliate_url!)}
                        className="rounded-full bg-[#c45d3e] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
                        data-testid="affiliate-link"
                      >
                        {t.open}
                      </button>
                      <span
                        className="rounded-full border border-[#c45d3e]/40 bg-[#c45d3e]/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#c45d3e]"
                        data-testid="affiliate-disclosure"
                      >
                        {t.affiliate}
                      </span>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
