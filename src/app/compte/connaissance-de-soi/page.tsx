import Link from 'next/link';
import { redirect } from 'next/navigation';

import { CompteDashboardBackLink } from '@/components/Compte/CompteDashboardBackLink';
import { VisioLock } from '@/components/Premium/VisioLock';
import { GlassCard } from '@/components/ui/GlassCard';
import { hasVisioClientAccess } from '@/lib/access-control';
import { getClientLang } from '@/lib/compte/i18n';
import { getSelfTest, SELF_TEST_SLUGS } from '@/lib/self-knowledge/scoring';
import { listReadingResources, listResultsForProfile } from '@/lib/self-knowledge/store';
import { createClient } from '@/lib/supabase/server';

export default async function ConnaissanceDeSoiPage() {
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
  const results = hasVisioAccess ? await listResultsForProfile(user.id) : [];
  const resources = hasVisioAccess ? await listReadingResources(locale) : [];

  const t =
    lang === 'es'
      ? {
          title: 'Conocimiento de uno mismo',
          dashboard: 'Panel',
          tests: 'Tests disponibles',
          history: 'Tu historial',
          emptyHistory: 'Aún no has hecho un test.',
          start: 'Empezar',
          health: 'Bienestar indicativo',
          healthLead: 'Sueño, FC, VFC, minutos activos — scores orientativos.',
          reading: 'Club de lectura',
          readingEmpty: 'Recursos próximamente.',
          open: 'Abrir',
        }
      : lang === 'en'
        ? {
            title: 'Self-knowledge',
            dashboard: 'Dashboard',
            tests: 'Available tests',
            history: 'Your history',
            emptyHistory: 'No tests yet.',
            start: 'Start',
            health: 'Indicative wellness',
            healthLead: 'Sleep, HR, HRV, active minutes — indicative scores.',
            reading: 'Reading club',
            readingEmpty: 'Resources coming soon.',
            open: 'Open',
          }
        : {
            title: 'Connaissance de soi',
            dashboard: 'Dashboard',
            tests: 'Tests disponibles',
            history: 'Ton historique',
            emptyHistory: 'Tu n’as pas encore passé de test.',
            start: 'Commencer',
            health: 'Bien-être indicatif',
            healthLead: 'Sommeil, FC, VFC, minutes actives — scores indicatifs.',
            reading: 'Club de lecture',
            readingEmpty: 'Ressources bientôt disponibles.',
            open: 'Ouvrir',
          };

  const dateFmt = new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <VisioLock
      hasAccess={hasVisioAccess}
      locale={locale}
      featureDescription_fr="L’univers connaissance de soi (tests, scores, lecture) est réservé aux membres active ou en essai."
      featureDescription_es="El universo de conocimiento de uno mismo (tests, scores, lectura) es para miembros active o en prueba."
    >
    <main className="mx-auto max-w-5xl px-5 pb-16 pt-2 md:px-8 md:pt-6">
      <CompteDashboardBackLink label={t.dashboard} className="mb-4" />
      <header>
        <h1 className="hero-signature-title text-4xl md:text-5xl">{t.title}</h1>
      </header>

      <section className="mt-10">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">{t.tests}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {SELF_TEST_SLUGS.map((slug) => {
            const test = getSelfTest(slug);
            if (!test) return null;
            return (
              <GlassCard key={slug} className="flex flex-col p-5 md:p-6">
                <h3 className="text-lg font-semibold text-luxury-ink">{test.title[locale]}</h3>
                <p className="mt-2 flex-1 text-sm text-luxury-muted">{test.description[locale]}</p>
                <p className="mt-2 text-[11px] text-luxury-soft">
                  ~{test.durationMin} min · {test.items.length} {locale === 'es' ? 'preg.' : 'quest.'}
                </p>
                <Link
                  href={`/compte/connaissance-de-soi/tests/${slug}`}
                  className="btn-luxury-primary mt-4 inline-flex w-fit px-5 py-2.5 text-[11px] tracking-[0.12em]"
                >
                  {t.start}
                </Link>
              </GlassCard>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">{t.history}</h2>
        {results.length === 0 ? (
          <p className="mt-4 text-sm text-luxury-muted">{t.emptyHistory}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {results.slice(0, 8).map((row) => {
              const test = getSelfTest(row.test_slug);
              return (
                <GlassCard key={row.id} className="p-4 md:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-luxury-ink">
                      {test?.title[locale] ?? row.test_slug}
                    </p>
                    <span className="text-[11px] text-luxury-soft">{dateFmt.format(new Date(row.created_at))}</span>
                  </div>
                  {row.analysis_teaser ? (
                    <p className="mt-2 line-clamp-2 text-sm text-luxury-muted">{row.analysis_teaser}</p>
                  ) : null}
                  <Link
                    href={`/compte/connaissance-de-soi/tests/${row.test_slug}`}
                    className="mt-3 inline-block text-[11px] font-semibold uppercase tracking-[0.12em] text-luxury-muted underline underline-offset-2"
                  >
                    {t.open}
                  </Link>
                </GlassCard>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-12">
        <GlassCard className="p-5 md:p-6">
          <h2 className="text-lg font-semibold text-luxury-ink">{t.health}</h2>
          <p className="mt-2 text-sm text-luxury-muted">{t.healthLead}</p>
          <Link
            href="/compte/connaissance-de-soi/sante"
            className="btn-luxury-primary mt-4 inline-flex px-5 py-2.5 text-[11px] tracking-[0.12em]"
          >
            {t.open} →
          </Link>
        </GlassCard>
      </section>

      <section className="mt-12">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">{t.reading}</h2>
        {resources.length === 0 ? (
          <p className="mt-4 text-sm text-luxury-muted">{t.readingEmpty}</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {resources.map((r) => (
              <GlassCard key={r.id} className="p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-luxury-soft">{r.theme}</p>
                <h3 className="mt-1 font-medium text-luxury-ink">{r.title}</h3>
                <p className="mt-0.5 text-xs text-luxury-muted">{r.author}</p>
                {r.why_text ? <p className="mt-2 text-sm text-luxury-muted">{r.why_text}</p> : null}
              </GlassCard>
            ))}
          </div>
        )}
      </section>
    </main>
    </VisioLock>
  );
}
