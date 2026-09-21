import { createAdminClient } from '@/lib/supabase/admin';

import { isAcquisitionSchemaReady } from '@/lib/acquisition/db';
import type {
  AcqContact,
  AcqConversation,
  AcqFollowupRow,
  AcqMessage,
  AcqWorkflow,
  AcquisitionChannel,
  LifecycleStage,
  WorkflowActionType,
} from '@/lib/acquisition/types';
import { WORKFLOW_CATALOG, WORKFLOW_CATALOG_COUNT } from './workflow-catalog';

type DbError = { ok: false; error: string; schemaReady: boolean };

function mapContact(row: Record<string, unknown>): AcqContact {
  const external =
    row.external_ids && typeof row.external_ids === 'object' && !Array.isArray(row.external_ids)
      ? Object.fromEntries(
          Object.entries(row.external_ids as Record<string, unknown>)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)]),
        )
      : null;
  return {
    id: String(row.id),
    channel: row.channel as AcquisitionChannel,
    handle: row.handle ? String(row.handle) : null,
    email: row.email ? String(row.email) : null,
    phone: row.phone ? String(row.phone) : null,
    displayName: row.display_name ? String(row.display_name) : null,
    optIn: Boolean(row.opt_in),
    lifecycleStage: (row.lifecycle_stage as LifecycleStage) ?? 'new',
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    sourceAttribution: row.source_attribution ? String(row.source_attribution) : null,
    createdAt: String(row.created_at),
    leadScore: typeof row.lead_score === 'number' ? row.lead_score : Number(row.lead_score ?? 0) || 0,
    externalIds: external && Object.keys(external).length ? external : null,
  };
}

function mapConversation(row: Record<string, unknown>): AcqConversation {
  return {
    id: String(row.id),
    contactId: String(row.contact_id),
    channel: row.channel as AcquisitionChannel,
    status: (row.status as AcqConversation['status']) ?? 'open',
    lifecycleStage: (row.lifecycle_stage as LifecycleStage) ?? 'new',
    subject: row.subject ? String(row.subject) : null,
    lastMessageAt: row.last_message_at ? String(row.last_message_at) : null,
    lastMessagePreview: row.last_message_preview ? String(row.last_message_preview) : null,
    assignedTo: row.assigned_to ? String(row.assigned_to) : null,
    contactHandle: row.contact_handle ? String(row.contact_handle) : undefined,
    contactLeadScore:
      row.contact_lead_score != null ? Number(row.contact_lead_score) || 0 : null,
    externalThreadId: row.external_thread_id ? String(row.external_thread_id) : null,
  };
}

function mapMessage(row: Record<string, unknown>): AcqMessage {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    direction: (row.direction as AcqMessage['direction']) ?? 'inbound',
    body: String(row.body ?? ''),
    provider: row.provider ? String(row.provider) : null,
    sandbox: Boolean(row.sandbox),
    createdAt: String(row.created_at),
  };
}

export async function listConversations(limit = 50): Promise<
  { ok: true; items: AcqConversation[]; schemaReady: boolean } | DbError
> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) {
    return { ok: true, items: [], schemaReady: false };
  }
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('acq_conversations')
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(limit);
    if (error) {
      return { ok: false, error: error.message, schemaReady: true };
    }
    const contactIds = [...new Set((data ?? []).map((r) => r.contact_id as string))];
    const handles = new Map<string, string | null>();
    const scores = new Map<string, number>();
    if (contactIds.length) {
      const { data: contacts } = await admin
        .from('acq_contacts')
        .select('id, handle, lead_score')
        .in('id', contactIds);
      for (const c of contacts ?? []) {
        handles.set(String(c.id), c.handle ? String(c.handle) : null);
        scores.set(String(c.id), typeof c.lead_score === 'number' ? c.lead_score : Number(c.lead_score ?? 0) || 0);
      }
    }
    const items = (data ?? []).map((row) =>
      mapConversation({
        ...row,
        contact_handle: handles.get(String(row.contact_id)) ?? null,
        contact_lead_score: scores.get(String(row.contact_id)) ?? 0,
      }),
    );
    return { ok: true, items, schemaReady: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur liste conversations',
      schemaReady: true,
    };
  }
}

export async function getConversationWithMessages(conversationId: string): Promise<
  | { ok: true; conversation: AcqConversation; messages: AcqMessage[]; schemaReady: boolean }
  | DbError
> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) {
    return { ok: false, error: 'Tables Acquisition non migrées — voir PROPOSITIONS_MIGRATIONS.md §9.', schemaReady: false };
  }
  try {
    const admin = createAdminClient();
    const { data: conv, error: cErr } = await admin
      .from('acq_conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();
    if (cErr || !conv) {
      return { ok: false, error: cErr?.message ?? 'Conversation introuvable', schemaReady: true };
    }
    const { data: contactRow } = await admin
      .from('acq_contacts')
      .select('handle')
      .eq('id', conv.contact_id)
      .maybeSingle();
    const { data: msgs, error: mErr } = await admin
      .from('acq_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (mErr) {
      return { ok: false, error: mErr.message, schemaReady: true };
    }
    return {
      ok: true,
      conversation: mapConversation({ ...conv, contact_handle: contactRow?.handle ?? null }),
      messages: (msgs ?? []).map(mapMessage),
      schemaReady: true,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur chargement conversation',
      schemaReady: true,
    };
  }
}

export async function insertOutboundMessage(params: {
  conversationId: string;
  body: string;
  provider: string;
  sandbox: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) {
    return { ok: false, error: 'Tables Acquisition absentes.' };
  }
  const admin = createAdminClient();
  const preview = params.body.slice(0, 180);
  const now = new Date().toISOString();
  const { error: mErr } = await admin.from('acq_messages').insert({
    conversation_id: params.conversationId,
    direction: 'outbound',
    body: params.body,
    provider: params.provider,
    sandbox: params.sandbox,
  });
  if (mErr) return { ok: false, error: mErr.message };
  const { error: uErr } = await admin
    .from('acq_conversations')
    .update({ last_message_at: now, last_message_preview: preview })
    .eq('id', params.conversationId);
  if (uErr) return { ok: false, error: uErr.message };
  return { ok: true };
}

export async function listWorkflows(): Promise<
  { ok: true; items: AcqWorkflow[]; schemaReady: boolean } | DbError
> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) {
    return { ok: true, items: defaultWorkflows(), schemaReady: false };
  }
  try {
    const admin = createAdminClient();
    // Toujours resync le catalogue code → DB (nouveaux WF + textes bilingues à jour)
    await ensureWorkflowCatalog();
    const { data, error } = await admin.from('acq_workflows').select('*').order('name');
    if (error) {
      return { ok: true, items: defaultWorkflows(), schemaReady: true };
    }
    const items = (data ?? []).map((row) => mapWorkflowRow(row as Record<string, unknown>));
    if (!items.length) {
      await ensureWorkflowCatalog();
      const { data: again } = await admin.from('acq_workflows').select('*').order('name');
      return {
        ok: true,
        items: (again ?? []).map((row) => mapWorkflowRow(row as Record<string, unknown>)),
        schemaReady: true,
      };
    }
    return { ok: true, items, schemaReady: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur workflows',
      schemaReady: true,
    };
  }
}

/** Workflows par défaut (mémoire) tant que la table n'existe pas ou est vide. */
export function defaultWorkflows(): AcqWorkflow[] {
  return WORKFLOW_CATALOG;
}

function mapWorkflowRow(row: Record<string, unknown>): AcqWorkflow {
  return {
    id: String(row.id),
    name: String(row.name),
    enabled: Boolean(row.enabled),
    triggerType: row.trigger_type as AcqWorkflow['triggerType'],
    triggerConfig: (row.trigger_config as Record<string, unknown>) ?? {},
    conditions: (row.conditions as Record<string, unknown>) ?? {},
    actions: (Array.isArray(row.actions) ? row.actions : []).map((a) => {
      const action = a as { type?: string; config?: Record<string, unknown> };
      return {
        type: (action.type ?? 'send_message') as AcqWorkflow['actions'][number]['type'],
        config: action.config,
      };
    }),
  };
}

export async function saveWorkflow(input: {
  id?: string;
  name: string;
  enabled: boolean;
  triggerType: AcqWorkflow['triggerType'];
  triggerConfig: Record<string, unknown>;
  conditions: Record<string, unknown>;
  actions: AcqWorkflow['actions'];
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return { ok: false, error: 'Tables Acquisition absentes.' };

  const admin = createAdminClient();
  const payload = {
    name: input.name.trim(),
    enabled: input.enabled,
    trigger_type: input.triggerType,
    trigger_config: input.triggerConfig,
    conditions: input.conditions,
    actions: input.actions,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await admin
      .from('acq_workflows')
      .update(payload)
      .eq('id', input.id)
      .select('id')
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: String(data.id) };
  }

  const { data, error } = await admin.from('acq_workflows').insert(payload).select('id').single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: String(data.id) };
}

