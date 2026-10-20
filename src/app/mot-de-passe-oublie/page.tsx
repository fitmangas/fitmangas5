import type { Metadata } from 'next';

import { ForgotPasswordForm } from '@/components/Auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; erreur?: string }>;
}) {
  const params = await searchParams;
  const lang = params.lang === 'es' ? 'es' : 'fr';
  return (
    <div className="min-h-screen bg-brand-beige px-6 py-16">
      <ForgotPasswordForm lang={lang} linkError={params.erreur === 'lien'} />
    </div>
  );
}
