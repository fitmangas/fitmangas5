import { redirect } from 'next/navigation';

import { ClientLoginForm } from '@/components/ClientLoginForm';
import { createClient } from '@/lib/supabase/server';

export default async function ClientLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/compte');
  }

  return (
    <div className="min-h-screen bg-brand-beige px-6 py-16">
      <ClientLoginForm />
    </div>
  );
}