export async function deleteWorkflow(workflowId: string): Promise<{ ok: boolean; error?: string }> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return { ok: false, error: 'Tables Acquisition absentes.' };
  const admin = createAdminClient();
  const { error } = await admin.from('acq_workflows').delete().eq('id', workflowId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function setWorkflowEnabled(
  workflowId: string,
  enabled: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return { ok: false, error: 'Tables Acquisition absentes.' };
  const admin = createAdminClient();
  const { error } = await admin
    .from('acq_workflows')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('id', workflowId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function setContactOptIn(contactId: string, optIn: boolean): Promise<{ ok: boolean; error?: string }> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return { ok: false, error: 'Tables absentes.' };
  const admin = createAdminClient();
  const { error } = await admin.from('acq_contacts').update({ opt_in: optIn }).eq('id', contactId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function escalateConversation(
  conversationId: string,
  assignedTo: string,
): Promise<{ ok: boolean; error?: string }> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return { ok: false, error: 'Tables absentes.' };
  const admin = createAdminClient();
  const { error } = await admin
    .from('acq_conversations')
    .update({ status: 'escalated', assigned_to: assignedTo, updated_at: new Date().toISOString() })
    .eq('id', conversationId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateContactLifecycle(
  contactId: string,
  stage: LifecycleStage,
): Promise<{ ok: boolean; error?: string }> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return { ok: false, error: 'Tables absentes.' };
  const admin = createAdminClient();
  const { scoreForLifecycle, clampLeadScore } = await import('./lead-score');
  const { data: current } = await admin
    .from('acq_contacts')
    .select('lead_score')
    .eq('id', contactId)
    .maybeSingle();
  const bump = scoreForLifecycle(stage);
  const nextScore = clampLeadScore(Number(current?.lead_score ?? 0) + bump);
  const { error } = await admin
    .from('acq_contacts')
    .update({
      lifecycle_stage: stage,
      lead_score: nextScore,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contactId);
  if (error) return { ok: false, error: error.message };
  await admin
    .from('acq_conversations')
    .update({ lifecycle_stage: stage, updated_at: new Date().toISOString() })
    .eq('contact_id', contactId);
  return { ok: true };
}

/** Incrémente le score lead (0–100). */
export async function bumpContactLeadScore(
  contactId: string,
  delta: number,
): Promise<{ ok: boolean; score?: number; error?: string }> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return { ok: false, error: 'Tables absentes.' };
  if (!delta) return { ok: true, score: undefined };
  const admin = createAdminClient();
  const { clampLeadScore } = await import('./lead-score');
  const { data: current } = await admin
    .from('acq_contacts')
    .select('lead_score')
    .eq('id', contactId)
    .maybeSingle();
  const next = clampLeadScore(Number(current?.lead_score ?? 0) + delta);
  const { error } = await admin
    .from('acq_contacts')
    .update({ lead_score: next, updated_at: new Date().toISOString() })
    .eq('id', contactId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, score: next };
}

export async function updateContactEmail(
  contactId: string,
  email: string,
  optIn = false,
): Promise<{ ok: boolean; error?: string; newsletterDetail?: string }> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return { ok: false, error: 'Tables absentes.' };
  const admin = createAdminClient();
  const { LEAD_SCORE_DELTA, clampLeadScore } = await import('./lead-score');
  const { data: current } = await admin
    .from('acq_contacts')
    .select('lead_score, email')
    .eq('id', contactId)
    .maybeSingle();
  const patch: {
    email: string;
    opt_in?: boolean;
    updated_at: string;
    lead_score?: number;
    profile_id?: string | null;
  } = {
    email: email.trim().toLowerCase(),
    updated_at: new Date().toISOString(),
  };
  if (optIn) patch.opt_in = true;
  if (!current?.email) {
    patch.lead_score = clampLeadScore(Number(current?.lead_score ?? 0) + LEAD_SCORE_DELTA.email_captured);
  }

  const { findUserIdByEmail } = await import('@/lib/stripe/find-user-by-email');
  const profileId = await findUserIdByEmail(admin, patch.email);
  if (profileId) patch.profile_id = profileId;

  const { error } = await admin.from('acq_contacts').update(patch).eq('id', contactId);
  if (error) return { ok: false, error: error.message };

  let newsletterDetail: string | undefined;
  if (optIn) {
    const { subscribeAcquisitionEmailToNewsletter } = await import('@/lib/acquisition/newsletter-bridge');
    const sub = await subscribeAcquisitionEmailToNewsletter(patch.email, 'acquisition_dm');
    newsletterDetail = sub.detail;
    if (!sub.ok) {
      return { ok: true, error: sub.detail, newsletterDetail: sub.detail };
    }
  }

  return { ok: true, newsletterDetail };
}

export async function listOptInContacts(limit = 200): Promise<AcqContact[]> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from('acq_contacts')
    .select('*')
    .eq('opt_in', true)
    .order('updated_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => mapContact(row));
}

export async function getLatestConversationForContact(contactId: string): Promise<AcqConversation | null> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from('acq_conversations')
    .select('*')
    .eq('contact_id', contactId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const { data: contact } = await admin.from('acq_contacts').select('handle').eq('id', contactId).maybeSingle();
  return mapConversation({
    ...data,
    contact_handle: contact?.handle ?? null,
  });
}

export async function tagContact(contactId: string, tag: string): Promise<{ ok: boolean; error?: string }> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return { ok: false, error: 'Tables absentes.' };
  const admin = createAdminClient();
  const { data, error: gErr } = await admin.from('acq_contacts').select('tags').eq('id', contactId).maybeSingle();
  if (gErr || !data) return { ok: false, error: gErr?.message ?? 'Contact introuvable' };
  const tags = Array.isArray(data.tags) ? [...(data.tags as string[])] : [];
  if (!tags.includes(tag)) tags.push(tag);
  const { error } = await admin.from('acq_contacts').update({ tags }).eq('id', contactId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Fusionne des clés dans external_ids (pending_intent, follow flags…). */
export async function patchContactExternalIds(
  contactId: string,
  patch: Record<string, string | null>,
): Promise<{ ok: boolean; error?: string }> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return { ok: false, error: 'Tables absentes.' };
  const admin = createAdminClient();
  const { data, error: gErr } = await admin
    .from('acq_contacts')
    .select('external_ids')
    .eq('id', contactId)
    .maybeSingle();
  if (gErr || !data) return { ok: false, error: gErr?.message ?? 'Contact introuvable' };
  const prev =
    data.external_ids && typeof data.external_ids === 'object' && !Array.isArray(data.external_ids)
      ? { ...(data.external_ids as Record<string, unknown>) }
      : {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete prev[k];
    else prev[k] = v;
  }
  const { error } = await admin
    .from('acq_contacts')
    .update({ external_ids: prev, updated_at: new Date().toISOString() })
    .eq('id', contactId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getContact(contactId: string): Promise<AcqContact | null> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return null;
  const admin = createAdminClient();
  const { data } = await admin.from('acq_contacts').select('*').eq('id', contactId).maybeSingle();
  return data ? mapContact(data) : null;
}

export async function createBookingIntent(params: {
  contactId: string;
  courseType: 'visio_collectif' | 'nantes_presentiel';
  note?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) {
    return { ok: false, error: 'Table acq_booking_intents absente — migration §9 requise.' };
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('acq_booking_intents')
    .insert({
      contact_id: params.contactId,
      course_type: params.courseType,
      note: params.note ?? null,
      status: 'pending',
    })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: String(data.id) };
}

export async function scheduleFollowup(params: {
  contactId: string;
  conversationId: string;
  runAt: string;
  actionType: string;
  payload?: Record<string, unknown>;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) {
    return { ok: false, error: 'Table acq_followups absente — migration §9 requise.' };
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('acq_followups')
    .insert({
      contact_id: params.contactId,
      conversation_id: params.conversationId,
      run_at: params.runAt,
      action_type: params.actionType,
      status: 'scheduled',
      payload: params.payload ?? {},
    })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: String(data.id) };
}

/** Annule toutes les relances encore programmées pour un contact (opt-out). */
export async function cancelScheduledFollowups(
  contactId: string,
): Promise<{ ok: boolean; count?: number; error?: string }> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return { ok: false, error: 'Tables absentes.' };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('acq_followups')
    .update({ status: 'cancelled' })
    .eq('contact_id', contactId)
    .eq('status', 'scheduled')
    .select('id');
  if (error) return { ok: false, error: error.message };
  return { ok: true, count: (data ?? []).length };
}

export async function recordWorkflowRun(params: {
  workflowId: string;
  contactId?: string;
  conversationId?: string;
  status: 'ok' | 'error' | 'partial' | 'skipped';
  log: unknown;
}): Promise<void> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return;
  const admin = createAdminClient();
  await admin.from('acq_workflow_runs').insert({
    workflow_id: params.workflowId,
    contact_id: params.contactId ?? null,
    conversation_id: params.conversationId ?? null,
    status: params.status,
    log: params.log,
  });
}

/** Anti-spam : même workflow + même contact dans les N dernières heures. */
export async function wasWorkflowRunRecently(
  workflowId: string,
  contactId: string,
  withinHours = 6,
): Promise<boolean> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return false;
  const admin = createAdminClient();
  const since = new Date(Date.now() - withinHours * 3600000).toISOString();
  const { data } = await admin
    .from('acq_workflow_runs')
    .select('id')
    .eq('workflow_id', workflowId)
    .eq('contact_id', contactId)
    .eq('status', 'ok')
    .gte('created_at', since)
    .limit(1)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function listRecentWorkflowRuns(limit = 20): Promise<{
  ok: boolean;
  items: Array<{
    id: string;
    workflowId: string | null;
    workflowName: string | null;
    contactId: string | null;
    status: string;
    createdAt: string;
    logPreview: string;
  }>;
  error?: string;
}> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return { ok: true, items: [] };
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('acq_workflow_runs')
      .select('id, workflow_id, contact_id, status, log, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return { ok: false, items: [], error: error.message };

    const wfIds = [...new Set((data ?? []).map((r) => r.workflow_id).filter(Boolean))] as string[];
    const nameById = new Map<string, string>();
    if (wfIds.length) {
      const { data: wfs } = await admin.from('acq_workflows').select('id, name').in('id', wfIds);
      for (const w of wfs ?? []) nameById.set(String(w.id), String(w.name));
    }

    return {
      ok: true,
      items: (data ?? []).map((row) => {
        const log = row.log;
        let logPreview = '';
        if (Array.isArray(log)) {
          logPreview = log
            .slice(0, 3)
            .map((s: { ok?: boolean; type?: string; detail?: string }) =>
              `${s.ok ? '✓' : '✗'} ${s.type ?? '?'}: ${String(s.detail ?? '').slice(0, 60)}`,
            )
            .join(' · ');
        }
        return {
          id: String(row.id),
          workflowId: row.workflow_id ? String(row.workflow_id) : null,
          workflowName: row.workflow_id ? nameById.get(String(row.workflow_id)) ?? null : null,
          contactId: row.contact_id ? String(row.contact_id) : null,
          status: String(row.status),
          createdAt: String(row.created_at),
          logPreview,
        };
      }),
    };
  } catch (e) {
    return { ok: false, items: [], error: e instanceof Error ? e.message : 'Erreur runs' };
  }
}

/** Upsert le catalogue opérationnel — idempotent (IG + Messenger + WhatsApp). */
export async function ensureWorkflowCatalog(): Promise<{ ok: boolean; upserted: number; error?: string }> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return { ok: false, upserted: 0, error: 'Schema absent.' };

  const { WORKFLOW_CATALOG } = await import('./workflow-catalog');
  const admin = createAdminClient();
  let upserted = 0;

  for (const wf of WORKFLOW_CATALOG) {
    if (!wf?.id) continue;
    const payload = {
      id: wf.id,
      name: wf.name,
      enabled: wf.enabled,
      trigger_type: wf.triggerType,
      trigger_config: wf.triggerConfig,
      conditions: wf.conditions,
      actions: wf.actions,
      updated_at: new Date().toISOString(),
    };
    const { error } = await admin.from('acq_workflows').upsert(payload, { onConflict: 'id' });
    if (!error) upserted += 1;
  }
  return { ok: true, upserted };
}

