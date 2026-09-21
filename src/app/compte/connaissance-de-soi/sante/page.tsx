import { redirect } from 'next/navigation';

import { SelfKnowledgeHealthPage } from '@/components/SelfKnowledge/compte/SelfKnowledgeHealthPage';
import { VisioLock } from '@/components/Premium/VisioLock';
import { hasVisioClientAccess } from '@/lib/access-control';
import { getClientLang } from '@/lib/compte/i18n';
import { getLatestHealthConsent } from '@/lib/self-knowledge/store';
import { createClient } from '@/lib/supabase/server';

export default async function ConnaissanceDeSoiSantePage() {
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
  const consent = hasVisioAccess ? await getLatestHealthConsent(user.id) : null;

  return (
    <VisioLock
      hasAccess={hasVisioAccess}
      locale={locale}
      featureDescription_fr="Les scores bien-être indicatifs sont réservés aux membres active ou en essai."
      featureDescription_es="Los scores de bienestar indicativos son para miembros active o en prueba."
    >
      <SelfKnowledgeHealthPage lang={lang} initialConsentId={consent?.id ?? null} />
    </VisioLock>
  );
}
