import Link from 'next/link';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

type Health = 'green' | 'orange' | 'red';

function classify(lastActivityTs: number, now: number): Health {
  const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
  const fourDaysAgo = now - 4 * 24 * 60 * 60 * 1000;
  if (!lastActivityTs || lastActivityTs < tenDaysAgo) return 'red';
  if (lastActivityTs < fourDaysAgo) return 'orange';
  return 'green';
}

function badgeClass(health: Health): string {
  if (health === 'green') return 'bg-emerald-100 text-emerald-800';
  if (health === 'orange') return 'bg-amber-100 text-amber-900';
  return 'bg-rose-100 text-rose-900';
}

function badgeLabel(health: Health): string {
  if (health === 'green') return 'Actif';
  if (health === 'orange') return 'Fragile';
  return 'À risque';
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ health?: string }>;
}) {
  await requireAdmin();
  const admin = createAdminClient();
  const params = await searchParams;
  const filter = params.health === 'green' || params.health === 'orange' || params.health === 'red' ? params.health : null;

  const [{ data: members }, { data: attended }, { data: replay }] = await Promise.all([
    admin.from('profiles').select('id, first_name, last_name, updated_at').eq('role', 'member').order('updated_at', { ascending: false }),
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
      const health = classify(lastTs, now);
      return {
        id: m.id,
        name: [m.first_name, m.last_name].filter(Boolean).join(' ') || m.id.slice(0, 8),
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
        <p className="text-sm text-luxury-muted">
          Filtre : <span className="font-medium text-luxury-ink">{filter ? badgeLabel(filter) : 'Tous'}</span>
        </p>
      </div>

      <div className="glass-card overflow-hidden p-6 md:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-luxury-ink">Clients — Santé</h1>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/40 text-[10px] uppercase tracking-wider text-luxury-soft">
                <th className="px-2 py-3">Client</th>
                <th className="px-2 py-3">Health</th>
                <th className="px-2 py-3">Dernière activité</th>
                <th className="px-2 py-3">Fiche</th>
              </tr>
            </thead>
            <tbody className="text-luxury-ink">
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-white/30">
                  <td className="px-2 py-3">{row.name}</td>
                  <td className="px-2 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(row.health)}`}>
                      {badgeLabel(row.health)}
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
      </div>
    </div>
  );
}
