import { redirect } from 'next/navigation';

import { AdminMfaClient } from '@/components/Admin/AdminMfaClient';
import { checkIsAdmin } from '@/lib/auth/admin';
import { checkAdminMfa, isAdminMfaRequired } from '@/lib/auth/admin-mfa';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminMfaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?error=auth');
  const adminCheck = await checkIsAdmin(supabase, user);
  if (!adminCheck.isAdmin) redirect('/login?error=forbidden');
  if (!isAdminMfaRequired() || (await checkAdminMfa(supabase)).ok) redirect('/admin');

  return (
    <div className="luxury-shell admin-area relative min-h-screen">
      <div className="luxury-bg-orbs" aria-hidden />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
        <AdminMfaClient email={user.email ?? ''} />
      </div>
    </div>
  );
}
