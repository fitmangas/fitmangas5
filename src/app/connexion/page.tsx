import { redirect } from 'next/navigation';

import { ClientLoginForm } from '@/components/ClientLoginForm';
import { resolvePostLoginPath } from '@/lib/auth/post-login-redirect';
import { createClient } from '@/lib/supabase/server';

export default async function ClientLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(await resolvePostLoginPath(supabase, user));
  }

  return (
    <div className="min-h-screen bg-brand-beige px-6 py-16">
      <ClientLoginForm />
      <p className="mx-auto mt-6 max-w-md text-center text-xs text-brand-ink/55">
        Accès administrateur ?{' '}
        <a href="/login" className="font-semibold text-brand-accent underline underline-offset-2">
          Connexion admin
        </a>
      </p>
    </div>
  );
}
