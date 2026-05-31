import Link from 'next/link';
import { Suspense } from 'react';
import { BellRing } from 'lucide-react';

import { AdminInboxTabs } from '@/components/Admin/AdminInboxTabs';
import {
  MarkAllNotificationsReadButton,
  MarkNotificationReadButton,
  ResolveTicketButton,
} from '@/components/Admin/AdminInboxActions';
import { ClientAvatar } from '@/components/Admin/ClientAvatar';
import { GlassCard } from '@/components/ui/GlassCard';
import { requireAdmin } from '@/lib/auth/require-admin';
import {
  DEFAULT_NOTIFICATION_RUNTIME_SETTINGS,
  getNotificationRuntimeSettings,
} from '@/lib/notifications/settings';
import { createAdminClient } from '@/lib/supabase/admin';

const TYPE_LABELS: Record<string, string> = {
  bug: 'Bug technique',
  question: 'Question',
  suggestion: 'Suggestion',
  other: 'Autre',
};

export default async function AdminInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const params = await searchParams;
  const tab = params.tab === 'notifications' || params.tab === 'settings' ? params.tab : 'tickets';

  const [{ data: tickets }, { data: notifications }, { count: ticketCount }, { count: notifCount }] =
    await Promise.all([
      admin
        .from('support_tickets')
        .select('id, user_id, type, message, status, created_at')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(100),
      admin
        .from('user_notifications')
        .select('id, kind, title, body, created_at, read_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      admin.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      admin
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null),
    ]);

  const userIds = [...new Set((tickets ?? []).map((t) => t.user_id))];
  const { data: profiles } = userIds.length
    ? await admin.from('profiles').select('id, first_name, last_name, avatar_url').in('id', userIds)
    : { data: [] as { id: string; first_name: string | null; last_name: string | null; avatar_url: string | null }[] };

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const settings = getNotificationRuntimeSettings();
  const settingsRows = [
    { label: 'Cap email / jour', env: 'NOTIFICATION_EMAIL_DAILY_CAP', current: settings.emailDailyCap, fallback: DEFAULT_NOTIFICATION_RUNTIME_SETTINGS.emailDailyCap },
    { label: 'Cap in-app non lues / jour', env: 'NOTIFICATION_INAPP_UNREAD_DAILY_CAP', current: settings.inAppUnreadDailyCap, fallback: DEFAULT_NOTIFICATION_RUNTIME_SETTINGS.inAppUnreadDailyCap },
    { label: 'Début mode silence', env: 'NOTIFICATION_QUIET_HOURS_START', current: `${settings.quietHoursStart}h`, fallback: `${DEFAULT_NOTIFICATION_RUNTIME_SETTINGS.quietHoursStart}h` },
    { label: 'Fin mode silence', env: 'NOTIFICATION_QUIET_HOURS_END', current: `${settings.quietHoursEnd}h`, fallback: `${DEFAULT_NOTIFICATION_RUNTIME_SETTINGS.quietHoursEnd}h` },
  ];

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-2 py-6 md:px-0 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">Centre de messages</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-luxury-ink">Inbox</h1>
          <p className="mt-2 text-sm text-luxury-muted">Tickets clientes et alertes en un seul endroit.</p>
        </div>
        <Link href="/admin" className="btn-luxury-ghost px-5 py-2.5 text-[10px] tracking-[0.14em]">
          ← Dashboard
        </Link>
      </div>

      <Suspense fallback={null}>
        <AdminInboxTabs ticketCount={ticketCount ?? 0} notificationCount={notifCount ?? 0} />
      </Suspense>

      {tab === 'tickets' ? (
        <GlassCard elevated className="p-5 md:p-6">
          {(tickets ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-luxury-muted">Aucun ticket ouvert.</p>
          ) : (
            <ul className="space-y-4">
              {(tickets ?? []).map((ticket) => {
                const p = profileById.get(ticket.user_id);
                const name = p ? [p.first_name, p.last_name].filter(Boolean).join(' ') : '—';
                return (
                  <li key={ticket.id} className="rounded-2xl border border-white/55 bg-white/45 p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <ClientAvatar avatarUrl={p?.avatar_url} name={name} size={40} />
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-luxury-soft">
                            {new Date(ticket.created_at).toLocaleString('fr-FR')}
                          </p>
                          <p className="mt-0.5 font-semibold text-luxury-ink">{name}</p>
                          <Link
                            href={`/admin/clients/${ticket.user_id}`}
                            className="text-xs font-medium text-luxury-orange underline-offset-2 hover:underline"
                          >
                            Fiche cliente
                          </Link>
                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-luxury-orange">
                            {TYPE_LABELS[ticket.type] ?? ticket.type}
                          </p>
                        </div>
                      </div>
                      <ResolveTicketButton ticketId={ticket.id} />
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-luxury-ink">{ticket.message}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>
      ) : null}

      {tab === 'notifications' ? (
        <GlassCard elevated className="p-5 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-luxury-muted">Alertes in-app pour ton compte admin.</p>
            {(notifCount ?? 0) > 0 ? <MarkAllNotificationsReadButton /> : null}
          </div>
          {(notifications ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-luxury-muted">Aucune notification.</p>
          ) : (
            <ul className="divide-y divide-white/40">
              {(notifications ?? []).map((n) => (
                <li key={n.id} className={`flex flex-wrap items-start justify-between gap-3 py-3 ${n.read_at ? 'opacity-55' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-luxury-soft">
                      {new Date(n.created_at).toLocaleString('fr-FR')}
                      {!n.read_at ? (
                        <span className="ml-2 inline-flex rounded-full bg-[#ff3b30] px-1.5 py-0.5 text-[9px] font-bold text-white">
                          Nouveau
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 font-semibold text-luxury-ink">{n.title}</p>
                    {n.body ? <p className="mt-1 text-sm text-luxury-muted">{n.body}</p> : null}
                  </div>
                  {!n.read_at ? <MarkNotificationReadButton id={n.id} /> : null}
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      ) : null}

      {tab === 'settings' ? (
        <GlassCard elevated className="overflow-hidden p-0">
          <div className="flex items-center gap-3 border-b border-white/35 px-5 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-luxury-violet/12 text-luxury-violet">
              <BellRing size={20} aria-hidden />
            </span>
            <p className="text-sm text-luxury-muted">
              Seuils globaux du dispatcher — modifier via les variables d&apos;environnement Vercel puis redéployer.
            </p>
          </div>
          <div className="divide-y divide-white/35">
            {settingsRows.map((row) => (
              <div key={row.env} className="grid gap-2 px-5 py-4 text-sm md:grid-cols-2 md:gap-4">
                <p className="font-semibold text-luxury-ink">{row.label}</p>
                <code className="rounded-xl bg-white/40 px-3 py-2 text-xs text-luxury-muted">{row.env}</code>
                <p>
                  <span className="text-luxury-muted">Actif : </span>
                  <span className="font-semibold">{row.current}</span>
                </p>
                <p className="text-luxury-muted">Défaut : {row.fallback}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : null}
    </main>
  );
}
