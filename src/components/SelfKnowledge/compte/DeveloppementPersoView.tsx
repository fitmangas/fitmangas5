'use client';

import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import {
  BookCoverPlaceholder,
  HubEmptyState,
  HubSectionHero,
} from '@/components/SelfKnowledge/compte/HubVisuals';
import type { ClientLang } from '@/lib/compte/i18n';
import type { JournalEntryRow, ReadingResourceRow } from '@/lib/self-knowledge/store';

import '@/components/SelfKnowledge/compte/hub-member.css';

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

  const books = resources.filter((r) => (r.resource_type ?? 'book') === 'book');
  const gear = resources.filter((r) => r.resource_type === 'gear');

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
          lectures: 'Lecturas',
          materiel: 'Material',
          affiliate: 'Enlace de afiliado',
          samePrice: 'Mismo precio que en la tienda — sin coste extra para ti.',
          open: 'Ver el recurso',
          emptyJournalTitle: 'Escribe tu primera victoria del día',
          emptyJournalLead: 'Una línea basta — la constancia nace de lo pequeño.',
          emptyJournalCta: 'Empezar el diario',
          emptyReadingTitle: 'Las lecturas llegan pronto',
          emptyReadingLead: 'Cuando haya un recurso, lo verás aquí con su portada y su enlace claro.',
          emptyChallenges: 'Los desafíos suaves aparecerán aquí.',
          emptyGear: 'El material recomendado aparecerá aquí.',
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
          lectures: 'Lectures',
          materiel: 'Matériel',
          affiliate: 'Lien affilié',
          samePrice: 'Même prix qu’en magasin — aucun surcoût pour toi.',
          open: 'Voir la ressource',
          emptyJournalTitle: 'Écris ta première victoire du jour',
          emptyJournalLead: 'Une ligne suffit — la constance naît du petit.',
          emptyJournalCta: 'Commencer le journal',
          emptyReadingTitle: 'Les lectures arrivent bientôt',
          emptyReadingLead: 'Quand une ressource sera prête, tu la verras ici avec sa couverture et son lien clairement signalé.',
          emptyChallenges: 'Les défis doux apparaîtront ici.',
          emptyGear: 'Le matériel recommandé apparaîtra ici.',
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
    'hub-elevate rounded-[26px] border border-white/70 bg-[#FFFAF5] p-5 shadow-[0_14px_40px_rgba(60,40,30,0.1)] sm:p-6';

  function ResourceCard({ r, portrait }: { r: ReadingResourceRow; portrait: boolean }) {
    const cover = r.cover_image_url?.trim() || null;
    return (
      <article
        key={r.id}
        className={`overflow-hidden ${card} !p-0`}
        data-testid={portrait ? 'reading-book-card' : 'reading-gear-card'}
      >
        <div className={`relative ${portrait ? 'aspect-[2/3] w-full max-h-56 sm:max-h-64' : 'h-36 w-full'}`}>
          {cover ? (
            <Image
              src={cover}
              alt={`Couverture — ${r.title}`}
              fill
              className={portrait ? 'object-cover object-top' : 'object-contain bg-[#f5ebe3] p-4'}
              sizes="(max-width:640px) 50vw, 280px"
            />
          ) : (
            <BookCoverPlaceholder title={r.title} />
          )}
        </div>
        <div className="p-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-ink/40">{r.theme}</p>
          <h3 className="mt-1 font-serif text-lg italic text-brand-ink">{r.title}</h3>
          <p className="text-xs text-brand-ink/50">{r.author}</p>
          {r.why_text ? <p className="mt-2 text-sm leading-relaxed text-brand-ink/60">{r.why_text}</p> : null}
          {r.affiliate_url ? (
            <div className="mt-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => trackAffiliate(r.id, r.affiliate_url!)}
                  className="rounded-full bg-[#c45d3e] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
                  data-testid="affiliate-link"
                >
                  {t.open}
                </button>
                {r.disclosure ? (
                  <span
                    className="rounded-full border border-[#c45d3e]/40 bg-[#c45d3e]/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#c45d3e]"
                    data-testid="affiliate-disclosure"
                  >
                    {t.affiliate}
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] leading-snug text-brand-ink/45">{t.samePrice}</p>
            </div>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <div className="mt-2 space-y-10">
      <HubSectionHero eyebrow={t.eyebrow} title={t.title} lead={t.lead} />

      <section id="journal" className="hub-reveal">
        <h2 className="font-serif text-2xl italic text-brand-ink">{t.journal}</h2>
        {journal.length === 0 ? (
          <div className="mt-4">
            <HubEmptyState
              title={t.emptyJournalTitle}
              lead={t.emptyJournalLead}
              ctaLabel={t.emptyJournalCta}
              ctaHref="#journal-form"
              testId="journal-empty"
              preview="journal"
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
        <section className="hub-reveal">
          <h2 className="font-serif text-2xl italic text-brand-ink">{t.reflections}</h2>
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

      <section className="hub-reveal">
        <h2 className="font-serif text-2xl italic text-brand-ink">{t.challenges}</h2>
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

      <section data-testid="reading-club" className="hub-reveal space-y-10">
        <div data-testid="reading-section-books">
          <h2 className="font-serif text-2xl italic text-brand-ink">{t.lectures}</h2>
          {books.length === 0 ? (
            <div className="mt-4">
              <HubEmptyState
                title={t.emptyReadingTitle}
                lead={t.emptyReadingLead}
                ctaLabel={locale === 'es' ? 'Ver tests' : 'Voir les tests'}
                ctaHref="/compte/connaissance-de-soi/tests"
                testId="reading-empty"
                preview="books"
              />
            </div>
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {books.map((r) => (
                <ResourceCard key={r.id} r={r} portrait />
              ))}
            </div>
          )}
        </div>

        <div data-testid="reading-section-gear">
          <h2 className="font-serif text-2xl italic text-brand-ink">{t.materiel}</h2>
          {gear.length === 0 ? (
            <p className="mt-3 text-sm text-brand-ink/50">{t.emptyGear}</p>
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {gear.map((r) => (
                <ResourceCard key={r.id} r={r} portrait={false} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
