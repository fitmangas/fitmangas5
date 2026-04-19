import Link from 'next/link';

import { checkIsAdmin } from '@/lib/auth/admin';
import { getDemoClientMode } from '@/lib/demo-client-mode';
import { createClient } from '@/lib/supabase/server';

export async function DemoModeBanner() {
  const demo = await getDemoClientMode();
  if (!demo) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = await checkIsAdmin(supabase, user);
  if (!admin.isAdmin) return null;

  return (
    <div className="sticky top-0 z-[400] border-b border-brand-ink/[0.05] bg-[#f3f1ed]/95 backdrop-blur-sm supports-[backdrop-filter]:bg-[#f3f1ed]/88">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1 sm:px-8">
        <p className="min-w-0 flex-1 text-left text-[10px] leading-tight text-brand-ink/42">
          <span className="font-medium text-brand-ink/58">Mode démo</span>
          <span className="mx-1.5 text-brand-ink/18">·</span>
          <span className="hidden sm:inline">Vue client simulée.</span>
          <span className="sm:hidden">Vue client.</span>
        </p>
        <Link
          href="/api/demo-mode/disable"
          className="shrink-0 rounded-full border border-brand-ink/[0.08] bg-white/90 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-ink/55 transition hover:border-brand-ink/12 hover:text-brand-ink/75"
        >
          Quitter
        </Link>
      </div>
    </div>
  );
}