export async function seedSandboxDemoData(): Promise<{ ok: boolean; error?: string; seeded?: boolean }> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) {
    return { ok: false, error: 'Migration §9 non appliquée — impossible de seed.' };
  }
  const admin = createAdminClient();
  const { count: convCount } = await admin
    .from('acq_conversations')
    .select('id', { count: 'exact', head: true });
  if (convCount && convCount > 0) return { ok: true, seeded: false };

  const now = new Date().toISOString();
  const { data: contact, error: cErr } = await admin
    .from('acq_contacts')
    .insert({
      channel: 'instagram',
      handle: '@demo_mangita',
      lifecycle_stage: 'qualified',
      tags: ['sandbox', 'dm'],
      source_attribution: 'instagram',
      opt_in: false,
    })
    .select('id')
    .single();
  if (cErr || !contact) return { ok: false, error: cErr?.message ?? 'Seed contact failed' };

  const { data: conv, error: vErr } = await admin
    .from('acq_conversations')
    .insert({
      contact_id: contact.id,
      channel: 'instagram',
      status: 'open',
      lifecycle_stage: 'qualified',
      subject: 'Question essai visio',
      last_message_at: now,
      last_message_preview: 'Bonjour, est-ce qu’on me voit vraiment en visio ?',
    })
    .select('id')
    .single();
  if (vErr || !conv) return { ok: false, error: vErr?.message ?? 'Seed conversation failed' };

  await admin.from('acq_messages').insert([
    {
      conversation_id: conv.id,
      direction: 'inbound',
      body: 'Bonjour, est-ce qu’on me voit vraiment en visio ? J’ai peur de me tromper seule.',
      provider: 'instagram',
      sandbox: true,
    },
    {
      conversation_id: conv.id,
      direction: 'system',
      body: '[SANDBOX] Fil démo — aucun message réel envoyé à Meta.',
      provider: 'system',
      sandbox: true,
    },
  ]);

  return { ok: true, seeded: true };
}

