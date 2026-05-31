import { redirect } from 'next/navigation';
import { SmartCalendar } from '@/components/Calendar/SmartCalendar';
import { CompteDashboardBackLink } from '@/components/Compte/CompteDashboardBackLink';
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
      ? { area: 'Client area', title: 'My schedule', subtitle: 'All your upcoming sessions and live/replay access.', dashboard: 'Dashboard' }
      : lang === 'es'
        ? { area: 'Área cliente', title: 'Mi planificación', subtitle: 'Todas tus sesiones próximas y acceso live/replay.', dashboard: 'Dashboard' }
        : { area: 'Espace client', title: 'Mon planning', subtitle: 'Toutes tes séances à venir et accès live/replay.', dashboard: 'Dashboard' };

  await supabase
    .from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .in('kind', ['live_course', 'planning_live'])
    .is('read_at', null);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16 pt-2 md:px-8 md:pt-6">
      <CompteDashboardBackLink label={t.dashboard} className="mb-4" />
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">{t.area}</p>
        <h1 className="hero-signature-title mt-2 text-4xl md:text-5xl">{t.title}</h1>
        <p className="mt-2 text-sm text-luxury-muted">{t.subtitle}</p>
      </header>

      <section className="mt-8">
        <SmartCalendar lang={lang} />
      </section>
    </main>
  );
}
