import { notFound } from 'next/navigation';

import { CatalogClient } from '@/components/Programmes/CatalogClient';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { createClient } from '@/lib/supabase/server';
import { hasVisioClientAccess } from '@/lib/access-control';

export default async function ProgrammesCatalogPage() {
  if (!isProgrammesEnabled()) notFound();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();
  if (!(await hasVisioClientAccess(user.id))) notFound();
  return <CatalogClient />;
}
