import Link from 'next/link';
import { redirect } from 'next/navigation';

import { CompteSidebar } from '@/components/Compte/CompteSidebar';
import { createClient } from '@/lib/supabase/server';

export default async function CompteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/?compte=connexion-requise');
  }

  return (
    <div className="relative min-h-screen">
      <div className="luxury-bg-orbs" aria-hidden />
      <div className="luxury-grain" aria-hidden />
      <div className="relative z-10">
        <CompteSidebar />
        <nav className="mx-4 mb-4 mt-4 md:hidden">
          <div className="glass-card flex flex-wrap gap-3 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-luxury-muted">
            <Link href="/compte" className="rounded-full px-3 py-1.5 hover:bg-white/40 hover:text-luxury-ink">
              Dashboard
            </Link>
            <Link href="/compte#planning" className="rounded-full px-3 py-1.5 hover:bg-white/40 hover:text-luxury-ink">
              Planning
            </Link>
            <Link href="/compte#replays" className="rounded-full px-3 py-1.5 hover:bg-white/40 hover:text-luxury-ink">
              Vidéos
            </Link>
            <Link href="/compte/profil" className="rounded-full px-3 py-1.5 hover:bg-white/40 hover:text-luxury-ink">
              Profil
            </Link>
          </div>
        </nav>
        <div className="px-4 pb-16 md:pl-24">{children}</div>
      </div>
    </div>
  );
}
