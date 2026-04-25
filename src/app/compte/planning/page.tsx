import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SmartCalendar } from '@/components/Calendar/SmartCalendar';
import { createClient } from '@/lib/supabase/server';

export default async function ComptePlanningPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/?compte=connexion-requise');

  await supabase
    .from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .in('kind', ['live_course', 'planning_live'])
    .is('read_at', null);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16 pt-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">Espace client</p>
          <h1 className="hero-signature-title mt-2 text-4xl md:text-5xl">Mon planning</h1>
          <p className="mt-2 text-sm text-luxury-muted">Toutes tes séances à venir et accès live/replay.</p>
        </div>
        <Link href="/compte" className="btn-luxury-ghost px-5 py-2.5 text-[10px] tracking-[0.14em]">
          ← Retour dashboard
        </Link>
      </header>

      <section className="mt-8">
        <SmartCalendar />
      </section>
    </main>
  );
}
