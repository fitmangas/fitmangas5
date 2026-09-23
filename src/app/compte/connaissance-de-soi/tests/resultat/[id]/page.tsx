import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { SelfKnowledgeHubNav } from '@/components/SelfKnowledge/compte/SelfKnowledgeHubNav';
import { SelfTestReport } from '@/components/SelfKnowledge/SelfTestReport';
import { VisioLock } from '@/components/Premium/VisioLock';
import { hasVisioClientAccess } from '@/lib/access-control';
import { getClientLang } from '@/lib/compte/i18n';
import { buildTemplateAnalysis } from '@/lib/self-knowledge/analyze';
import { getSelfTest } from '@/lib/self-knowledge/scoring';
import { getResultByIdForProfile } from '@/lib/self-knowledge/store';
import type { SelfTestScores, SelfTestSlug } from '@/lib/self-knowledge/types';
import { createClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ id: string }>;
};

/** Rapport web complet d’une passation membre + bouton PDF. */
export default async function CompteSelfTestResultPage({ params }: Props) {
  const { id } = await params;
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

  if (!hasVisioAccess) {
    return (
      <VisioLock
        hasAccess={false}
        locale={locale}
        featureDescription_fr="L’univers connaissance de soi est réservé aux membres active ou en essai."
        featureDescription_es="El universo de conocimiento de una misma es para miembros active o en prueba."
      >
        <main className="mx-auto max-w-5xl px-5 pb-16 pt-6" />
      </VisioLock>
    );
  }

  const row = await getResultByIdForProfile(user.id, id);
  if (!row) notFound();

  const format =
    row.test_slug === 'big-five'
      ? (row.test_version ?? '').includes('120')
        ? 'ipip-120'
        : 'ipip-50'
      : undefined;
  const test = getSelfTest(row.test_slug as SelfTestSlug, format);
  if (!test) notFound();

  const analysis = buildTemplateAnalysis(test, row.scores as SelfTestScores, locale);

  return (
    <VisioLock
      hasAccess
      locale={locale}
      featureDescription_fr="L’univers connaissance de soi est réservé aux membres active ou en essai."
      featureDescription_es="El universo de conocimiento de una misma es para miembros active o en prueba."
    >
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-2 sm:px-5 md:px-8 md:pt-6">
        <Link
          href="/compte/connaissance-de-soi/tests"
          className="mb-3 inline-flex text-xs text-luxury-muted underline underline-offset-4"
        >
          ← {locale === 'es' ? 'Mis tests' : 'Mes tests'}
        </Link>
        <SelfKnowledgeHubNav lang={lang} active="tests" />
        <div className="mt-4" data-testid="member-result-report">
          <SelfTestReport
            locale={locale}
            test={test}
            scores={row.scores as SelfTestScores}
            analysis={analysis}
            trialHref="/compte/connaissance-de-soi/tests"
            hubHref="/compte/connaissance-de-soi/tests"
            showFull
            firstName={row.first_name}
          />
        </div>
      </main>
    </VisioLock>
  );
}
