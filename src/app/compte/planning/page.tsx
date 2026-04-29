import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SmartCalendar } from '@/components/Calendar/SmartCalendar';
import { getClientLang } from '@/lib/compte/i18n';
import { createClient } from '@/lib/supabase/server';

export default async function ComptePlanningPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/?compte=connexion-requise');
  const lang = await getClientLang(supabase, user.id);
  const t =
    lang === 'en'
      ? { area: 'Client area', title: 'My schedule', subtitle: 'All your upcoming sessions and live/replay access.', back: 'Back dashboard' }
      : lang === 'es'
        ? { area: 'Área cliente', title: 'Mi planificación', subtitle: 'Todas tus sesiones próximas y acceso live/replay.', back: 'Volver al panel' }
        : { area: 'Espace client', title: 'Mon planning', subtitle: 'Toutes tes séances à venir et accès live/replay.', back: 'Retour dashboard' };

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
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">{t.area}</p>
          <h1 className="hero-signature-title mt-2 text-4xl md:text-5xl">{t.title}</h1>
          <p className="mt-2 text-sm text-luxury-muted">{t.subtitle}</p>
        </div>
        <Link href="/compte" className="btn-luxury-ghost px-5 py-2.5 text-[10px] tracking-[0.14em]">
          ← {t.back}
        </Link>
      </header>

      <section className="mt-8">
        <SmartCalendar lang={lang} />
      </section>
    </main>
  );
}
