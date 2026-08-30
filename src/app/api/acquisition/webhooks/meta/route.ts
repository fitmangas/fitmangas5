import { NextResponse } from 'next/server';

import { isAcquisitionSchemaReady } from '@/lib/acquisition/db';
import { runInboundTrigger } from '@/lib/acquisition/engine/orchestrator';
import { getContact, listWorkflows } from '@/lib/acquisition/engine/repository';
import { createAdminClient } from '@/lib/supabase/admin';
import type { AcquisitionChannel, WorkflowTriggerType } from '@/lib/acquisition/types';

export const dynamic = 'force-dynamic';

type MetaWebhookEntry = {
  id?: string;
  messaging?: Array<{
    sender?: { id?: string };
    recipient?: { id?: string };
    message?: { mid?: string; text?: string };
    timestamp?: number;
  }>;
};

function triggerForChannel(channel: AcquisitionChannel): WorkflowTriggerType {
  if (channel === 'instagram') return 'ig_dm_inbound';
  if (channel === 'facebook') return 'messenger_inbound';
  if (channel === 'whatsapp') return 'whatsapp_inbound';
  return 'email_inbound';
}

/** Vérification webhook Meta (GET) + réception événements (POST). */
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
    const body = (await request.json()) as {
      object?: string;
      entry?: MetaWebhookEntry[];
    };

    const schemaReady = await isAcquisitionSchemaReady();
    if (!schemaReady) {
      return NextResponse.json({ ok: true, stored: false, reason: 'schema_not_ready' });
    }

    const admin = createAdminClient();
    let stored = 0;
    let workflowsRun = 0;

    const wfRes = await listWorkflows();
    const workflows = wfRes.ok ? wfRes.items : [];

    for (const entry of body.entry ?? []) {
      for (const msg of entry.messaging ?? []) {
        const text = msg.message?.text?.trim();
        const senderId = msg.sender?.id;
        if (!text || !senderId) continue;

        const channel: AcquisitionChannel = body.object === 'instagram' ? 'instagram' : 'facebook';
        const handle = `@meta_${senderId.slice(-8)}`;

        let contactId: string | undefined;
        const { data: existingContact } = await admin
          .from('acq_contacts')
          .select('id')
          .eq('handle', handle)
          .eq('channel', channel)
          .maybeSingle();

        if (existingContact?.id) {
          contactId = String(existingContact.id);
        } else {
          const { data: inserted } = await admin
            .from('acq_contacts')
            .insert({
              channel,
              handle,
              lifecycle_stage: 'new',
              external_ids: { meta_sender_id: senderId },
            })
            .select('id')
            .maybeSingle();
          contactId = inserted?.id ? String(inserted.id) : undefined;
        }
        if (!contactId) continue;

        let conversationId: string | undefined;
        const { data: existingConv } = await admin
          .from('acq_conversations')
          .select('id')
          .eq('contact_id', contactId)
          .eq('external_thread_id', senderId)
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
        if (!conversationId) continue;

        await admin.from('acq_messages').insert({
          conversation_id: conversationId,
          direction: 'inbound',
          body: text,
          provider: channel,
          external_message_id: msg.message?.mid ?? null,
          sandbox: false,
        });

        await admin
          .from('acq_conversations')
          .update({ last_message_at: new Date().toISOString(), last_message_preview: text.slice(0, 120) })
          .eq('id', conversationId);

        stored += 1;

        const contact = await getContact(contactId);
        const { data: convRow } = await admin.from('acq_conversations').select('*').eq('id', conversationId).maybeSingle();
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
          };

          const results = await runInboundTrigger({
            triggerType: triggerForChannel(channel),
            conversation,
            contactId,
            inboundText: text,
            workflows,
          });
          workflowsRun += results.length;
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