/** Nouveau fil sandbox — toujours créé (bouton + inbox). */
export async function createSandboxConversation(): Promise<{
  ok: boolean;
  conversationId?: string;
  error?: string;
}> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) {
    return { ok: false, error: 'Migration §9 non appliquée — impossible de créer un fil.' };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const suffix = Date.now().toString(36).slice(-6);
  const handle = `@sandbox_${suffix}`;

  const { data: contact, error: cErr } = await admin
    .from('acq_contacts')
    .insert({
      channel: 'instagram',
      handle,
      lifecycle_stage: 'new',
      tags: ['sandbox'],
      source_attribution: 'sandbox_manual',
      opt_in: false,
    })
    .select('id')
    .single();
  if (cErr || !contact) return { ok: false, error: cErr?.message ?? 'Création contact impossible' };

  const { data: conv, error: vErr } = await admin
    .from('acq_conversations')
    .insert({
      contact_id: contact.id,
      channel: 'instagram',
      status: 'open',
      lifecycle_stage: 'new',
      subject: `Nouveau fil sandbox ${suffix}`,
      last_message_at: now,
      last_message_preview: 'Fil créé — écris un premier message.',
    })
    .select('id')
    .single();
  if (vErr || !conv) return { ok: false, error: vErr?.message ?? 'Création fil impossible' };

  await admin.from('acq_messages').insert({
    conversation_id: conv.id,
    direction: 'system',
    body: '[SANDBOX] Fil créé depuis l’inbox — aucun message Meta envoyé.',
    provider: 'system',
    sandbox: true,
  });

  return { ok: true, conversationId: String(conv.id) };
}

