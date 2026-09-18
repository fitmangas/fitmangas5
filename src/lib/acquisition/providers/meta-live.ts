import { createAdminClient } from '@/lib/supabase/admin';
import { getMetaSocialConnection, type MetaSocialConnection } from '@/lib/admin/social-comms';
import { isAcquisitionSchemaReady } from '@/lib/acquisition/db';

export const ACQUISITION_META_SETTING_KEY = 'acquisition_meta_connection';

export type AcquisitionMetaConnection = MetaSocialConnection & {
  messagingScopesVerified?: boolean;
  /** ID technique Meta Cloud API (≠ numéro affiché) */
  whatsappPhoneNumberId?: string | null;
  /** Numéro public E.164 sans + (ex. 33784835972) */
  whatsappDisplayPhone?: string | null;
  /** WABA ID Meta (ex. 1427605062481966) */
  whatsappWabaId?: string | null;
  /**
   * Token Facebook Cloud API WhatsApp (System User / Page).
   * Séparé du accessToken IGAA Instagram — un token IGAA ne peut pas parler à WhatsApp.
   */
  whatsappAccessToken?: string | null;
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
  /** WhatsApp robot (API) — pas le bouton wa.me du site */
  whatsapp: {
    displayPhone: string | null;
    phoneNumberIdPresent: boolean;
    robotReady: boolean;
    plainStatus: string;
  };
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
    whatsappDisplayPhone: null,
    whatsappWabaId: null,
    whatsappAccessToken: null,
  };
}

/** Token Cloud API WhatsApp : dédié d’abord, sinon accessToken Facebook (jamais IGAA). */
export function resolveWhatsAppAccessToken(conn?: AcquisitionMetaConnection | null): string | null {
  const dedicated = conn?.whatsappAccessToken?.trim();
  if (dedicated) return dedicated;
  const fromEnv =
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() ||
    process.env.META_WHATSAPP_ACCESS_TOKEN?.trim() ||
    '';
  if (fromEnv) return fromEnv;
  const shared = conn?.accessToken?.trim();
  if (!shared) return null;
  // Tokens Instagram Login (IGAA…) ne marchent pas sur graph.facebook.com / WhatsApp.
  if (shared.startsWith('IGAA') || shared.startsWith('IGAV')) return null;
  return shared;
}

export function isInstagramOnlyToken(token?: string | null): boolean {
  const t = token?.trim() ?? '';
  return t.startsWith('IGAA') || t.startsWith('IGAV');
}

/** Numéro affiché site / Acquisition (E.164 sans +). */
export function getWhatsAppDisplayPhoneE164(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_LANDING_WHATSAPP_PHONE?.replace(/\D/g, '') ||
    process.env.NEXT_PUBLIC_WHATSAPP_E164?.replace(/\D/g, '') ||
    '';
  return fromEnv || '33784835972';
}

/** ID technique Cloud API : settings d’abord, sinon env. */
export function resolveWhatsAppPhoneNumberId(conn?: AcquisitionMetaConnection | null): string | null {
  const fromConn = conn?.whatsappPhoneNumberId?.trim();
  if (fromConn) return fromConn;
  const fromEnv =
    process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ||
    process.env.META_WHATSAPP_PHONE_NUMBER_ID?.trim() ||
    '';
  return fromEnv || null;
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

  const displayPhone = conn.whatsappDisplayPhone?.replace(/\D/g, '') || getWhatsAppDisplayPhoneE164();
  const phoneNumberId = resolveWhatsAppPhoneNumberId(conn);
  const waToken = resolveWhatsAppAccessToken(conn);
  const waRobotReady = Boolean(phoneNumberId && waToken);
  let waPlain =
    'Le numéro 07… du site sert à discuter à la main. Le robot WhatsApp a besoin d’un branchement Meta séparé (pas encore fait).';
  if (waRobotReady) {
    waPlain = `Robot WhatsApp branché (n° ${displayPhone}).`;
  } else if (phoneNumberId && !waToken) {
    waPlain = `ID technique WhatsApp OK (${phoneNumberId}). Manque un token Facebook Cloud API (pas le token Instagram IGAA) — générer via Utilisateur système Meta.`;
  } else if (displayPhone && !phoneNumberId) {
    waPlain = `N° public ${displayPhone} connu. Manque l’ID technique Meta (WHATSAPP_PHONE_NUMBER_ID) pour que le robot réponde tout seul.`;
  } else if (displayPhone) {
    waPlain = `N° public ${displayPhone} connu. Branchement robot incomplet.`;
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
    whatsapp: {
      displayPhone,
      phoneNumberIdPresent: Boolean(phoneNumberId),
      robotReady: waRobotReady,
      plainStatus: waPlain,
    },
  };
}

