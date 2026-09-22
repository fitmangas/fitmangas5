import { redirect } from 'next/navigation';

import { CompteDashboardBackLink } from '@/components/Compte/CompteDashboardBackLink';
import { CorpsSanteView } from '@/components/SelfKnowledge/compte/CorpsSanteView';
import { SelfKnowledgeHubNav } from '@/components/SelfKnowledge/compte/SelfKnowledgeHubNav';
import { VisioLock } from '@/components/Premium/VisioLock';
import { hasVisioClientAccess } from '@/lib/access-control';
import { getClientLang } from '@/lib/compte/i18n';
import { getLatestHealthConsent, listHealthEntries } from '@/lib/self-knowledge/store';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export default async function ConnaissanceCorpsPage() {
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

  let consentId: string | null = null;
  let entries: Awaited<ReturnType<typeof listHealthEntries>> = [];
  let stravaConnected = false;
  let fitbitConnected = false;

  if (hasVisioAccess) {
    const consent = await getLatestHealthConsent(user.id);
    consentId = consent?.id ?? null;
    entries = await listHealthEntries(user.id, 30);
    const admin = createAdminClient();
    const { data: connections } = await admin
      .from('wearable_connections')
      .select('provider, status')
      .eq('profile_id', user.id);
    for (const c of connections ?? []) {
      if (c.provider === 'strava' && c.status === 'connected') stravaConnected = true;
      if (c.provider === 'fitbit' && c.status === 'connected') fitbitConnected = true;
    }
  }

  return (
    <VisioLock
      hasAccess={hasVisioAccess}
      locale={locale}
      featureDescription_fr="Les scores bien-être sont réservés aux membres active ou en essai."
      featureDescription_es="Los scores de bienestar son para miembros active o en prueba."
    >
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-2 md:px-8 md:pt-6">
        <CompteDashboardBackLink
          label={locale === 'es' ? 'Panel' : 'Dashboard'}
          className="mb-4"
        />
        <SelfKnowledgeHubNav lang={lang} active="corps" />
        <CorpsSanteView
          lang={lang}
          initialConsentId={consentId}
          entries={entries}
          stravaConnected={stravaConnected}
          fitbitConnected={fitbitConnected}
        />
      </main>
    </VisioLock>
  );
}
