import Link from 'next/link';

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
  return (
    <Link
      href={clientView ? '/api/demo-mode/disable' : '/api/demo-mode/enable'}
      className="fixed bottom-5 right-4 z-[220] rounded-full border border-white/70 bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-luxury-ink shadow-[0_14px_36px_rgba(15,23,42,0.18)] backdrop-blur transition hover:-translate-y-0.5 hover:border-luxury-orange/40 md:right-5 md:bg-white/85"
      title={clientView ? 'Revenir au dashboard admin' : 'Voir l’espace client'}
    >
      {clientView ? 'Vue client' : 'Vue admin'}
    </Link>
  );
}