export async function listUpcomingFollowups(
  limit = 20,
): Promise<{ ok: true; items: AcqFollowupRow[] } | { ok: false; error: string }> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return { ok: true, items: [] };
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('acq_followups')
      .select('id, contact_id, conversation_id, action_type, run_at, status')
      .eq('status', 'scheduled')
      .order('run_at', { ascending: true })
      .limit(limit);
    if (error) return { ok: false, error: error.message };

    const contactIds = [...new Set((data ?? []).map((r) => String(r.contact_id)))];
    const handleById = new Map<string, string | null>();
    if (contactIds.length) {
      const { data: contacts } = await admin.from('acq_contacts').select('id, handle').in('id', contactIds);
      for (const c of contacts ?? []) {
        handleById.set(String(c.id), c.handle ? String(c.handle) : null);
      }
    }

    const items: AcqFollowupRow[] = (data ?? []).map((row) => ({
      id: String(row.id),
      contactId: String(row.contact_id),
      conversationId: row.conversation_id ? String(row.conversation_id) : null,
      actionType: String(row.action_type),
      runAt: String(row.run_at),
      status: row.status as AcqFollowupRow['status'],
      contactHandle: handleById.get(String(row.contact_id)) ?? null,
    }));
    return { ok: true, items };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur liste relances' };
  }
}

const FOLLOWUP_ACTIONS = new Set<WorkflowActionType>([
  'send_message',
  'send_trial_link',
  'qualify_intent',
  'tag_contact',
  'set_lifecycle_stage',
  'book_session_intent',
  'capture_email_optin',
  'escalate_human',
  'mini_poll',
  'broadcast_optin',
  'schedule_followup',
]);

