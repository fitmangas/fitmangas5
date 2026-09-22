import { redirect } from 'next/navigation';

import { CompteDashboardBackLink } from '@/components/Compte/CompteDashboardBackLink';
import { SelfKnowledgeHubNav } from '@/components/SelfKnowledge/compte/SelfKnowledgeHubNav';
import { SelfKnowledgeTestsPanel } from '@/components/SelfKnowledge/compte/SelfKnowledgeTestsPanel';
import { VisioLock } from '@/components/Premium/VisioLock';
import { hasVisioClientAccess } from '@/lib/access-control';
import { getClientLang } from '@/lib/compte/i18n';
import { listResultsForProfile } from '@/lib/self-knowledge/store';
import { createClient } from '@/lib/supabase/server';

export default async function ConnaissanceDeSoiTestsPage() {
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
  const history = hasVisioAccess ? await listResultsForProfile(user.id) : [];

  const t =
    locale === 'es'
      ? { title: 'Mis tests', dashboard: 'Panel', lead: 'Historial datado — rehacer y comparar contigo misma.' }
      : {
          title: 'Mes tests',
          dashboard: 'Dashboard',
          lead: 'Historique daté — refaire et te comparer à toi-même.',
        };

  return (
    <VisioLock
      hasAccess={hasVisioAccess}
      locale={locale}
      featureDescription_fr="Les tests complets sont réservés aux membres active ou en essai."
      featureDescription_es="Los tests completos son para miembros active o en prueba."
    >
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-2 md:px-8 md:pt-6">
        <CompteDashboardBackLink label={t.dashboard} className="mb-4" />
        <header>
          <h1 className="hero-signature-title text-4xl md:text-5xl">{t.title}</h1>
          <p className="mt-3 max-w-xl text-sm text-luxury-muted">{t.lead}</p>
        </header>
        <SelfKnowledgeHubNav lang={lang} active="tests" />
        <SelfKnowledgeTestsPanel lang={lang} history={history} />
      </main>
    </VisioLock>
  );
}
