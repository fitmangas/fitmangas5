import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { LevelTestPage } from '@/components/Programmes/LevelTestPage';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { loadPublicProgramCards } from '@/lib/programmes/catalog-view';
import { createClient } from '@/lib/supabase/server';
import { hasVisioClientAccess } from '@/lib/access-control';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Test de niveau : quel programme de Pilates est fait pour toi ?',
  description: '3 questions, 2 minutes : on te dit par où commencer parmi les programmes d’Alejandra. Gratuit, sans compte, sans email.',
  alternates: { canonical: '/test-niveau' },
};

export default async function TestNiveauPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  if (!isProgrammesEnabled()) notFound();
  const sp = await searchParams;
  const [fr, es] = await Promise.all([loadPublicProgramCards('fr'), loadPublicProgramCards('es')]);
  let member = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) member = await hasVisioClientAccess(user.id);
  } catch {
    member = false;
  }
  return <LevelTestPage initialLang={sp.lang === 'es' ? 'es' : 'fr'} programs={{ fr, es }} member={member} />;
}
