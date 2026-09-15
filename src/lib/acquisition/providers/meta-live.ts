import { createAdminClient } from '@/lib/supabase/admin';
import { getMetaSocialConnection, type MetaSocialConnection } from '@/lib/admin/social-comms';
import { isAcquisitionSchemaReady } from '@/lib/acquisition/db';

export const ACQUISITION_META_SETTING_KEY = 'acquisition_meta_connection';

export type AcquisitionMetaConnection = MetaSocialConnection & {
  messagingScopesVerified?: boolean;
  whatsappPhoneNumberId?: string | null;
};

export type MetaLiveReadiness = {
  messagingMode: 'sandbox' | 'live';
  verifyTokenConfigured: boolean;
  metaAppConfigured: boolean;
  acquisitionConnection: boolean;
  cmConnectionFallback: boolean;
  pageId: string | null;
  igUserId: string | null;
  idsDistinct: boolean;
  tokenPresent: boolean;
  tokenExpired: boolean;
  webhookUrl: string;
  readyForLive: boolean;
  blockers: string[];
  notes: string[];
};

/** Messenger / WhatsApp Cloud API */
const GRAPH = 'https://graph.facebook.com/v21.0';
/** Instagram API with Instagram Login (tokens IGAA…) */
const GRAPH_IG = 'https://graph.instagram.com/v21.0';

function emptyConnection(): AcquisitionMetaConnection {
  return {
    connected: false,
    pageId: null,
    pageName: null,
    igUserId: null,
    igUsername: null,
    accessToken: null,
    tokenExpiresAt: null,
    updatedAt: null,
    messagingScopesVerified: false,
    whatsappPhoneNumberId: null,
  };
}

export async function getAcquisitionMetaConnection(): Promise<AcquisitionMetaConnection> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('admin_settings')
      .select('value')
      .eq('key', ACQUISITION_META_SETTING_KEY)
      .maybeSingle();
    if (!error && data?.value) {
      const parsed = JSON.parse(String(data.value)) as Partial<AcquisitionMetaConnection>;
      if (parsed.accessToken && parsed.pageId) {
        return {
          ...emptyConnection(),
          ...parsed,
          connected: true,
        };
      }
    }
  } catch {
    // fallback CM
  }

  const cm = await getMetaSocialConnection();
  if (cm.connected && cm.accessToken && cm.pageId) {
    return {
      ...cm,
      messagingScopesVerified: false,
      whatsappPhoneNumberId: null,
    };
  }
  return emptyConnection();
}

async function hasDedicatedAcquisitionConnection(): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('admin_settings')
      .select('value')
      .eq('key', ACQUISITION_META_SETTING_KEY)
      .maybeSingle();
    if (!data?.value) return false;
    const parsed = JSON.parse(String(data.value)) as Partial<AcquisitionMetaConnection>;
    return Boolean(parsed.accessToken && parsed.pageId);
  } catch {
    return false;
  }
}

export async function getMetaLiveReadiness(): Promise<MetaLiveReadiness> {
  const conn = await getAcquisitionMetaConnection();
  const acquisitionDedicated = await hasDedicatedAcquisitionConnection();
  const cmFallback = conn.connected && !acquisitionDedicated;

  const blockers: string[] = [];
  const notes: string[] = [];

  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  const verifyToken = process.env.ACQUISITION_META_VERIFY_TOKEN?.trim();
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://fitmangas.com').replace(/\/$/, '');
  const webhookUrl = `${baseUrl}/api/acquisition/webhooks/meta`;

  if (!appId || !appSecret) {
    blockers.push('META_APP_ID / META_APP_SECRET absents.');
  }
  if (!verifyToken) {
    blockers.push('ACQUISITION_META_VERIFY_TOKEN absent (webhook Meta).');
  }
  if (!conn.connected || !conn.accessToken) {
    blockers.push('Token Meta messaging absent — stocker acquisition_meta_connection.');
  }
  if (conn.pageId && conn.igUserId && conn.pageId === conn.igUserId) {
    blockers.push('Page ID = IG User ID — régénérer via /me/accounts.');
  }
  if (conn.tokenExpiresAt && new Date(conn.tokenExpiresAt).getTime() < Date.now()) {
    blockers.push('Token Meta expiré — renouveler le Page Access Token.');
  }
  if (cmFallback) {
    notes.push('Token CM utilisé en secours — vérifier scopes messaging avant LIVE.');
  }
  if (!(await isAcquisitionSchemaReady())) {
    blockers.push('Migration §9 (tables acq_*) non appliquée.');
  }

  const tokenExpired = Boolean(
    conn.tokenExpiresAt && new Date(conn.tokenExpiresAt).getTime() < Date.now(),
  );

  return {
    messagingMode: process.env.MESSAGING_MODE?.trim().toLowerCase() === 'live' ? 'live' : 'sandbox',
    verifyTokenConfigured: Boolean(verifyToken),
    metaAppConfigured: Boolean(appId && appSecret),
    acquisitionConnection: acquisitionDedicated,
    cmConnectionFallback: cmFallback,
    pageId: conn.pageId,
    igUserId: conn.igUserId,
    idsDistinct: Boolean(conn.pageId && conn.igUserId && conn.pageId !== conn.igUserId),
    tokenPresent: Boolean(conn.accessToken),
    tokenExpired,
    webhookUrl,
    readyForLive: blockers.length === 0,
    blockers,
    notes,
  };
}

