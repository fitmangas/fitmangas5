import { NextResponse } from 'next/server';

import { checkIsAdmin } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ total: 0 }, { status: 401 });

  const adminCheck = await checkIsAdmin(supabase, user);
  if (!adminCheck.isAdmin) return NextResponse.json({ total: 0 }, { status: 403 });

  const admin = createAdminClient();

  const [{ count: tickets }, { count: notifications }] = await Promise.all([
    admin.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    admin
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null),
  ]);

  const t = tickets ?? 0;
  const n = notifications ?? 0;
  return NextResponse.json({ tickets: t, notifications: n, total: t + n });
}
