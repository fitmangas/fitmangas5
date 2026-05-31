import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AdminViewSwitch } from '@/components/Admin/AdminViewSwitch';
import { CompteMobileBottomNav } from '@/components/Compte/CompteMobileBottomNav';
import { CompteSidebar } from '@/components/Compte/CompteSidebar';
import { getClientLang } from '@/lib/compte/i18n';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function BlogLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const lang = user ? await getClientLang(supabase, user.id) : 'fr';
  const unreadNotifications = user
    ? (
        await supabase
          .from('user_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('read_at', null)
      ).count ?? 0
    : 0;

  return (
    <div className="luxury-shell relative min-h-screen" lang={lang}>
      <div className="luxury-bg-orbs" aria-hidden />
      <div className="luxury-grain" aria-hidden />
      <div className="relative z-10">
        {user ? (
          <>
            <CompteSidebar lang={lang} unreadNotifications={unreadNotifications} />
            <AdminViewSwitch />
            <CompteMobileBottomNav lang={lang} unreadNotifications={unreadNotifications} />
          </>
        ) : null}
        <main className={user ? 'luxury-main pb-16 pt-24 md:pb-16 md:pl-24 md:pt-0' : ''}>{children}</main>
      </div>
    </div>
  );
}
