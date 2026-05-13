import type { ReactNode } from 'react';

import { AdminViewSwitch } from '@/components/Admin/AdminViewSwitch';
import { CompteMobileBottomNav } from '@/components/Compte/CompteMobileBottomNav';
import { CompteSidebar } from '@/components/Compte/CompteSidebar';
import { getClientLang } from '@/lib/compte/i18n';
import { createClient } from '@/lib/supabase/server';

export default async function BlogLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const lang = user ? await getClientLang(supabase, user.id) : 'fr';

  return (
    <div className="luxury-shell relative min-h-screen" lang={lang}>
      <div className="luxury-bg-orbs" aria-hidden />
      <div className="luxury-grain" aria-hidden />
      <div className="relative z-10">
        {user ? (
          <>
            <CompteSidebar lang={lang} />
            <AdminViewSwitch />
            <CompteMobileBottomNav lang={lang} />
          </>
        ) : null}
        <div className={user ? 'px-4 pb-28 md:pb-16 md:pl-24' : ''}>{children}</div>
      </div>
    </div>
  );
}
