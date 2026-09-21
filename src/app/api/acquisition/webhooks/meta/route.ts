import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

import { isAcquisitionSchemaReady } from '@/lib/acquisition/db';
import { runInboundTrigger } from '@/lib/acquisition/engine/orchestrator';
import {
  bumpContactLeadScore,
  getContact,
  listWorkflows,
  updateContactEmail,
} from '@/lib/acquisition/engine/repository';
import { LEAD_SCORE_DELTA, extractEmailFromText } from '@/lib/acquisition/engine/lead-score';
import { detectAcquisitionMarket } from '@/lib/acquisition/market';
import { createAdminClient } from '@/lib/supabase/admin';
import type { AcquisitionChannel, WorkflowTriggerType } from '@/lib/acquisition/types';

export const dynamic = 'force-dynamic';

type MetaMessagingEvent = {
  sender?: { id?: string };
  recipient?: { id?: string };
  message?: {
    mid?: string;
    text?: string;
    reply_to?: { story?: { id?: string; url?: string } };
    is_echo?: boolean;
    quick_reply?: { payload?: string };
  };
  /** Clic bouton DANS la bulle (generic / button template) */
  postback?: {
    mid?: string;
    title?: string;
    payload?: string;
  };
  timestamp?: number;
};

type MetaWebhookEntry = {
  id?: string;
  messaging?: MetaMessagingEvent[];
  changes?: Array<{
    field?: string;
    value?: {
      id?: string;
      text?: string;
      from?: { id?: string; username?: string };
      media?: { id?: string };
      contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
      messages?: Array<{
        from?: string;
        id?: string;
        type?: string;
        text?: { body?: string };
        interactive?: {
          type?: string;
          button_reply?: { id?: string; title?: string };
          list_reply?: { id?: string; title?: string };
        };
        button?: { payload?: string; text?: string };
      }>;
    };
  }>;
};

function triggerForChannel(channel: AcquisitionChannel): WorkflowTriggerType {
  if (channel === 'instagram') return 'ig_dm_inbound';
  if (channel === 'facebook') return 'messenger_inbound';
  if (channel === 'whatsapp') return 'whatsapp_inbound';
  return 'email_inbound';
}

function verifyMetaSignature(rawBody: string, request: Request): boolean {
  const secrets = [
    process.env.INSTAGRAM_APP_SECRET?.trim(),
    process.env.META_IG_APP_SECRET?.trim(),
    process.env.META_APP_SECRET?.trim(),
    process.env.META_APP_CLIENT_TOKEN?.trim(),
    process.env.META_CLIENT_TOKEN?.trim(),
  ].filter((s): s is string => Boolean(s));

  if (secrets.length === 0) return false;

  const sig256 = request.headers.get('x-hub-signature-256');
  const sig1 = request.headers.get('x-hub-signature');

  const checks: Array<{ prefix: string; algo: string; header: string | null }> = [
    { prefix: 'sha256=', algo: 'sha256', header: sig256 },
    { prefix: 'sha1=', algo: 'sha1', header: sig1 },
  ];

  for (const secret of secrets) {
    for (const { prefix, algo, header } of checks) {
      if (!header?.startsWith(prefix)) continue;
      const expected = createHmac(algo, secret).update(rawBody, 'utf8').digest('hex');
      const received = header.slice(prefix.length).trim();
      try {
        const a = Buffer.from(expected, 'hex');
        const b = Buffer.from(received, 'hex');
        if (a.length === b.length && timingSafeEqual(a, b)) return true;
      } catch {
        // essayer secret / algo suivant
      }
    }
  }
  return false;
}

