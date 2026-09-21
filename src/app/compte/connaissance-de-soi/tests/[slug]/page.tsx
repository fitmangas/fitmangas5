import { notFound, redirect } from 'next/navigation';

import { SelfKnowledgeMemberTest } from '@/components/SelfKnowledge/compte/SelfKnowledgeMemberTest';
import { VisioLock } from '@/components/Premium/VisioLock';
import { hasVisioClientAccess } from '@/lib/access-control';
import { getClientLang, resolveFirstName } from '@/lib/compte/i18n';
import { getSelfTest, SELF_TEST_SLUGS } from '@/lib/self-knowledge/scoring';
import { listResultsForProfile } from '@/lib/self-knowledge/store';
import type { SelfTestSlug } from '@/lib/self-knowledge/types';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ slug: string }> };

function isSelfTestSlug(slug: string): slug is SelfTestSlug {
  return (SELF_TEST_SLUGS as string[]).includes(slug);
}

export default async function CompteSelfTestSlugPage({ params }: Props) {
  const { slug } = await params;
  if (!isSelfTestSlug(slug) || !getSelfTest(slug)) notFound();

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
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name')
    .eq('id', user.id)
    .maybeSingle();

  const firstName = resolveFirstName(profile?.first_name, user.user_metadata, user.email);
  const history = hasVisioAccess ? await listResultsForProfile(user.id) : [];

  return (
    <VisioLock
      hasAccess={hasVisioAccess}
      locale={locale}
      featureDescription_fr="Les analyses complètes des tests sont réservées aux membres active ou en essai."
      featureDescription_es="Los análisis completos de los tests son para miembros active o en prueba."
    >
      <SelfKnowledgeMemberTest
        lang={lang}
        slug={slug}
        email={user.email ?? ''}
        firstName={firstName}
        history={history}
      />
    </VisioLock>
  );
}
