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
    <div className="min-h-screen bg-gradient-to-b from-brand-beige via-brand-beige to-brand-sand/30">
      <CompteTopBar />
      {children}
    </div>
  );
}