async function ingestInbound(params: {
  channel: AcquisitionChannel;
  senderId: string;
  text: string;
  externalMessageId?: string | null;
  handleOverride?: string | null;
  triggerType?: WorkflowTriggerType;
  commentId?: string | null;
}): Promise<{ stored: boolean; workflowsRun: number; skippedDuplicate?: boolean }> {
  const admin = createAdminClient();
  const { channel, senderId, text } = params;
  const handle =
    params.handleOverride?.trim() ||
    (channel === 'whatsapp' ? `wa_${senderId.slice(-10)}` : `@meta_${senderId.slice(-8)}`);

  // Anti-doublon Meta : même mid déjà traité (webhook retry / poll + webhook)
  if (params.externalMessageId) {
    const { data: dupMid } = await admin
      .from('acq_messages')
      .select('id')
      .eq('external_message_id', params.externalMessageId)
      .limit(1)
      .maybeSingle();
    if (dupMid?.id) {
      return { stored: false, workflowsRun: 0, skippedDuplicate: true };
    }
  }

  let contactId: string | undefined;
  const { data: byHandle } = await admin
    .from('acq_contacts')
    .select('id, handle')
    .eq('handle', handle)
    .eq('channel', channel)
    .maybeSingle();
  if (byHandle?.id) contactId = String(byHandle.id);

  if (!contactId && channel !== 'whatsapp') {
    const { data: bySender } = await admin
      .from('acq_contacts')
      .select('id, handle')
      .eq('channel', channel)
      .contains('external_ids', { meta_sender_id: senderId })
      .limit(1)
      .maybeSingle();
    if (bySender?.id) contactId = String(bySender.id);
  }

  if (!contactId) {
    const { data: byThread } = await admin
      .from('acq_conversations')
      .select('id, contact_id')
      .eq('external_thread_id', senderId)
      .eq('channel', channel)
      .limit(1)
      .maybeSingle();
    if (byThread?.contact_id) contactId = String(byThread.contact_id);
  }

  if (!contactId) {
    const externalKey = channel === 'whatsapp' ? 'whatsapp_wa_id' : 'meta_sender_id';
    const { data: inserted } = await admin
      .from('acq_contacts')
      .insert({
        channel,
        handle,
        lifecycle_stage: 'new',
        opt_in: true,
        external_ids: { [externalKey]: senderId },
      })
      .select('id')
      .maybeSingle();
    contactId = inserted?.id ? String(inserted.id) : undefined;
  }
  if (!contactId) return { stored: false, workflowsRun: 0 };

  let conversationId: string | undefined;
  const { data: existingConv } = await admin
    .from('acq_conversations')
    .select('id')
    .eq('external_thread_id', senderId)
    .eq('channel', channel)
    .maybeSingle();

  if (existingConv?.id) {
    conversationId = String(existingConv.id);
  } else {
    const { data: insertedConv } = await admin
      .from('acq_conversations')
      .insert({
        contact_id: contactId,
        channel,
        status: 'open',
        lifecycle_stage: 'new',
        subject: `Webhook ${channel}`,
        external_thread_id: senderId,
        last_message_at: new Date().toISOString(),
        last_message_preview: text.slice(0, 120),
      })
      .select('id')
      .maybeSingle();
    conversationId = insertedConv?.id ? String(insertedConv.id) : undefined;
  }
  if (!conversationId) return { stored: false, workflowsRun: 0 };

  // Même texte entrant dans les 2 min → pas de 2e déclenchement workflow (bonjour ×2, etc.)
  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const { data: recentSameBody } = await admin
    .from('acq_messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('direction', 'inbound')
    .eq('body', text)
    .gte('created_at', twoMinAgo)
    .limit(1)
    .maybeSingle();
  if (recentSameBody?.id) {
    return { stored: false, workflowsRun: 0, skippedDuplicate: true };
  }

  const { error: msgErr } = await admin.from('acq_messages').insert({
    conversation_id: conversationId,
    direction: 'inbound',
    body: text,
    provider: channel,
    external_message_id: params.externalMessageId ?? null,
    sandbox: false,
  });
  // Conflit UNIQUE mid (webhook + poll en parallèle) → ignorer
  if (msgErr) {
    if (String(msgErr.code) === '23505' || /duplicate|unique/i.test(msgErr.message ?? '')) {
      return { stored: false, workflowsRun: 0, skippedDuplicate: true };
    }
    console.error('[acquisition meta] insert message', msgErr);
    return { stored: false, workflowsRun: 0 };
  }

  await admin
    .from('acq_conversations')
    .update({ last_message_at: new Date().toISOString(), last_message_preview: text.slice(0, 120) })
    .eq('id', conversationId);

  await bumpContactLeadScore(contactId, LEAD_SCORE_DELTA.inbound_message);
  await admin
    .from('acq_contacts')
    .update({ opt_in: true, updated_at: new Date().toISOString() })
    .eq('id', contactId)
    .not('tags', 'cs', '{optout}');
  const emailInText = extractEmailFromText(text);
  if (emailInText) {
    await updateContactEmail(contactId, emailInText, true);
  }

  // Quiz nurture WA en attente d’opt-in (fenêtre 24h ouverte par son message)
  if (channel === 'whatsapp') {
    try {
      const { tryFulfillPendingQuizWhatsApp } = await import('@/lib/quiz/lead-nurture');
      await tryFulfillPendingQuizWhatsApp(senderId);
    } catch (e) {
      console.error('[acquisition meta] quiz wa fulfill', e);
    }
  }

  const wfRes = await listWorkflows();
  const workflows = wfRes.ok ? wfRes.items : [];
  const contact = await getContact(contactId);
  const { data: convRow } = await admin.from('acq_conversations').select('*').eq('id', conversationId).maybeSingle();
  let workflowsRun = 0;
  if (convRow && contact) {
    const conversation = {
      id: String(convRow.id),
      contactId,
      channel,
      status: convRow.status as 'open',
      lifecycleStage: (convRow.lifecycle_stage as 'new') ?? 'new',
      subject: convRow.subject ? String(convRow.subject) : null,
      lastMessageAt: convRow.last_message_at ? String(convRow.last_message_at) : null,
      lastMessagePreview: convRow.last_message_preview ? String(convRow.last_message_preview) : null,
      assignedTo: convRow.assigned_to ? String(convRow.assigned_to) : null,
      contactHandle: contact.handle,
      externalThreadId: senderId,
    };
    const results = await runInboundTrigger({
      triggerType: params.triggerType ?? triggerForChannel(channel),
      conversation,
      contactId,
      inboundText: text,
      market: detectAcquisitionMarket(text),
      commentId: params.commentId ?? null,
      workflows,
    });
    workflowsRun = results.length;
  }

  return { stored: true, workflowsRun };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  const expected = process.env.ACQUISITION_META_VERIFY_TOKEN?.trim();

  if (mode === 'subscribe' && expected && token === expected && challenge) {
    return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return NextResponse.json({ error: 'Verification Meta échouée.' }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signatureOk = verifyMetaSignature(rawBody, request);
    const allowUnsigned = process.env.ACQUISITION_META_ALLOW_UNSIGNED?.trim() === '1';
    if (!signatureOk) {
      console.error('[meta-webhook] signature invalide', {
        hasSha256: Boolean(request.headers.get('x-hub-signature-256')),
        hasSha1: Boolean(request.headers.get('x-hub-signature')),
        bodyLen: rawBody.length,
        hasIgSecret: Boolean(
          process.env.INSTAGRAM_APP_SECRET?.trim() || process.env.META_IG_APP_SECRET?.trim(),
        ),
        hasFbSecret: Boolean(process.env.META_APP_SECRET?.trim()),
        allowUnsigned,
      });
      if (!allowUnsigned) {
        return NextResponse.json({ error: 'Signature Meta invalide.' }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody) as {
      object?: string;
      entry?: MetaWebhookEntry[];
    };

    const schemaReady = await isAcquisitionSchemaReady();
    if (!schemaReady) {
      return NextResponse.json({ ok: true, stored: false, reason: 'schema_not_ready' });
    }

    let stored = 0;
    let workflowsRun = 0;

    for (const entry of body.entry ?? []) {
      for (const msg of entry.messaging ?? []) {
        if (msg.message?.is_echo) continue;
        const rawText = msg.message?.text?.trim() ?? '';
        const qrPayload = msg.message?.quick_reply?.payload?.trim() ?? '';
        const postbackTitle = msg.postback?.title?.trim() ?? '';
        const postbackPayload = msg.postback?.payload?.trim() ?? '';
        const text = [rawText, qrPayload, postbackTitle, postbackPayload]
          .filter(Boolean)
          .join(' ')
          .trim();
        const senderId = msg.sender?.id;
        if (!text || !senderId) continue;
        const channel: AcquisitionChannel = body.object === 'instagram' ? 'instagram' : 'facebook';
        const isStoryReply = Boolean(msg.message?.reply_to?.story);
        const r = await ingestInbound({
          channel,
          senderId,
          text,
          externalMessageId: msg.postback?.mid ?? msg.message?.mid ?? null,
          triggerType: isStoryReply
            ? 'ig_story_reply'
            : channel === 'instagram'
              ? 'ig_dm_inbound'
              : triggerForChannel(channel),
        });
        if (r.stored) stored += 1;
        workflowsRun += r.workflowsRun;
      }

      if (body.object === 'instagram') {
        for (const change of entry.changes ?? []) {
          if (change.field !== 'comments') continue;
          const value = change.value;
          const text = value?.text?.trim();
          const commentId = value?.id;
          const senderId = value?.from?.id;
          const username = value?.from?.username;
          if (!text || !senderId || !commentId) continue;
          const r = await ingestInbound({
            channel: 'instagram',
            senderId,
            text,
            externalMessageId: `comment_${commentId}`,
            handleOverride: username ? `@${username}` : null,
            triggerType: 'ig_comment_keyword',
            commentId,
          });
          if (r.stored) stored += 1;
          workflowsRun += r.workflowsRun;
        }
      }

      if (body.object === 'whatsapp_business_account') {
        for (const change of entry.changes ?? []) {
          if (change.field !== 'messages') continue;
          const value = change.value;
          const waMessages = value?.messages ?? [];
          for (const m of waMessages) {
            const type = m.type ?? 'text';
            let text = '';
            if (type === 'text') {
              text = m.text?.body?.trim() ?? '';
            } else if (type === 'interactive') {
              const br = m.interactive?.button_reply;
              const lr = m.interactive?.list_reply;
              text = [br?.title, br?.id, lr?.title, lr?.id].filter(Boolean).join(' ').trim();
            } else if (type === 'button') {
              text = [m.button?.text, m.button?.payload].filter(Boolean).join(' ').trim();
            } else {
              continue;
            }
            const senderId = m.from;
            if (!text || !senderId) continue;
            const profileName = value?.contacts?.[0]?.profile?.name;
            const r = await ingestInbound({
              channel: 'whatsapp',
              senderId,
              text,
              externalMessageId: m.id ?? null,
              handleOverride: profileName ? `wa_${profileName.replace(/\s+/g, '_').slice(0, 24)}` : null,
            });
            if (r.stored) stored += 1;
            workflowsRun += r.workflowsRun;
          }
        }
      }
    }

    return NextResponse.json({ ok: true, stored, workflowsRun });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Erreur webhook Meta' },
      { status: 500 },
    );
  }
}
