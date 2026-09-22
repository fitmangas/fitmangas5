import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { CompteDashboardBackLink } from '@/components/Compte/CompteDashboardBackLink';
import {
  ConsistencyChain,
  HubEmptyState,
  HubSectionHero,
} from '@/components/SelfKnowledge/compte/HubVisuals';
import { SelfKnowledgeHubNav } from '@/components/SelfKnowledge/compte/SelfKnowledgeHubNav';
import { VisioLock } from '@/components/Premium/VisioLock';
import { hasVisioClientAccess } from '@/lib/access-control';
import { getClientLang } from '@/lib/compte/i18n';
import {
  computeConsistencyStreak,
  listMemberProgressHistory,
} from '@/lib/self-knowledge/progress-monthly';
import { getSelfTest } from '@/lib/self-knowledge/scoring';
import { listHealthEntries, listJournalEntries, listResultsForProfile } from '@/lib/self-knowledge/store';
import { createClient } from '@/lib/supabase/server';

const HERO = '/library/portraits/portrait-05-4x5.webp';
const EMPTY_IMG = '/library/portraits/portrait-01-4x5.webp';

export default async function ConnaissanceDeSoiEvolutionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/?compte=connexion-requise');

  const [lang, hasVisioAccess] = await Promise.all([
    getClientLang(supabase, user.id),
    hasVisioClientAccess(user.id),
  ]);
  const locale = lang === 'es' ? 'es' : 'fr';

  const [results, health, progress, streak, journal] = hasVisioAccess
    ? await Promise.all([
        listResultsForProfile(user.id),
        listHealthEntries(user.id, 12),
        listMemberProgressHistory(user.id, 6),
        computeConsistencyStreak(user.id),
        listJournalEntries(user.id, 3),
      ])
    : [[], [], [], 0, []];

  const latestTest = results[0];
  const prevSame =
    latestTest &&
    results.find(
      (r) =>
        r.id !== latestTest.id &&
        r.test_slug === latestTest.test_slug &&
        (r.test_version ?? '') === (latestTest.test_version ?? ''),
    );
  const latestHealth = health.length ? health[health.length - 1] : null;
  const prevHealth = health.length > 1 ? health[health.length - 2] : null;
  const currentMonth = progress.length ? progress[progress.length - 1] : null;
  const prevMonth = progress.length > 1 ? progress[progress.length - 2] : null;

  const t =
    locale === 'es'
      ? {
          title: 'Mi evolución',
          eyebrow: 'Conocimiento de una misma',
          dashboard: 'Panel',
          lead: 'Tú frente a ti misma — el camino recorrido, sin compararte con nadie.',
          streak: 'Cadena de constancia',
          weeks: 'semana(s) seguidas con al menos una práctica',
          victory: 'Tu micro-victoria',
          victoryEmptyTitle: 'Tu primera victoria te espera',
          victoryEmptyLead:
            'Haz un test, sigue una clase o escribe una línea en el diario — aparecerás aquí.',
          victoryCta: 'Empezar un test',
          tests: 'Último avance en tests',
          health: 'Tendencia bienestar',
          progress: 'Constancia reciente',
          open: 'Abrir',
          vs: 'vs',
          better: 'en progreso',
          steady: 'estable',
          emptyHeroCta: 'Descubrirme',
        }
      : {
          title: 'Mon évolution',
          eyebrow: 'Connaissance de soi',
          dashboard: 'Dashboard',
          lead: 'Toi face à toi-même — le chemin parcouru, sans te comparer à personne.',
          streak: 'Chaîne de constance',
          weeks: 'semaine(s) d’affilée avec au moins une pratique',
          victory: 'Ta micro-victoire',
          victoryEmptyTitle: 'Ta première victoire t’attend',
          victoryEmptyLead:
            'Passe un test, suis un cours ou note une ligne dans le journal — tu apparaîtras ici.',
          victoryCta: 'Faire un test',
          tests: 'Dernière avancée tests',
          health: 'Tendance bien-être',
          progress: 'Constance récente',
          open: 'Ouvrir',
          vs: 'vs',
          better: 'en progrès',
          steady: 'stable',
          emptyHeroCta: 'Me découvrir',
        };

  const dateFmt = new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  let microVictory: string | null = null;
  if (journal[0]?.victory) {
    microVictory = journal[0].victory;
  } else if (latestTest?.analysis_teaser) {
    microVictory = latestTest.analysis_teaser.slice(0, 160);
  } else if (currentMonth && currentMonth.sessions > 0) {
    microVictory =
      locale === 'es'
        ? `${currentMonth.sessions} sesión(es) este mes — sigues apareciendo.`
        : `${currentMonth.sessions} séance(s) ce mois — tu continues d’être là.`;
  }

  const healthTrend =
    latestHealth && prevHealth
      ? (() => {
          const a = (latestHealth.scores as { energie?: number })?.energie ?? 0;
          const b = (prevHealth.scores as { energie?: number })?.energie ?? 0;
          return a >= b ? t.better : t.steady;
        })()
      : null;

  const hasAnySignal = Boolean(microVictory || latestTest || currentMonth?.sessions || streak > 0);

  return (
    <VisioLock
      hasAccess={hasVisioAccess}
      locale={locale}
      featureDescription_fr="L’univers connaissance de soi est réservé aux membres active ou en essai."
      featureDescription_es="El universo de conocimiento de una misma es para miembros active o en prueba."
    >
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-2 md:px-8 md:pt-6">
        <CompteDashboardBackLink label={t.dashboard} className="mb-4" />
        <SelfKnowledgeHubNav lang={lang} active="evolution" />

        <HubSectionHero
          imageSrc={HERO}
          imageAlt="Alejandra"
          eyebrow={t.eyebrow}
          title={t.title}
          lead={t.lead}
        />

        <section className="mt-8 space-y-5">
          {!hasAnySignal ? (
            <HubEmptyState
              imageSrc={EMPTY_IMG}
              imageAlt=""
              title={t.victoryEmptyTitle}
              lead={t.victoryEmptyLead}
              ctaLabel={t.victoryCta}
              ctaHref="/compte/connaissance-de-soi/tests"
              testId="evolution-empty"
            />
          ) : (
            <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[#FFFAF5] shadow-[0_18px_48px_rgba(60,40,30,0.12)]">
              <div className="grid md:grid-cols-[1.1fr_0.9fr]">
                <div className="relative min-h-[180px] md:min-h-full">
                  <Image
                    src="/library/portraits/portrait-08-4x5.webp"
                    alt=""
                    fill
                    className="object-cover object-[center_15%]"
                    sizes="(max-width:768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#FFFAF5] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-[#FFFAF5]" />
                </div>
                <div className="relative z-10 flex flex-col justify-center px-5 py-6 sm:px-7 sm:py-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c45d3e]">{t.victory}</p>
                  <p className="mt-3 font-serif text-xl italic leading-snug text-brand-ink sm:text-2xl">
                    {microVictory ?? t.victoryEmptyLead}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <ConsistencyChain streak={streak} label={t.streak} sub={t.weeks} />

            <div className="rounded-[26px] border border-white/70 bg-[#FFFAF5] p-5 shadow-[0_14px_40px_rgba(60,40,30,0.1)] sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-ink/45">{t.progress}</p>
              {currentMonth && currentMonth.sessions > 0 ? (
                <>
                  <p className="mt-3 font-serif text-3xl italic text-[#c45d3e]">
                    {currentMonth.sessions}/{currentMonth.goal}
                  </p>
                  {prevMonth ? (
                    <p className="mt-1 text-sm text-brand-ink/55">
                      {t.vs} {prevMonth.year_month} : {prevMonth.sessions}/{prevMonth.goal}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="mt-3 font-serif text-lg italic text-brand-ink/70">
                  {locale === 'es'
                    ? 'Tu primera sesión lanzará tu cadena.'
                    : 'Ta première séance lancera ta chaîne.'}
                </p>
              )}
              <Link
                href="/compte/connaissance-de-soi/progression"
                className="mt-4 inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-[#c45d3e]"
              >
                {t.open} →
              </Link>
            </div>

            <div className="rounded-[26px] border border-white/70 bg-[#FFFAF5] p-5 shadow-[0_14px_40px_rgba(60,40,30,0.1)] sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-ink/45">{t.tests}</p>
              {latestTest ? (
                <>
                  <p className="mt-3 font-medium text-brand-ink">
                    {getSelfTest(latestTest.test_slug)?.title[locale] ?? latestTest.test_slug}
                  </p>
                  <p className="mt-1 text-[11px] text-brand-ink/45">
                    {dateFmt.format(new Date(latestTest.created_at))}
                    {latestTest.test_version ? ` · ${latestTest.test_version}` : ''}
                  </p>
                  {prevSame ? (
                    <p className="mt-2 text-sm text-brand-ink/55">
                      {t.vs} {dateFmt.format(new Date(prevSame.created_at))}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="mt-3 font-serif text-lg italic text-brand-ink/70">
                  {locale === 'es'
                    ? 'Haz tu primer test — tu retrato aparecerá aquí.'
                    : 'Fais ton premier test — ton portrait apparaîtra ici.'}
                </p>
              )}
              <Link
                href="/compte/connaissance-de-soi/tests"
                className="mt-4 inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-[#c45d3e]"
              >
                {t.open} →
              </Link>
            </div>

            <div className="rounded-[26px] border border-white/70 bg-[#FFFAF5] p-5 shadow-[0_14px_40px_rgba(60,40,30,0.1)] sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-ink/45">{t.health}</p>
              {latestHealth ? (
                <>
                  <p className="mt-3 text-sm text-brand-ink">
                    {dateFmt.format(new Date(latestHealth.created_at))}
                    {healthTrend ? ` · ${healthTrend}` : ''}
                  </p>
                  <p className="mt-1 text-[11px] text-brand-ink/45">
                    {locale === 'es' ? 'Fuente' : 'Source'} : {latestHealth.source}
                  </p>
                </>
              ) : (
                <p className="mt-3 font-serif text-lg italic text-brand-ink/70">
                  {locale === 'es'
                    ? 'Nota tu primer sentir para ver tus tendencias.'
                    : 'Note ton premier ressenti pour voir tes tendances.'}
                </p>
              )}
              <Link
                href="/compte/connaissance-de-soi/corps"
                className="mt-4 inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-[#c45d3e]"
              >
                {t.open} →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </VisioLock>
  );
}
