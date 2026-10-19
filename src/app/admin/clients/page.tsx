import { AdminClientsFollowup, type FollowupClient } from '@/components/Admin/AdminClientsFollowup';
import { computeMemberHealth, isRealStripeSubscriptionId } from '@/lib/admin/member-health';
import { computeMemberPaymentStatus } from '@/lib/admin/member-payment-status';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  await requireAdmin();
  const admin = createAdminClient();
  const params = await searchParams;
  const showArchived = params.archived === '1';

  let membersQuery = admin
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, updated_at, created_at, archived, stripe_customer_id, subscription_status, last_checkout_course_id')
    .eq('role', 'member')
    .order('updated_at', { ascending: false });
  membersQuery = showArchived ? membersQuery.eq('archived', true) : membersQuery.eq('archived', false);

  const [{ data: members }, { data: attended }, { data: replay }, { data: subs }] = await Promise.all([
    membersQuery,
    admin
      .from('enrollments')
      .select('user_id, course_id, status, courses(starts_at)')
      .eq('status', 'attended'),
    admin.from('replay_playback_progress').select('user_id, updated_at'),
    admin
      .from('subscriptions')
      .select('user_id, status, ends_at, created_at, updated_at, stripe_subscription_id')
      .order('updated_at', { ascending: false }),
  ]);

  const now = Date.now();
  const lastActivityByUser = new Map<string, number>();
  const payingByUser = new Map<string, number>();
  const subscriptionsByUser = new Map<string, NonNullable<typeof subs>>();

  for (const s of subs ?? []) {
    const bucket = subscriptionsByUser.get(s.user_id) ?? [];
    bucket.push(s);
    subscriptionsByUser.set(s.user_id, bucket);

    if (!isRealStripeSubscriptionId(s.stripe_subscription_id)) continue;
    if (s.ends_at && new Date(s.ends_at).getTime() < now) continue;
    if (s.status !== 'active' && s.status !== 'trialing') continue;
    const started = s.created_at ? new Date(s.created_at).getTime() : now;
    const prev = payingByUser.get(s.user_id);
    if (prev == null || started < prev) payingByUser.set(s.user_id, started);
  }

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

  const clients: FollowupClient[] = (members ?? []).map((m) => {
    const lastTs = lastActivityByUser.get(m.id) ?? 0;
    const createdTs = m.created_at ? new Date(m.created_at).getTime() : now;
    const isPaying = payingByUser.has(m.id);
    const health = computeMemberHealth({
      lastActivityTs: lastTs,
      accountCreatedTs: createdTs,
      now,
      isPayingMember: isPaying,
      subscriptionStartedTs: payingByUser.get(m.id) ?? null,
    });
    const payment = computeMemberPaymentStatus({
      subscriptions: subscriptionsByUser.get(m.id) ?? [],
      stripeCustomerId: m.stripe_customer_id,
      profileSubscriptionStatus: m.subscription_status,
      now,
    });
    const primary = (subscriptionsByUser.get(m.id) ?? [])[0];
    return {
      id: m.id,
      firstName: m.first_name,
      lastName: m.last_name,
      createdAt: m.created_at,
      lastActivity: lastTs ? new Date(lastTs).toLocaleDateString('fr-FR') : 'Aucune activité',
      lastActivityTs: lastTs,
      health,
      paymentBadge: payment.badge,
      paymentDetail: payment.detail,
      lastCheckout: m.last_checkout_course_id,
      endsAtTs: primary?.ends_at ? new Date(primary.ends_at).getTime() : null,
    };
  });

  return (
    <AdminClientsFollowup
      clients={clients}
      archivedHref={showArchived ? '/admin/clients' : '/admin/clients?archived=1'}
    />
  );
}
