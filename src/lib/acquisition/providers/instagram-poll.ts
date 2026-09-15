import { createAdminClient } from '@/lib/supabase/admin';

import { getAcquisitionMetaConnection } from '@/lib/acquisition/providers/meta-live';

type IgParticipant = { id?: string; username?: string };
type IgMessage = {
  id?: string;
  message?: string;
  created_time?: string;
  from?: { id?: string; username?: string };
};

/** Rattrapage DM IG via Graph (secours si webhook signature KO). */
export async function pollInstagramInbox(params?: {
  conversationLimit?: number;
  messagesPerThread?: number;
}): Promise<{ ok: boolean; imported: number; error?: string }> {
  const conn = await getAcquisitionMetaConnection();
  if (!conn.accessToken || !conn.igUserId) {
    return { ok: false, imported: 0, error: 'Token IG Acquisition absent.' };
  }

  const token = conn.accessToken;
  const ourIgId = String(conn.igUserId);
  const conversationLimit = params?.conversationLimit ?? 10;
  const messagesPerThread = params?.messagesPerThread ?? 20;

  try {
    const convsRes = await fetch(
      `https://graph.instagram.com/v21.0/me/conversations?platform=instagram&fields=id,updated_time,participants&limit=${conversationLimit}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const convsJson = (await convsRes.json()) as {
      data?: Array<{ id: string; participants?: { data?: IgParticipant[] } }>;
      error?: { message?: string };
    };
    if (!convsRes.ok) {
      return { ok: false, imported: 0, error: convsJson.error?.message ?? `IG conversations ${convsRes.status}` };
    }

    const admin = createAdminClient();
    let imported = 0;

    for (const c of convsJson.data ?? []) {
      const others = (c.participants?.data ?? []).filter((p) => String(p.id) !== ourIgId);
      if (!others.length) continue;
      const peer = others[0]!;
      const senderId = String(peer.id);
      const handle = peer.username ? `@${peer.username}` : `@meta_${senderId.slice(-8)}`;

      const msgsRes = await fetch(
        `https://graph.instagram.com/v21.0/${c.id}?fields=messages.limit(${messagesPerThread}){id,message,from,created_time}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const msgsJson = (await msgsRes.json()) as { messages?: { data?: IgMessage[] } };
      const messages = [...(msgsJson.messages?.data ?? [])].sort((a, b) => {
        const ta = a.created_time ? Date.parse(a.created_time) : 0;
        const tb = b.created_time ? Date.parse(b.created_time) : 0;
        return ta - tb;
      });

      let newestAt: string | null = null;
      let newestPreview: string | null = null;

      for (const m of messages) {
        const text = (m.message ?? '').trim();
        const mid = m.id;
        if (!text || !mid) continue;

        const { data: existing } = await admin
          .from('acq_messages')
          .select('id')
          .eq('external_message_id', mid)
          .maybeSingle();
        if (existing) {
          if (m.created_time && (!newestAt || Date.parse(m.created_time) >= Date.parse(newestAt))) {
            newestAt = m.created_time;
            newestPreview = text.slice(0, 120);
          }
          continue;
        }

        const fromUs = String(m.from?.id) === ourIgId;
        const direction = fromUs ? 'outbound' : 'inbound';

        let contactId: string | undefined;
        const { data: existingContact } = await admin
          .from('acq_contacts')
          .select('id')
          .eq('handle', handle)
          .eq('channel', 'instagram')
          .maybeSingle();
        if (existingContact?.id) {
          contactId = String(existingContact.id);
        } else {
          const { data: inserted } = await admin
            .from('acq_contacts')
            .insert({
              channel: 'instagram',
              handle,
              lifecycle_stage: 'new',
              external_ids: { meta_sender_id: senderId, ig_username: peer.username ?? null },
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
              channel: 'instagram',
              status: 'open',
              lifecycle_stage: 'new',
              subject: `IG ${handle}`,
              external_thread_id: senderId,
              last_message_at: m.created_time ?? new Date().toISOString(),
              last_message_preview: text.slice(0, 120),
            })
            .select('id')
            .maybeSingle();
          conversationId = insertedConv?.id ? String(insertedConv.id) : undefined;
        }
        if (!conversationId) continue;

        await admin.from('acq_messages').insert({
          conversation_id: conversationId,
          direction,
          body: text,
          provider: 'instagram',
          external_message_id: mid,
          sandbox: false,
          ...(m.created_time ? { created_at: m.created_time } : {}),
        });
        if (m.created_time && (!newestAt || Date.parse(m.created_time) >= Date.parse(newestAt))) {
          newestAt = m.created_time;
          newestPreview = text.slice(0, 120);
        }
        imported += 1;
      }

      if (newestAt && newestPreview) {
        const { data: convRow } = await admin
          .from('acq_conversations')
          .select('id, last_message_at')
          .eq('external_thread_id', senderId)
          .eq('channel', 'instagram')
          .maybeSingle();
        if (convRow?.id) {
          const current = convRow.last_message_at ? Date.parse(String(convRow.last_message_at)) : 0;
          if (Date.parse(newestAt) >= current) {
            await admin
              .from('acq_conversations')
              .update({ last_message_at: newestAt, last_message_preview: newestPreview })
              .eq('id', convRow.id);
          }
        }
      }
    }

    return { ok: true, imported };
  } catch (e) {
    return { ok: false, imported: 0, error: e instanceof Error ? e.message : 'Erreur poll IG' };
  }
}
