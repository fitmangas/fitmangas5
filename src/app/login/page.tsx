import { redirect } from 'next/navigation';
import { AdminLoginForm } from '@/components/AdminLoginForm';
import { checkIsAdmin } from '@/lib/auth/admin';
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
    const adminCheck = await checkIsAdmin(supabase, user);
    if (adminCheck.isAdmin) {
      redirect('/admin');
    }
  }

  const params = await searchParams;

  return (
    <div className="min-h-screen bg-brand-beige px-6 py-16">
      <AdminLoginForm initialError={getInitialError(params.error)} />
    </div>
  );
}
