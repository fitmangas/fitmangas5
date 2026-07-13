import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { CompteMobileBottomNav } from '@/components/Compte/CompteMobileBottomNav';
import { CompteSidebar } from '@/components/Compte/CompteSidebar';
import { SupportFloatingButton } from '@/components/Compte/SupportFloatingButton';
import { getClientLang } from '@/lib/compte/i18n';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function CompteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/?compte=connexion-requise');
  }
  const lang = await getClientLang(supabase, user.id);
  const { count: unreadNotifications } = await supabase
    .from('user_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null);

  return (
    <div className="luxury-shell relative min-h-screen" lang={lang}>
      <div className="luxury-bg-orbs" aria-hidden />
      <div className="luxury-grain" aria-hidden />
      <div className="relative">
        <CompteSidebar lang={lang} unreadNotifications={unreadNotifications ?? 0} />
        <CompteMobileBottomNav lang={lang} unreadNotifications={unreadNotifications ?? 0} />
        <main className="luxury-main relative z-0 pb-20 pt-2 md:pb-16 md:pl-24 md:pt-0">{children}</main>
        <SupportFloatingButton lang={lang} />
      </div>
    </div>
  );
}