async function graphGet(
  base: typeof GRAPH | typeof GRAPH_IG,
  path: string,
  token: string,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: string }> {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${base}${path}${sep}access_token=${encodeURIComponent(token)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const data = (await res.json()) as Record<string, unknown> & {
    error?: { message?: string };
  };
  if (!res.ok) {
    return { ok: false, error: data.error?.message ?? `Erreur Meta GET ${res.status}` };
  }
  return { ok: true, data };
}

/**
 * Vérifie si l’IGSID suit le compte pro (ManyChat-like).
 * Retourne unknown si l’API Meta ne expose pas le champ (fréquent selon le type de token).
 */
export async function checkInstagramFollowsBusiness(
  igsid: string,
): Promise<'yes' | 'no' | 'unknown'> {
  const id = igsid.trim();
  if (!id) return 'unknown';
  const conn = await getAcquisitionMetaConnection();
  if (!conn.accessToken) return 'unknown';

  const tryField = async (base: typeof GRAPH | typeof GRAPH_IG) => {
    const r = await graphGet(base, `/${id}?fields=is_user_follow_business`, conn.accessToken!);
    if (!r.ok) return null;
    const v = r.data.is_user_follow_business;
    if (v === true) return 'yes' as const;
    if (v === false) return 'no' as const;
    return null;
  };

  // Page token Facebook d’abord, puis Instagram Login.
  const viaFb = await tryField(GRAPH);
  if (viaFb) return viaFb;
  const viaIg = await tryField(GRAPH_IG);
  if (viaIg) return viaIg;
  return 'unknown';
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
    const raw = data.error?.message ?? `Erreur Meta ${res.status}`;
    const code = data.error?.code;
    // Fenêtre 24h Meta — message compréhensible pour Kevin / Alejandra
    if (
      code === 10 ||
      code === 551 ||
      /outside.*allowed window|message.*24 hour|(#10)|(#551)/i.test(raw)
    ) {
      return {
        ok: false as const,
        error:
          'Meta bloque l’envoi : elle ne t’a pas écrit depuis plus de 24 h. Dès qu’elle répond, on peut re-parler librement. (Sinon il faudrait un message « modèle » validé par Meta.)',
      };
    }
    return { ok: false as const, error: raw };
  }
  return { ok: true as const, messageId: data.message_id ? String(data.message_id) : undefined };
}

export async function sendInstagramLiveMessage(params: {
  recipientId: string;
  body: string;
  /** Boutons DANS la bulle (Button / Generic template) */
  buttons?: Array<{ title: string; payload: string; url?: string }>;
  /** Pastilles sous le message — rendu différent, fallback uniquement */
  quickReplies?: Array<{ title: string; payload: string }>;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const conn = await getAcquisitionMetaConnection();
  if (!conn.accessToken || !conn.igUserId) {
    return { ok: false, error: 'Connexion Meta Acquisition incomplète (IG User ID + token).' };
  }

  const recipient = { id: params.recipientId };
  const text = params.body.trim();

  // 1) Boutons DANS la bulle — template "button" (texte + CTA collés, style ManyChat)
  if (params.buttons?.length) {
    const buttons = params.buttons.slice(0, 3).map((b) => {
      if (b.url?.trim()) {
        return {
          type: 'web_url' as const,
          url: b.url.trim(),
          title: b.title.slice(0, 20),
        };
      }
      return {
        type: 'postback' as const,
        title: b.title.slice(0, 20),
        payload: b.payload.slice(0, 1000),
      };
    });

    const buttonTpl = await graphPost(GRAPH_IG, `/me/messages`, conn.accessToken, {
      recipient,
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: text.slice(0, 640),
            buttons,
          },
        },
      },
    });
    if (buttonTpl.ok) return buttonTpl;

    // 2) Fallback Generic template (carte + boutons dans la carte)
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const title = (lines[0] ?? 'FitMangas').slice(0, 80);
    const subtitle = (lines.slice(1).join(' ') || 'Essai 7 jours gratuits ✨').slice(0, 80);
    const genericTpl = await graphPost(GRAPH_IG, `/me/messages`, conn.accessToken, {
      recipient,
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: [
              {
                title,
                subtitle,
                buttons,
              },
            ],
          },
        },
      },
    });
    if (genericTpl.ok) return genericTpl;

    // Si les templates échouent, on envoie quand même le texte (erreur visible en détail)
    const plain = await graphPost(GRAPH_IG, `/me/messages`, conn.accessToken, {
      recipient,
      message: { text },
    });
    if (plain.ok) {
      return {
        ok: true,
        messageId: plain.messageId,
        error: `Boutons template refusés par Meta (${buttonTpl.error ?? genericTpl.error}) — texte seul envoyé.`,
      };
    }
    return {
      ok: false,
      error: buttonTpl.error ?? genericTpl.error ?? plain.error ?? 'Échec envoi IG.',
    };
  }

  // Sans boutons dans la bulle : texte (+ quick replies optionnelles, rendu différent)
  const message: Record<string, unknown> = { text };
  if (params.quickReplies?.length) {
    message.quick_replies = params.quickReplies.slice(0, 13).map((q) => ({
      content_type: 'text',
      title: q.title.slice(0, 20),
      payload: q.payload.slice(0, 1000),
    }));
  }
  return graphPost(GRAPH_IG, `/me/messages`, conn.accessToken, {
    recipient,
    message,
  });
}

