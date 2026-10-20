import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { CompteMobileBottomNav } from '@/components/Compte/CompteMobileBottomNav';
import { CompteSidebar } from '@/components/Compte/CompteSidebar';
import { comptePlanLabel, getClientLang } from '@/lib/compte/i18n';
import { getUserTier } from '@/lib/access-control';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
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
  const navProfile = user
    ? (await supabase.from('profiles').select('first_name, last_name, avatar_url').eq('id', user.id).maybeSingle()).data
    : null;
  const tier = user ? await getUserTier(user.id).catch(() => null) : null;

  return (
    <div className="luxury-shell relative min-h-screen" lang={lang}>
      <div className="luxury-bg-orbs" aria-hidden />
      <div className="luxury-grain" aria-hidden />
      <div className="relative z-10">
        {user ? (
          <>
            <CompteSidebar lang={lang} unreadNotifications={unreadNotifications} />
            <CompteMobileBottomNav
              lang={lang}
              unreadNotifications={unreadNotifications}
              firstName={navProfile?.first_name ?? null}
              lastName={navProfile?.last_name ?? null}
              avatarUrl={navProfile?.avatar_url ?? null}
              planLabel={comptePlanLabel(tier, lang)}
            />
          </>
        ) : null}
        <main className={user ? 'luxury-main pb-32 pt-24 md:pb-16 md:pt-0 md:pl-24' : ''}>{children}</main>
      </div>
    </div>
  );
}
