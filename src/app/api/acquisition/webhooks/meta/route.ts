import { NextResponse } from 'next/server';

import { isAcquisitionSchemaReady } from '@/lib/acquisition/db';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type MetaWebhookEntry = {
  id?: string;
  messaging?: Array<{
    sender?: { id?: string };
    recipient?: { id?: string };
    message?: { mid?: string; text?: string };
    timestamp?: number;
  }>;
  changes?: Array<{
    field?: string;
    value?: {
      id?: string;
      text?: string;
      from?: { id?: string; username?: string };
      media?: { id?: string };
    };
  }>;
};

/** Vérification webhook Meta (GET) + réception événements (POST) — préparé LIVE, sans activer MESSAGING_MODE. */
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

    for (const entry of body.entry ?? []) {
      for (const msg of entry.messaging ?? []) {
        const text = msg.message?.text?.trim();
        const senderId = msg.sender?.id;
        if (!text || !senderId) continue;

        const channel = body.object === 'instagram' ? 'instagram' : 'facebook';
        const handle = `@${senderId.slice(-8)}`;

        const { data: contactRow } = await admin
          .from('acq_contacts')
          .insert({
            channel,
            handle,
            lifecycle_stage: 'new',
            external_ids: { meta_sender_id: senderId },
          })
          .select('id')
          .maybeSingle();

        let contactId = contactRow?.id as string | undefined;
        if (!contactId) {
          const { data: existing } = await admin
            .from('acq_contacts')
            .select('id')
            .eq('handle', handle)
            .eq('channel', channel)
            .maybeSingle();
          contactId = existing?.id as string | undefined;
        }
        if (!contactId) continue;

        const { data: conv } = await admin
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

        const conversationId = conv?.id as string | undefined;
        if (!conversationId) continue;

        await admin.from('acq_messages').insert({
          conversation_id: conversationId,
          direction: 'inbound',
          body: text,
          provider: channel,
          external_message_id: msg.message?.mid ?? null,
          sandbox: false,
        });
        stored += 1;
      }
    }

    return NextResponse.json({ ok: true, stored });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Erreur webhook Meta' },
      { status: 500 },
    );
  }
}
