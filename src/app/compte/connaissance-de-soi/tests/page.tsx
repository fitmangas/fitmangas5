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

  return (
    <VisioLock
      hasAccess={hasVisioAccess}
      locale={locale}
      featureDescription_fr="Les tests complets sont réservés aux membres active ou en essai."
      featureDescription_es="Los tests completos son para miembros active o en prueba."
    >
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-2 md:px-8 md:pt-6">
        <CompteDashboardBackLink
          label={locale === 'es' ? 'Panel' : 'Dashboard'}
          className="mb-4"
        />
        <SelfKnowledgeHubNav lang={lang} active="tests" />
        <SelfKnowledgeTestsPanel lang={lang} history={history} />
      </main>
    </VisioLock>
  );
}
