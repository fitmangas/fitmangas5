import { createAdminClient } from '@/lib/supabase/admin';

import { isAcquisitionSchemaReady } from '@/lib/acquisition/db';
import type {
  AcqContact,
  AcqConversation,
  AcqMessage,
  AcqWorkflow,
  AcquisitionChannel,
  LifecycleStage,
} from '@/lib/acquisition/types';

type DbError = { ok: false; error: string; schemaReady: boolean };

function mapContact(row: Record<string, unknown>): AcqContact {
  return {
    id: String(row.id),
    channel: row.channel as AcquisitionChannel,
    handle: row.handle ? String(row.handle) : null,
    email: row.email ? String(row.email) : null,
    optIn: Boolean(row.opt_in),
    lifecycleStage: (row.lifecycle_stage as LifecycleStage) ?? 'new',
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    sourceAttribution: row.source_attribution ? String(row.source_attribution) : null,
    createdAt: String(row.created_at),
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
    if (contactIds.length) {
      const { data: contacts } = await admin.from('acq_contacts').select('id, handle').in('id', contactIds);
      for (const c of contacts ?? []) {
        handles.set(String(c.id), c.handle ? String(c.handle) : null);
      }
    }
    const items = (data ?? []).map((row) =>
      mapConversation({
        ...row,
        contact_handle: handles.get(String(row.contact_id)) ?? null,
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
    const { data, error } = await admin.from('acq_workflows').select('*').order('name');
    if (error) {
      return { ok: true, items: defaultWorkflows(), schemaReady: true };
    }
    const items = (data ?? []).map((row) => mapWorkflowRow(row as Record<string, unknown>));
    return { ok: true, items: items.length ? items : defaultWorkflows(), schemaReady: true };
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
  return [
    {
      id: 'wf-ig-keyword-trial',
      name: 'Commentaire IG « ESSAI » → lien essai',
      enabled: true,
      triggerType: 'ig_comment_keyword',
      triggerConfig: { keyword: 'essai' },
      conditions: {},
      actions: [
        { type: 'send_message', config: { body: 'Merci pour ton commentaire ! Voici ton essai 7 jours FitMangas :' } },
        { type: 'send_trial_link' },
        { type: 'set_lifecycle_stage', config: { stage: 'trial' } },
      ],
    },
    {
      id: 'wf-dm-qualify',
      name: 'Nouveau DM → qualifier + réponse concierge',
      enabled: true,
      triggerType: 'ig_dm_inbound',
      triggerConfig: {},
      conditions: {},
      actions: [{ type: 'qualify_intent' }, { type: 'send_message' }],
    },
    {
      id: 'wf-hot-escalate',
      name: 'Lead chaud → escalade Alejandra',
      enabled: true,
      triggerType: 'whatsapp_inbound',
      triggerConfig: {},
      conditions: { lifecycle_in: ['qualified', 'trial'] },
      actions: [{ type: 'escalate_human' }],
    },
  ];
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
  const { error } = await admin.from('acq_contacts').update({ lifecycle_stage: stage }).eq('id', contactId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
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
    })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: String(data.id) };
}

export async function recordWorkflowRun(params: {
  workflowId: string;
  contactId?: string;
  conversationId?: string;
  status: 'ok' | 'error' | 'partial';
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

export async function seedSandboxDemoData(): Promise<{ ok: boolean; error?: string; seeded?: boolean }> {
  const schemaReady = await isAcquisitionSchemaReady();
  if (!schemaReady) {
    return { ok: false, error: 'Migration §9 non appliquée — impossible de seed.' };
  }
  const admin = createAdminClient();
  const { count } = await admin.from('acq_contacts').select('id', { count: 'exact', head: true });
  if (count && count > 0) return { ok: true, seeded: false };

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