export async function runDueFollowups(limit = 40): Promise<{
  processed: number;
  ok: number;
  failed: number;
  details: string[];
}> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) {
    return { processed: 0, ok: 0, failed: 0, details: ['Tables Acquisition absentes.'] };
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data: due, error } = await admin
    .from('acq_followups')
    .select('id, contact_id, conversation_id, action_type, run_at, payload')
    .eq('status', 'scheduled')
    .lte('run_at', nowIso)
    .order('run_at', { ascending: true })
    .limit(limit);

  if (error) {
    return { processed: 0, ok: 0, failed: 0, details: [error.message] };
  }

  const { runWorkflowAction } = await import('@/lib/acquisition/engine/actions');
  const { detectAcquisitionMarket } = await import('@/lib/acquisition/market');
  const details: string[] = [];
  let okCount = 0;
  let failCount = 0;

  for (const row of due ?? []) {
    const id = String(row.id);
    const actionType = String(row.action_type) as WorkflowActionType;
    if (!FOLLOWUP_ACTIONS.has(actionType)) {
      await admin.from('acq_followups').update({ status: 'error' }).eq('id', id);
      failCount += 1;
      details.push(`${id}: action inconnue « ${actionType} »`);
      continue;
    }

    let conversationId = row.conversation_id ? String(row.conversation_id) : null;
    if (!conversationId) {
      const latest = await getLatestConversationForContact(String(row.contact_id));
      conversationId = latest?.id ?? null;
    }
    if (!conversationId) {
      await admin.from('acq_followups').update({ status: 'error' }).eq('id', id);
      failCount += 1;
      details.push(`${id}: conversation introuvable`);
      continue;
    }

    const detail = await getConversationWithMessages(conversationId);
    if (!detail.ok) {
      await admin.from('acq_followups').update({ status: 'error' }).eq('id', id);
      failCount += 1;
      details.push(`${id}: ${detail.error}`);
      continue;
    }

    const contact = await getContact(String(row.contact_id));
    if (contact && contact.tags.includes('optout')) {
      await admin.from('acq_followups').update({ status: 'cancelled' }).eq('id', id);
      details.push(`${id}: annulé — opt-out`);
      continue;
    }
    if (contact && (contact.lifecycleStage === 'trial' || contact.lifecycleStage === 'paid' || contact.lifecycleStage === 'member')) {
      await admin.from('acq_followups').update({ status: 'cancelled' }).eq('id', id);
      details.push(`${id}: annulé — déjà ${contact.lifecycleStage}`);
      continue;
    }

    const lastInbound =
      [...detail.messages].reverse().find((m) => m.direction === 'inbound')?.body ??
      detail.conversation.lastMessagePreview ??
      '';
    const market = detectAcquisitionMarket(lastInbound);

    const payload =
      row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
        ? (row.payload as Record<string, unknown>)
        : {};

    const result = await runWorkflowAction(
      { type: actionType, config: payload },
      { contact, conversation: detail.conversation, market },
    );

    await admin
      .from('acq_followups')
      .update({ status: result.ok ? 'sent' : 'error' })
      .eq('id', id);

    if (result.ok) {
      okCount += 1;
      details.push(`${id}: OK — ${result.detail}`);
    } else {
      failCount += 1;
      details.push(`${id}: ${result.detail}`);
    }
  }

  return {
    processed: (due ?? []).length,
    ok: okCount,
    failed: failCount,
    details,
  };
}

/**
 * Aligne les stages CRM Acquisition sur les abonnements Stripe (email + profile_id).
 * trial = trialing · paid = active. Synchronise aussi les conversations.
 */