async function graphPost(
  base: typeof GRAPH | typeof GRAPH_IG,
  path: string,
  token: string,
  body: Record<string, unknown>,
) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as Record<string, unknown> & {
    error?: { message?: string; code?: number };
    message_id?: string;
  };
  if (!res.ok) {
    const msg = data.error?.message ?? `Erreur Meta ${res.status}`;
    return { ok: false as const, error: msg };
  }
  return { ok: true as const, messageId: data.message_id ? String(data.message_id) : undefined };
}

export async function sendInstagramLiveMessage(params: {
  recipientId: string;
  body: string;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const conn = await getAcquisitionMetaConnection();
  if (!conn.accessToken || !conn.igUserId) {
    return { ok: false, error: 'Connexion Meta Acquisition incomplète (IG User ID + token).' };
  }
  // Tokens Instagram Login (IGAA…) → graph.instagram.com uniquement
  return graphPost(GRAPH_IG, `/me/messages`, conn.accessToken, {
    recipient: { id: params.recipientId },
    message: { text: params.body },
  });
}

export async function sendMessengerLiveMessage(params: {
  recipientId: string;
  body: string;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const conn = await getAcquisitionMetaConnection();
  if (!conn.accessToken || !conn.pageId) {
    return { ok: false, error: 'Connexion Meta Acquisition incomplète (Page ID + token).' };
  }
  return graphPost(GRAPH, `/${conn.pageId}/messages`, conn.accessToken, {
    recipient: { id: params.recipientId },
    message: { text: params.body },
    messaging_type: 'RESPONSE',
  });
}

export async function sendInstagramPrivateReplyLive(params: {
  commentId: string;
  body: string;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const conn = await getAcquisitionMetaConnection();
  if (!conn.accessToken || !conn.igUserId) {
    return { ok: false, error: 'Connexion Meta Acquisition incomplète.' };
  }
  return graphPost(GRAPH_IG, `/me/messages`, conn.accessToken, {
    recipient: { comment_id: params.commentId },
    message: { text: params.body },
  });
}

export async function sendWhatsAppLiveMessage(params: {
  recipientId: string;
  body: string;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const conn = await getAcquisitionMetaConnection();
  const phoneNumberId = conn.whatsappPhoneNumberId?.trim();
  if (!conn.accessToken || !phoneNumberId) {
    return {
      ok: false,
      error: 'WhatsApp LIVE : WABA phone_number_id absent dans acquisition_meta_connection.',
    };
  }
  return graphPost(GRAPH, `/${phoneNumberId}/messages`, conn.accessToken, {
    messaging_product: 'whatsapp',
    to: params.recipientId.replace(/\D/g, ''),
    type: 'text',
    text: { body: params.body },
  });
}

/** Template WhatsApp Cloud API — hors fenêtre 24h. */
export async function sendWhatsAppLiveTemplate(params: {
  recipientId: string;
  templateName: string;
  languageCode?: string;
  variables?: Record<string, string>;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const conn = await getAcquisitionMetaConnection();
  const phoneNumberId = conn.whatsappPhoneNumberId?.trim();
  if (!conn.accessToken || !phoneNumberId) {
    return {
      ok: false,
      error: 'WhatsApp LIVE : WABA phone_number_id absent dans acquisition_meta_connection.',
    };
  }

  const bodyVars = Object.values(params.variables ?? {});
  const components =
    bodyVars.length > 0
      ? [
          {
            type: 'body',
            parameters: bodyVars.map((text) => ({ type: 'text', text })),
          },
        ]
      : undefined;

  return graphPost(GRAPH, `/${phoneNumberId}/messages`, conn.accessToken, {
    messaging_product: 'whatsapp',
    to: params.recipientId.replace(/\D/g, ''),
    type: 'template',
    template: {
      name: params.templateName,
      language: { code: params.languageCode ?? 'fr' },
      ...(components ? { components } : {}),
    },
  });
}

/** Copie le token CM vers acquisition_meta_connection si dédié absent (démarrage messaging). */
export async function ensureAcquisitionMetaFromCm(): Promise<{
  ok: boolean;
  created: boolean;
  error?: string;
}> {
  if (await hasDedicatedAcquisitionConnection()) {
    return { ok: true, created: false };
  }
  const cm = await getMetaSocialConnection();
  if (!cm.connected || !cm.accessToken || !cm.pageId) {
    return { ok: false, created: false, error: 'Meta CM non connecté — impossible de créer acquisition_meta_connection.' };
  }
  if (cm.pageId && cm.igUserId && cm.pageId === cm.igUserId) {
    return {
      ok: false,
      created: false,
      error: 'Page ID = IG User ID côté CM — corriger avant de brancher le messaging.',
    };
  }
  try {
    const admin = createAdminClient();
    const payload: AcquisitionMetaConnection = {
      ...cm,
      messagingScopesVerified: false,
      whatsappPhoneNumberId: null,
      connected: true,
      updatedAt: new Date().toISOString(),
    };
    const { error } = await admin.from('admin_settings').upsert(
      { key: ACQUISITION_META_SETTING_KEY, value: JSON.stringify(payload) },
      { onConflict: 'key' },
    );
    if (error) return { ok: false, created: false, error: error.message };
    return { ok: true, created: true };
  } catch (e) {
    return { ok: false, created: false, error: e instanceof Error ? e.message : 'Erreur écriture settings' };
  }
}
