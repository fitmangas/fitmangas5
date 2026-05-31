import { AdminViewSwitchClient } from '@/components/Admin/AdminViewSwitchClient';
import { canUseAdminViewSwitch } from '@/lib/auth/admin';
import { getDemoClientMode } from '@/lib/demo-client-mode';
import { createClient } from '@/lib/supabase/server';

export async function AdminViewSwitch() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const gate = await canUseAdminViewSwitch(supabase, user);
  if (!gate.canSwitch) return null;

  const clientView = await getDemoClientMode();
  return <AdminViewSwitchClient clientView={clientView} />;
}
