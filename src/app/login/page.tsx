import { redirect } from 'next/navigation';
import { AdminLoginForm } from '@/components/AdminLoginForm';
import { resolvePostLoginPath } from '@/lib/auth/post-login-redirect';
import { createClient } from '@/lib/supabase/server';

function getInitialError(error?: string) {
  if (error === 'forbidden') return 'Ton compte est connecté, mais il n’a pas les droits administrateur.';
  if (error === 'auth') return 'Connexion requise.';
  return '';
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const path = await resolvePostLoginPath(supabase, user);
    if (path === '/admin') {
      redirect('/admin');
    }
  }

  const params = await searchParams;

  return (
    <div className="min-h-screen bg-brand-beige px-6 py-16">
      <AdminLoginForm initialError={getInitialError(params.error)} />
      <p className="mx-auto mt-6 max-w-md text-center text-xs text-brand-ink/55">
        Espace cliente ?{' '}
        <a href="/connexion" className="font-semibold text-brand-accent underline underline-offset-2">
          Connexion membre
        </a>
      </p>
    </div>
  );
}
