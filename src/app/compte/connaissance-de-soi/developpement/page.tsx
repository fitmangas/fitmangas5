import { redirect } from 'next/navigation';

import { CompteDashboardBackLink } from '@/components/Compte/CompteDashboardBackLink';
import { DeveloppementPersoView } from '@/components/SelfKnowledge/compte/DeveloppementPersoView';
import { SelfKnowledgeHubNav } from '@/components/SelfKnowledge/compte/SelfKnowledgeHubNav';
import { VisioLock } from '@/components/Premium/VisioLock';
import { hasVisioClientAccess } from '@/lib/access-control';
import { getClientLang } from '@/lib/compte/i18n';
import { listJournalEntries, listReadingResources } from '@/lib/self-knowledge/store';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export default async function DeveloppementPage() {
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

  const admin = createAdminClient();
  const [journal, resources, promptsRes, challengesRes, completionsRes] = hasVisioAccess
    ? await Promise.all([
        listJournalEntries(user.id, 15),
        listReadingResources(locale),
        admin
          .from('reflection_prompts')
          .select('id, slug, title_fr, title_es, body_fr, body_es')
          .eq('published', true)
          .order('sort_order'),
        admin
          .from('soft_challenges')
          .select('id, slug, title_fr, title_es, body_fr, body_es')
          .eq('published', true)
          .order('sort_order'),
        admin.from('challenge_completions').select('challenge_id').eq('profile_id', user.id),
      ])
    : [[], [], { data: [] }, { data: [] }, { data: [] }];

  const done = new Set((completionsRes.data ?? []).map((c: { challenge_id: string }) => c.challenge_id));
  const challenges = (challengesRes.data ?? []).map((c: {
    id: string;
    slug: string;
    title_fr: string;
    title_es: string;
    body_fr: string;
    body_es: string;
  }) => ({
    ...c,
    completed: done.has(c.id),
  }));

  const t =
    locale === 'es'
      ? {
          title: 'Desarrollo personal',
          dashboard: 'Panel',
          lead: 'Diario, reflexiones suaves y club de lectura — sin juicio.',
        }
      : {
          title: 'Développement personnel',
          dashboard: 'Dashboard',
          lead: 'Journal, réflexions douces et club de lecture — sans jugement.',
        };

  return (
    <VisioLock
      hasAccess={hasVisioAccess}
      locale={locale}
      featureDescription_fr="Le développement personnel est réservé aux membres active ou en essai."
      featureDescription_es="El desarrollo personal es para miembros active o en prueba."
    >
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-2 md:px-8 md:pt-6">
        <CompteDashboardBackLink label={t.dashboard} className="mb-4" />
        <header>
          <h1 className="hero-signature-title text-4xl md:text-5xl">{t.title}</h1>
          <p className="mt-3 max-w-xl text-sm text-luxury-muted">{t.lead}</p>
        </header>
        <SelfKnowledgeHubNav lang={lang} active="developpement" />
        <DeveloppementPersoView
          lang={lang}
          journal={journal}
          prompts={promptsRes.data ?? []}
          challenges={challenges}
          resources={resources}
        />
      </main>
    </VisioLock>
  );
}
