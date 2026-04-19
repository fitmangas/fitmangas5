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
      <CompteTopBar />
      {children}
    </div>
  );
}
