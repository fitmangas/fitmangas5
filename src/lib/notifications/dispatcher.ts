import type { SupabaseClient } from '@supabase/supabase-js';

import { categoryFromEventType, isCriticalEventType } from './category';
import { mergePrefs } from './defaults';
import type { DispatchInput, DispatchResult, DispatcherDeps } from './types';
import { isEmailEnabledForCategory, isInAppEnabledForCategory, isPushEnabledForCategory } from './prefs-helpers';
import { calendarDayKeyInTimeZone, startOfDayUtcIsoInTimeZone } from './timezone';
import { sendPushNotification as sendPushNotificationDefault } from './push';
import { shouldSendNowOrQueue } from './quiet-hours';
import { DEFAULT_NOTIFICATION_RUNTIME_SETTINGS, getNotificationRuntimeSettings } from './settings';
import { sendDispatcherEmail } from './email';

function hintAllows(channel: 'in_app' | 'email', hints: DispatchInput['channel_hints']): boolean {
  if (!hints?.length) return true;
  return hints.includes(channel);
}

function pushHintAllows(hints: DispatchInput['channel_hints']): boolean {
  if (!hints?.length) return true;
  return hints.includes('push');
}

export async function dispatch(
  supabase: SupabaseClient,
  input: DispatchInput,
  deps: DispatcherDeps = {},
): Promise<DispatchResult> {
  const sendEmail = deps.sendEmailPlaceholder ?? sendDispatcherEmail;
  const sendPushNotification =
    deps.sendPushNotification ??
    ((args: { userId: string; title: string; body?: string | null; url?: string }) =>
      sendPushNotificationDefault(args.userId, args.title, args.body, args.url));
  const settings = {
    ...DEFAULT_NOTIFICATION_RUNTIME_SETTINGS,
    ...getNotificationRuntimeSettings(),
    ...(deps.settings ?? {}),
  };
  const now = deps.now ?? new Date();

  let pendingIdempotencyKey = input.idempotency_key ?? null;
  const pickIdempotencyKey = (): string | null => {
    const k = pendingIdempotencyKey;
    pendingIdempotencyKey = null;
    return k;
  };

  if (input.idempotency_key) {
    const { data: existing } = await supabase
      .from('notification_log')
      .select('id')
      .eq('idempotency_key', input.idempotency_key)
      .maybeSingle();
    if (existing?.id) {
      return { ok: true, skipped: 'duplicate', duplicate_of_log_id: existing.id };
    }
  }

  const logIds: string[] = [];

  if (input.user_id === null) {
    const { data, error } = await supabase
      .from('notification_log')
      .insert({
        user_id: null,
        event_type: input.event_type,
        channel: 'log',
        payload: input.payload as Record<string, unknown>,
        idempotency_key: pickIdempotencyKey(),
      })
      .select('id')
      .single();
    if (error) throw error;
    return { ok: true, anonymous: true, notification_log_ids: [data.id] };
  }

  const userId = input.user_id;

  const [{ data: prefRow }, { data: profileRow }] = await Promise.all([
    supabase.from('notification_preferences').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('profiles').select('preferred_locale, display_timezone').eq('id', userId).maybeSingle(),
  ]);

  const prefs = mergePrefs(prefRow ?? null);
  const locale = profileRow?.preferred_locale === 'es' ? 'es' : 'fr';
  const tz = profileRow?.display_timezone?.trim() || 'Europe/Paris';

  const critical = isCriticalEventType(input.event_type);
  const silenceBlocksClients = prefs.silence_mode_enabled && !critical;

  if (silenceBlocksClients) {
    const { data, error } = await supabase
      .from('notification_log')
      .insert({
        user_id: userId,
        event_type: input.event_type,
        channel: 'log',
        payload: { ...input.payload, _silence_skip: true },
        idempotency_key: pickIdempotencyKey(),
      })
      .select('id')
      .single();
    if (error) throw error;
    return { ok: true, skipped: 'silence_mode', notification_log_ids: [data.id] };
  }

  const category = categoryFromEventType(input.event_type);
  const hints = input.channel_hints;

  if (
    !critical &&
    shouldSendNowOrQueue(userId, input.event_type, tz, now, {
      quietHoursStart: settings.quietHoursStart,
      quietHoursEnd: settings.quietHoursEnd,
    }) === 'queue_digest'
  ) {
    const { data: queued, error: qErr } = await supabase
      .from('notification_digest_queue')
      .insert({
        user_id: userId,
        digest_bucket: category,
        payload: {
          event_type: input.event_type,
          payload: input.payload,
          _quiet_hours_queue: true,
        },
        scheduled_for: now.toISOString(),
      })
      .select('id')
      .single();
    if (qErr) throw qErr;

    const { data: queueLog, error: lErr } = await supabase
      .from('notification_log')
      .insert({
        user_id: userId,
        event_type: input.event_type,
        channel: 'digest',
        payload: { ...input.payload, _queued: 'quiet_hours', digest_queue_id: queued?.id },
        idempotency_key: pickIdempotencyKey(),
      })
      .select('id')
      .single();
    if (lErr) throw lErr;

    return {
      ok: true,
      notification_log_ids: queueLog?.id ? [queueLog.id] : [],
      delivered: { digest: true },
    };
  }

  let allowEmail =
    hintAllows('email', hints) && isEmailEnabledForCategory(prefs, category);
  let allowInApp =
    hintAllows('in_app', hints) && isInAppEnabledForCategory(prefs, category);
  const allowPush =
    pushHintAllows(hints) && (critical || isPushEnabledForCategory(prefs, category));

  const dayKey = calendarDayKeyInTimeZone(tz, now);
  const emailScopeKey = `email:${dayKey}`;
  const startOfDayUtcIso = startOfDayUtcIsoInTimeZone(tz, now);

  if (allowInApp && !critical) {
    const { count } = await supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)
      .gte('created_at', startOfDayUtcIso);
    if ((count ?? 0) >= settings.inAppUnreadDailyCap) {
      allowInApp = false;
    }
  }

  const delivered: { email?: boolean; in_app?: boolean; push?: boolean } = {};
  const title = String(input.payload.title ?? input.event_type);
  const body = input.payload.body != null ? String(input.payload.body) : null;
  const kind = String(input.payload.kind ?? input.event_type);
  const url = input.payload.url != null ? String(input.payload.url) : undefined;

  if (allowInApp) {
    const { error: nErr } = await supabase.from('user_notifications').insert({
      user_id: userId,
      kind,
      title,
      body,
    });
    if (nErr) throw nErr;
    delivered.in_app = true;

    const { data: logRow, error: lErr } = await supabase
      .from('notification_log')
      .insert({
        user_id: userId,
        event_type: input.event_type,
        channel: 'log',
        payload: { ...input.payload, _delivered: 'in_app' },
        idempotency_key: pickIdempotencyKey(),
      })
      .select('id')
      .single();
    if (lErr) throw lErr;
    if (logRow?.id) logIds.push(logRow.id);
  }

  if (allowEmail) {
    let reserved = true;
    if (!critical) {
      const { data, error: reserveErr } = await supabase.rpc('try_reserve_email_slot', {
        p_user_id: userId,
        p_scope_key: emailScopeKey,
        p_max: settings.emailDailyCap,
      });
      if (reserveErr) throw reserveErr;
      reserved = Boolean(data);
    }

    if (reserved) {
      await sendEmail({
        toProfileId: userId,
        event_type: input.event_type,
        payload: input.payload,
        locale,
      });
      delivered.email = true;

      const { data: emailLog, error: eErr } = await supabase
        .from('notification_log')
        .insert({
          user_id: userId,
          event_type: input.event_type,
          channel: 'email',
          payload: { ...input.payload, _delivered: 'email' },
          idempotency_key: pickIdempotencyKey(),
        })
        .select('id')
        .single();
      if (eErr) throw eErr;
      if (emailLog?.id) logIds.push(emailLog.id);
    }
  }

  if (allowPush) {
    const pushResult = await sendPushNotification({
      userId,
      title,
      body,
      url,
    });

    if (pushResult.sent > 0) {
      delivered.push = true;

      const { data: pushLog, error: pErr } = await supabase
        .from('notification_log')
        .insert({
          user_id: userId,
          event_type: input.event_type,
          channel: 'push',
          payload: { ...input.payload, _delivered: 'push' },
          idempotency_key: pickIdempotencyKey(),
        })
        .select('id')
        .single();
      if (pErr) throw pErr;
      if (pushLog?.id) logIds.push(pushLog.id);
    }
  }

  if (!delivered.email && !delivered.in_app && !delivered.push && logIds.length === 0) {
    const { data: fallback, error: fErr } = await supabase
      .from('notification_log')
      .insert({
        user_id: userId,
        event_type: input.event_type,
        channel: 'log',
        payload: {
          ...input.payload,
          _no_client_delivery: true,
          reason: 'prefs_or_caps',
        },
        idempotency_key: pickIdempotencyKey(),
      })
      .select('id')
      .single();
    if (fErr) throw fErr;
    if (fallback?.id) logIds.push(fallback.id);
    return {
      ok: true,
      notification_log_ids: logIds,
      delivered: {},
    };
  }

  return {
    ok: true,
    notification_log_ids: logIds,
    delivered,
  };
}