export async function syncAcqLifecycleFromSubscriptions(): Promise<{
  updated: number;
  checked: number;
  emailsHarvested: number;
  details: string[];
}> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return { updated: 0, checked: 0, emailsHarvested: 0, details: ['schema absent'] };

  const admin = createAdminClient();
  const harvested = await harvestEmailsFromRecentInbound(80);

  const { data: contacts, error } = await admin
    .from('acq_contacts')
    .select('id, email, lifecycle_stage, profile_id, lead_score')
    .or('email.not.is.null,profile_id.not.is.null')
    .limit(800);

  if (error || !contacts?.length) {
    return {
      updated: 0,
      checked: 0,
      emailsHarvested: harvested,
      details: [error?.message ?? 'aucun contact e-mail/profil'],
    };
  }

  const { findUserIdByEmail } = await import('@/lib/stripe/find-user-by-email');
  const { clampLeadScore, scoreForLifecycle } = await import('./lead-score');

  const emailToUser = new Map<string, string>();
  const userIds = new Set<string>();

  for (const c of contacts) {
    if (c.profile_id) userIds.add(String(c.profile_id));
    const email = c.email ? String(c.email).toLowerCase() : '';
    if (!email) continue;
    if (c.profile_id) {
      emailToUser.set(email, String(c.profile_id));
      continue;
    }
    const userId = await findUserIdByEmail(admin, email);
    if (userId) {
      emailToUser.set(email, userId);
      userIds.add(userId);
      await admin
        .from('acq_contacts')
        .update({ profile_id: userId, updated_at: new Date().toISOString() })
        .eq('id', c.id);
    }
  }

  if (!userIds.size) {
    return {
      updated: 0,
      checked: contacts.length,
      emailsHarvested: harvested,
      details: ['aucun profil match'],
    };
  }

  const { data: subs } = await admin
    .from('subscriptions')
    .select('user_id, status')
    .in('user_id', [...userIds])
    .in('status', ['trialing', 'active']);

  const statusByUser = new Map<string, 'trialing' | 'active'>();
  for (const s of subs ?? []) {
    const uid = String(s.user_id);
    const st = s.status === 'trialing' ? 'trialing' : 'active';
    if (st === 'active' || !statusByUser.has(uid)) statusByUser.set(uid, st);
  }

  let updated = 0;
  const details: string[] = harvested
    ? [`${harvested} e-mail(s) récoltés depuis les DM`]
    : [];

  for (const c of contacts) {
    const email = c.email ? String(c.email).toLowerCase() : '';
    const userId = (c.profile_id ? String(c.profile_id) : null) || (email ? emailToUser.get(email) : null);
    if (!userId) continue;
    const sub = statusByUser.get(userId);
    if (!sub) continue;
    const next: LifecycleStage = sub === 'trialing' ? 'trial' : 'paid';
    const current = (c.lifecycle_stage as LifecycleStage) ?? 'new';
    if (current === next || current === 'member') continue;
    if (current === 'paid' && next === 'trial') continue;
    const nextScore = clampLeadScore(Number(c.lead_score ?? 0) + scoreForLifecycle(next));
    const { error: upErr } = await admin
      .from('acq_contacts')
      .update({
        lifecycle_stage: next,
        lead_score: nextScore,
        profile_id: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', c.id);
    if (!upErr) {
      await admin
        .from('acq_conversations')
        .update({ lifecycle_stage: next, updated_at: new Date().toISOString() })
        .eq('contact_id', c.id);
      // Stoppe relances DM + nurture quiz dès qu’elle convertit
      await admin
        .from('acq_followups')
        .update({ status: 'cancelled' })
        .eq('contact_id', c.id)
        .eq('status', 'scheduled');
      if (email && (next === 'trial' || next === 'paid')) {
        const { cancelQuizNurtureForEmail } = await import('@/lib/quiz/lead-nurture');
        await cancelQuizNurtureForEmail(email, next === 'paid' ? 'paid' : 'trial');
      }
      updated += 1;
      details.push(`${email || userId}: ${current} → ${next}`);
    }
  }

  return { updated, checked: contacts.length, emailsHarvested: harvested, details };
}

/** Scanne les messages inbound récents pour rattacher un e-mail au contact. */
export async function harvestEmailsFromRecentInbound(limit = 60): Promise<number> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) return 0;
  const admin = createAdminClient();
  const { extractEmailFromText } = await import('./lead-score');
  const { data: msgs } = await admin
    .from('acq_messages')
    .select('body, conversation_id')
    .eq('direction', 'inbound')
    .order('created_at', { ascending: false })
    .limit(limit);

  let harvested = 0;
  const seenConv = new Set<string>();
  for (const m of msgs ?? []) {
    const convId = String(m.conversation_id);
    if (seenConv.has(convId)) continue;
    const email = extractEmailFromText(String(m.body ?? ''));
    if (!email) continue;
    seenConv.add(convId);
    const { data: conv } = await admin
      .from('acq_conversations')
      .select('contact_id')
      .eq('id', convId)
      .maybeSingle();
    if (!conv?.contact_id) continue;
    const { data: contact } = await admin
      .from('acq_contacts')
      .select('id, email')
      .eq('id', conv.contact_id)
      .maybeSingle();
    if (!contact || contact.email) continue;
    const r = await updateContactEmail(String(contact.id), email, true);
    if (r.ok) harvested += 1;
  }
  return harvested;
}