export async function sendMessengerLiveMessage(params: {
  recipientId: string;
  body: string;
  /** Boutons DANS la bulle (même rendu ManyChat que IG) */
  buttons?: Array<{ title: string; payload: string; url?: string }>;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const conn = await getAcquisitionMetaConnection();
  if (!conn.accessToken || !conn.pageId) {
    return { ok: false, error: 'Connexion Meta Acquisition incomplète (Page ID + token).' };
  }

  const recipient = { id: params.recipientId };
  const text = params.body.trim();
  const path = `/${conn.pageId}/messages`;

  if (params.buttons?.length) {
    const buttons = params.buttons.slice(0, 3).map((b) => {
      if (b.url?.trim()) {
        return {
          type: 'web_url' as const,
          url: b.url.trim(),
          title: b.title.slice(0, 20),
        };
      }
      return {
        type: 'postback' as const,
        title: b.title.slice(0, 20),
        payload: b.payload.slice(0, 1000),
      };
    });

    const buttonTpl = await graphPost(GRAPH, path, conn.accessToken, {
      recipient,
      messaging_type: 'RESPONSE',
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: text.slice(0, 640),
            buttons,
          },
        },
      },
    });
    if (buttonTpl.ok) return buttonTpl;

    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const title = (lines[0] ?? 'FitMangas').slice(0, 80);
    const subtitle = (lines.slice(1).join(' ') || 'Essai 7 jours gratuits ✨').slice(0, 80);
    const genericTpl = await graphPost(GRAPH, path, conn.accessToken, {
      recipient,
      messaging_type: 'RESPONSE',
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: [{ title, subtitle, buttons }],
          },
        },
      },
    });
    if (genericTpl.ok) return genericTpl;

    const plain = await graphPost(GRAPH, path, conn.accessToken, {
      recipient,
      messaging_type: 'RESPONSE',
      message: { text },
    });
    if (plain.ok) {
      return {
        ok: true,
        messageId: plain.messageId,
        error: `Boutons Messenger refusés (${buttonTpl.error ?? genericTpl.error}) — texte seul.`,
      };
    }
    return {
      ok: false,
      error: buttonTpl.error ?? genericTpl.error ?? plain.error ?? 'Échec envoi Messenger.',
    };
  }

  return graphPost(GRAPH, path, conn.accessToken, {
    recipient,
    message: { text },
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
  const payload = {
    recipient: { comment_id: params.commentId },
    message: { text: params.body },
  };
  // Docs Meta : POST /{IG_ID}/messages (Instagram Login). /me/messages en secours.
  const primary = await graphPost(GRAPH_IG, `/${conn.igUserId}/messages`, conn.accessToken, payload);
  if (primary.ok) return primary;
  const fallback = await graphPost(GRAPH_IG, `/me/messages`, conn.accessToken, payload);
  if (fallback.ok) return fallback;
  return {
    ok: false,
    error: primary.error ?? fallback.error ?? 'Échec private reply Instagram.',
  };
}

export async function sendWhatsAppLiveMessage(params: {
  recipientId: string;
  body: string;
  buttons?: Array<{ title: string; payload: string; url?: string }>;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const conn = await getAcquisitionMetaConnection();
  const phoneNumberId = resolveWhatsAppPhoneNumberId(conn);
  const token = resolveWhatsAppAccessToken(conn);
  if (!phoneNumberId) {
    return {
      ok: false,
      error:
        'WhatsApp robot pas encore branché à Meta. Le n° 0784835972 du site ouvre un chat manuel — il manque WHATSAPP_PHONE_NUMBER_ID (ID technique Meta).',
    };
  }
  if (!token) {
    return {
      ok: false,
      error:
        'WhatsApp : ID technique OK, mais le token Instagram (IGAA) ne marche pas pour WhatsApp. Il faut un token Facebook Cloud API (Utilisateur système) dans whatsappAccessToken.',
    };
  }

  const to = params.recipientId.replace(/\D/g, '');
  const buttons = (params.buttons ?? []).slice(0, 3);
  const replyButtons = buttons.filter((b) => !b.url?.trim());
  const urlButtons = buttons.filter((b) => b.url?.trim());

  // Mix URL + postback : URLs collées dans le texte, boutons reply pour le reste.
  let body = params.body;
  if (urlButtons.length > 0 && replyButtons.length > 0) {
    for (const ub of urlButtons) {
      const url = ub.url!.trim();
      if (!body.includes(url)) {
        body = `${body.trim()}\n${ub.title} → ${url}`;
      }
    }
  }

  // 1 URL CTA seule (pas de mix reply+URL dans le même interactive Cloud API).
  if (urlButtons.length > 0 && replyButtons.length === 0) {
    const urlButton = urlButtons[0]!;
    return graphPost(GRAPH, `/${phoneNumberId}/messages`, token, {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'cta_url',
        body: { text: body.slice(0, 1024) },
        action: {
          name: 'cta_url',
          parameters: {
            display_text: urlButton.title.slice(0, 20),
            url: urlButton.url!.trim(),
          },
        },
      },
    });
  }

  // Boutons postback (Prix / En groupe / etc.) — max 3.
  if (replyButtons.length > 0) {
    return graphPost(GRAPH, `/${phoneNumberId}/messages`, token, {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: body.slice(0, 1024) },
        action: {
          buttons: replyButtons.map((b) => ({
            type: 'reply',
            reply: {
              id: b.payload.slice(0, 256),
              title: b.title.slice(0, 20),
            },
          })),
        },
      },
    });
  }

  return graphPost(GRAPH, `/${phoneNumberId}/messages`, token, {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: body.slice(0, 4096) },
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
  const phoneNumberId = resolveWhatsAppPhoneNumberId(conn);
  const token = resolveWhatsAppAccessToken(conn);
  if (!phoneNumberId || !token) {
    return {
      ok: false,
      error: !phoneNumberId
        ? 'WhatsApp robot pas encore branché à Meta (WHATSAPP_PHONE_NUMBER_ID manquant).'
        : 'WhatsApp : manque token Facebook Cloud API (whatsappAccessToken) — le token Instagram IGAA ne suffit pas.',
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

  return graphPost(GRAPH, `/${phoneNumberId}/messages`, token, {
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
      whatsappPhoneNumberId: resolveWhatsAppPhoneNumberId(null),
      whatsappDisplayPhone: getWhatsAppDisplayPhoneE164(),
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
