import { notFound } from 'next/navigation';

import { CatalogClient } from '@/components/Programmes/CatalogClient';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { loadCatalogView } from '@/lib/programmes/catalog-view';
import { loadPlanningContext } from '@/lib/compte/planning-context';
import { getClientLang } from '@/lib/compte/i18n';
import { createClient } from '@/lib/supabase/server';
import { hasVisioClientAccess } from '@/lib/access-control';

export const dynamic = 'force-dynamic';

export default async function ProgrammesCatalogPage() {
  if (!isProgrammesEnabled()) notFound();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();
  if (!(await hasVisioClientAccess(user.id))) notFound();
  const lang = (await getClientLang(supabase, user.id)) === 'es' ? 'es' : 'fr';
  const { timeZone } = await loadPlanningContext(supabase, user.id);
  const view = await loadCatalogView(user.id, lang, timeZone);
  return <CatalogClient view={view} />;
}
