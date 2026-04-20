import { redirect } from 'next/navigation';

import { CompteTopBar } from '@/components/Compte/CompteTopBar';
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
        <CompteTopBar />
        {children}
      </div>
    </div>
  );
}
