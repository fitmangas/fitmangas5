import Link from 'next/link';

import { ClientAvatar } from '@/components/Admin/ClientAvatar';
import { ADMIN_HEAD_TR } from '@/components/Admin/adminSurfaceClasses';
import { MEMBER_HEALTH_LABELS } from '@/lib/admin/health-labels';
import { computeMemberHealth, type MemberHealthBadge } from '@/lib/admin/member-health';
import { GlassCard } from '@/components/ui/GlassCard';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

const HEALTH_FILTERS: MemberHealthBadge[] = ['new', 'watch', 'green', 'orange', 'red'];

function badgeClass(health: MemberHealthBadge): string {
  if (health === 'green') return 'bg-emerald-100 text-emerald-800';
  if (health === 'orange') return 'bg-amber-100 text-amber-900';
  if (health === 'red') return 'bg-rose-100 text-rose-900';
  if (health === 'new') return 'bg-sky-100 text-sky-900';
  return 'bg-indigo-100 text-indigo-900';
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ health?: string; archived?: string }>;
}) {
  await requireAdmin();
  const admin = createAdminClient();
  const params = await searchParams;
  const raw = params.health ?? '';
  const filter = HEALTH_FILTERS.includes(raw as MemberHealthBadge) ? (raw as MemberHealthBadge) : null;
  const showArchived = params.archived === '1';

  let membersQuery = admin
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, updated_at, created_at, archived')
    .eq('role', 'member')
    .order('updated_at', { ascending: false });
  membersQuery = showArchived ? membersQuery.eq('archived', true) : membersQuery.eq('archived', false);

  const [{ data: members }, { data: attended }, { data: replay }] = await Promise.all([
    membersQuery,
    admin
      .from('enrollments')
      .select('user_id, course_id, status, courses(starts_at)')
      .eq('status', 'attended'),
    admin.from('replay_playback_progress').select('user_id, updated_at'),
  ]);

  const now = Date.now();
  const lastActivityByUser = new Map<string, number>();

  for (const row of attended ?? []) {
    const startsAt =
      Array.isArray(row.courses) && row.courses.length > 0
        ? row.courses[0]?.starts_at
        : (row.courses as { starts_at?: string } | null)?.starts_at;
    const ts = startsAt ? new Date(startsAt).getTime() : 0;
    const prev = lastActivityByUser.get(row.user_id) ?? 0;
    if (ts > prev) lastActivityByUser.set(row.user_id, ts);
  }

  for (const row of replay ?? []) {
    const ts = new Date(row.updated_at).getTime();
    const prev = lastActivityByUser.get(row.user_id) ?? 0;
    if (ts > prev) lastActivityByUser.set(row.user_id, ts);
  }

  const rows = (members ?? [])
    .map((m) => {
      const lastTs = lastActivityByUser.get(m.id) ?? 0;
      const createdTs = m.created_at ? new Date(m.created_at).getTime() : now;
      const health = computeMemberHealth({ lastActivityTs: lastTs, accountCreatedTs: createdTs, now });
      return {
        id: m.id,
        name: [m.first_name, m.last_name].filter(Boolean).join(' ') || m.id.slice(0, 8),
        avatarUrl: m.avatar_url,
        health,
        lastActivity: lastTs ? new Date(lastTs).toLocaleDateString('fr-FR') : 'Aucune activité',
      };
    })
    .filter((r) => (filter ? r.health === filter : true));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="text-sm font-medium text-luxury-orange underline-offset-4 hover:underline">
          ← Dashboard
        </Link>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <p className="text-luxury-muted">
            Santé : <span className="font-medium text-luxury-ink">{filter ? MEMBER_HEALTH_LABELS[filter] : 'Tous'}</span>
          </p>
          {showArchived ? (
            <Link href="/admin/clients" className="font-medium text-luxury-orange underline-offset-4 hover:underline">
              Masquer archivés
            </Link>
          ) : (
            <Link
              href="/admin/clients?archived=1"
              className="font-medium text-luxury-orange underline-offset-4 hover:underline"
            >
              Voir archivés
            </Link>
          )}
        </div>
      </div>

      <GlassCard elevated className="overflow-hidden p-6 md:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-luxury-ink">Clients — Santé</h1>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className={ADMIN_HEAD_TR}>
                <th className="px-2 py-3">Client</th>
                <th className="px-2 py-3">Santé</th>
                <th className="px-2 py-3">Dernière activité</th>
                <th className="px-2 py-3">Fiche</th>
              </tr>
            </thead>
            <tbody className="text-luxury-ink">
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-white/30">
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3">
                      <ClientAvatar avatarUrl={row.avatarUrl} name={row.name} size={36} />
                      <span className="font-medium">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(row.health)}`}>
                      {MEMBER_HEALTH_LABELS[row.health]}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-luxury-muted">{row.lastActivity}</td>
                  <td className="px-2 py-3">
                    <Link href={`/admin/clients/${row.id}`} className="text-luxury-orange underline-offset-4 hover:underline">
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-2 py-4 text-luxury-muted" colSpan={4}>
                    Aucun client trouvé pour ce filtre.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
