import Link from 'next/link';
import { redirect } from 'next/navigation';

import { CompteDashboardBackLink } from '@/components/Compte/CompteDashboardBackLink';
import { SelfKnowledgeHubNav } from '@/components/SelfKnowledge/compte/SelfKnowledgeHubNav';
import { VisioLock } from '@/components/Premium/VisioLock';
import { GlassCard } from '@/components/ui/GlassCard';
import { hasVisioClientAccess } from '@/lib/access-control';
import { getClientLang } from '@/lib/compte/i18n';
import {
  computeConsistencyStreak,
  listMemberProgressHistory,
} from '@/lib/self-knowledge/progress-monthly';
import { getSelfTest } from '@/lib/self-knowledge/scoring';
import { listHealthEntries, listJournalEntries, listResultsForProfile } from '@/lib/self-knowledge/store';
import { createClient } from '@/lib/supabase/server';

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
          title: 'Conocimiento de una misma',
          dashboard: 'Panel',
          lead: 'Tú frente a ti misma — el camino recorrido, sin compararte con nadie.',
          streak: 'Cadena de constancia',
          weeks: 'semana(s) seguidas con al menos una práctica',
          victory: 'Tu micro-victoria',
          noVictory: 'Haz un test, una sesión o una entrada de diario — tu primera victoria te espera.',
          tests: 'Último avance en tests',
          health: 'Tendencia bienestar',
          progress: 'Constancia reciente',
          open: 'Abrir',
          vs: 'vs',
          none: 'Aún no hay datos.',
          better: 'en progreso',
          steady: 'estable',
        }
      : {
          title: 'Connaissance de soi',
          dashboard: 'Dashboard',
          lead: 'Toi face à toi-même — le chemin parcouru, sans te comparer à personne.',
          streak: 'Chaîne de constance',
          weeks: 'semaine(s) d’affilée avec au moins une pratique',
          victory: 'Ta micro-victoire',
          noVictory: 'Passe un test, suis un cours ou note une entrée de journal — ta première victoire t’attend.',
          tests: 'Dernière avancée tests',
          health: 'Tendance bien-être',
          progress: 'Constance récente',
          open: 'Ouvrir',
          vs: 'vs',
          none: 'Pas encore de données.',
          better: 'en progrès',
          steady: 'stable',
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
    microVictory = latestTest.analysis_teaser.slice(0, 140);
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

  return (
    <VisioLock
      hasAccess={hasVisioAccess}
      locale={locale}
      featureDescription_fr="L’univers connaissance de soi est réservé aux membres active ou en essai."
      featureDescription_es="El universo de conocimiento de una misma es para miembros active o en prueba."
    >
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-2 md:px-8 md:pt-6">
        <CompteDashboardBackLink label={t.dashboard} className="mb-4" />
        <header>
          <h1 className="hero-signature-title text-4xl md:text-5xl">{t.title}</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-luxury-muted">{t.lead}</p>
        </header>
        <SelfKnowledgeHubNav lang={lang} active="evolution" />

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <GlassCard className="p-5 md:p-6 md:col-span-2" elevated>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c45d3e]">{t.victory}</p>
            <p className="mt-3 font-serif text-xl italic leading-snug text-luxury-ink md:text-2xl">
              {microVictory ?? t.noVictory}
            </p>
          </GlassCard>

          <GlassCard className="p-5 md:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">{t.streak}</p>
            <p className="mt-3 font-serif text-4xl italic text-[#c45d3e]">{streak}</p>
            <p className="mt-1 text-sm text-luxury-muted">{t.weeks}</p>
          </GlassCard>

          <GlassCard className="p-5 md:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">{t.progress}</p>
            {currentMonth ? (
              <>
                <p className="mt-3 text-lg font-semibold text-luxury-ink">
                  {currentMonth.sessions}/{currentMonth.goal}{' '}
                  {locale === 'es' ? 'sesiones' : 'séances'}
                </p>
                {prevMonth ? (
                  <p className="mt-1 text-sm text-luxury-muted">
                    {t.vs} {prevMonth.year_month} : {prevMonth.sessions}/{prevMonth.goal}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="mt-3 text-sm text-luxury-muted">{t.none}</p>
            )}
            <Link
              href="/compte/connaissance-de-soi/progression"
              className="mt-4 inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-[#c45d3e]"
            >
              {t.open} →
            </Link>
          </GlassCard>

          <GlassCard className="p-5 md:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">{t.tests}</p>
            {latestTest ? (
              <>
                <p className="mt-3 font-medium text-luxury-ink">
                  {getSelfTest(latestTest.test_slug)?.title[locale] ?? latestTest.test_slug}
                </p>
                <p className="mt-1 text-[11px] text-luxury-soft">
                  {dateFmt.format(new Date(latestTest.created_at))}
                  {latestTest.test_version ? ` · ${latestTest.test_version}` : ''}
                </p>
                {prevSame ? (
                  <p className="mt-2 text-sm text-luxury-muted">
                    {t.vs} {dateFmt.format(new Date(prevSame.created_at))}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="mt-3 text-sm text-luxury-muted">{t.none}</p>
            )}
            <Link
              href="/compte/connaissance-de-soi/tests"
              className="mt-4 inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-[#c45d3e]"
            >
              {t.open} →
            </Link>
          </GlassCard>

          <GlassCard className="p-5 md:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">{t.health}</p>
            {latestHealth ? (
              <>
                <p className="mt-3 text-sm text-luxury-ink">
                  {dateFmt.format(new Date(latestHealth.created_at))}
                  {healthTrend ? ` · ${healthTrend}` : ''}
                </p>
                <p className="mt-1 text-[11px] text-luxury-soft">
                  {locale === 'es' ? 'Fuente' : 'Source'} : {latestHealth.source}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-luxury-muted">{t.none}</p>
            )}
            <Link
              href="/compte/connaissance-de-soi/corps"
              className="mt-4 inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-[#c45d3e]"
            >
              {t.open} →
            </Link>
          </GlassCard>
        </section>
      </main>
    </VisioLock>
  );
}
