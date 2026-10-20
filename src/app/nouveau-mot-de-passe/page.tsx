import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { NewPasswordForm } from '@/components/Auth/NewPasswordForm';
import { RESET_TOKEN_COOKIE, RESET_VERIFIED_COOKIE } from '@/lib/auth/password-reset';

export const metadata: Metadata = {
  title: 'Nouveau mot de passe | FitMangas',
  robots: { index: false, follow: false },
};

export default async function NewPasswordPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const canSubmit =
    Boolean(cookieStore.get(RESET_TOKEN_COOKIE)?.value) || cookieStore.get(RESET_VERIFIED_COOKIE)?.value === '1';
  return (
    <div className="min-h-screen bg-brand-beige px-6 py-16">
      <NewPasswordForm lang={params.lang === 'es' ? 'es' : 'fr'} canSubmit={canSubmit} />
    </div>
  );
}
