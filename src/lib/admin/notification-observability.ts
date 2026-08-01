import { createAdminClient } from '@/lib/supabase/admin';
import {
  NOTIF_TYPE_LABELS,
  emailBucket,
  categoryFromEventType,
  type NotifObservabilityPeriod,
  type NotifObservabilitySummary,
  type NotifTypeKey,
  type NotifTypeStat,
} from '@/lib/admin/notification-observability-shared';

export type {
  NotifObservabilityPeriod,
  NotifObservabilitySummary,
  NotifTypeKey,
  NotifTypeStat,
} from '@/lib/admin/notification-observability-shared';

export { previewNotificationForType } from '@/lib/admin/notification-observability-shared';

function startOfMonthIso(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

function emptyTypes(): Record<NotifTypeKey, NotifTypeStat> {
  const keys = Object.keys(NOTIF_TYPE_LABELS) as NotifTypeKey[];
  const out = {} as Record<NotifTypeKey, NotifTypeStat>;
  for (const key of keys) {
    out[key] = {
      key,
      label: NOTIF_TYPE_LABELS[key],
      count: 0,
      lastSentAt: null,
      tracked: true,
      sampleEventType: null,
      samplePayload: null,
      sampleTitle: null,
      sampleBody: null,
    };
  }
  return out;
}

export async function loadNotificationObservability(
  period: NotifObservabilityPeriod = 'month',
): Promise<NotifObservabilitySummary> {
  const admin = createAdminClient();
  const since = period === 'month' ? startOfMonthIso() : null;
  const types = emptyTypes();
  const gaps: string[] = [];

  let logQuery = admin
    .from('notification_log')
    .select('event_type,channel,payload,created_at')
    .in('channel', ['email', 'log'])
    .order('created_at', { ascending: false })
    .limit(5000);
  if (since) logQuery = logQuery.gte('created_at', since);

  const { data: logRows, error: logErr } = await logQuery;
  if (logErr) {
    gaps.push(`notification_log illisible : ${logErr.message}`);
  } else {
    for (const row of logRows ?? []) {
      const channel = String(row.channel || '');
      const eventType = String(row.event_type || '');
      const createdAt = String(row.created_at || '');
      const payload = (row.payload && typeof row.payload === 'object' ? row.payload : {}) as Record<
        string,
        unknown
      >;
      const delivered = String(payload._delivered || '');

      if (channel === 'email') {
        const cat = categoryFromEventType(eventType);
        const key = emailBucket(cat, eventType);
        const stat = types[key]!;
        if (stat.count != null) stat.count += 1;
        if (!stat.lastSentAt || createdAt > stat.lastSentAt) {
          stat.lastSentAt = createdAt;
          stat.sampleEventType = eventType;
          stat.samplePayload = payload;
        }
      } else if (channel === 'log' && (delivered === 'in_app' || payload.title || payload.kind)) {
        const stat = types.in_app!;
        if (stat.count != null) stat.count += 1;
        if (!stat.lastSentAt || createdAt > stat.lastSentAt) {
          stat.lastSentAt = createdAt;
          stat.sampleEventType = eventType;
          stat.samplePayload = payload;
          stat.sampleTitle = payload.title != null ? String(payload.title) : eventType;
          stat.sampleBody = payload.body != null ? String(payload.body) : null;
        }
      }
    }
  }

  let inAppQuery = admin
    .from('user_notifications')
    .select('kind,title,body,created_at')
    .order('created_at', { ascending: false })
    .limit(3000);
  if (since) inAppQuery = inAppQuery.gte('created_at', since);
  const { data: inAppRows, error: inAppErr } = await inAppQuery;
  if (inAppErr) {
    gaps.push(`user_notifications illisible : ${inAppErr.message}`);
  } else if (inAppRows?.length) {
    types.in_app.count = inAppRows.length;
    const latest = inAppRows[0]!;
    types.in_app.lastSentAt = String(latest.created_at || types.in_app.lastSentAt || '');
    types.in_app.sampleTitle = latest.title != null ? String(latest.title) : null;
    types.in_app.sampleBody = latest.body != null ? String(latest.body) : null;
    types.in_app.sampleEventType = latest.kind != null ? String(latest.kind) : types.in_app.sampleEventType;
  }

  const totalTracked = (Object.values(types) as NotifTypeStat[])
    .filter((t) => t.tracked && t.count != null)
    .reduce((sum, t) => sum + (t.count || 0), 0);

  return {
    period,
    periodLabel: period === 'month' ? 'Mois en cours' : 'Tout',
    totalTracked,
    types: Object.values(types),
    gaps,
  };
}
