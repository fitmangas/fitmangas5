import { isMessagingSandbox } from '@/lib/acquisition/feature-flag';

import { sendWhatsAppLiveMessage } from './meta-live';
import { logSandboxSend } from './sandbox-log';
import type {
  MessagingProvider,
  ProviderSendResult,
  SendMessageInput,
  SendPrivateReplyInput,
  SendTemplateInput,
} from './types';

const PROVIDER = 'whatsapp';

async function sandboxResult(action: string, detail: string): Promise<ProviderSendResult> {
  const logLine = logSandboxSend(PROVIDER, action, detail);
  return {
    ok: true,
    provider: PROVIDER,
    sandbox: true,
    messageId: `sandbox_wa_${Date.now()}`,
    logLine,
  };
}

export const whatsappProvider: MessagingProvider = {
  id: 'whatsapp',
  label: 'WhatsApp',

  async sendMessage(input: SendMessageInput): Promise<ProviderSendResult> {
    if (isMessagingSandbox()) {
      return sandboxResult('sendMessage', `→ ${input.recipientId} : ${input.body.slice(0, 120)}`);
    }
    const live = await sendWhatsAppLiveMessage({
      recipientId: input.recipientId,
      body: input.body,
    });
    if (!live.ok) {
      return { ok: false, provider: PROVIDER, sandbox: false, error: live.error ?? 'Échec WhatsApp LIVE.' };
    }
    return {
      ok: true,
      provider: PROVIDER,
      sandbox: false,
      messageId: live.messageId ?? `wa_${Date.now()}`,
    };
  },

  async sendPrivateReply(input: SendPrivateReplyInput): Promise<ProviderSendResult> {
    if (isMessagingSandbox()) {
      return sandboxResult('sendPrivateReply', `N/A WA : ${input.body.slice(0, 80)}`);
    }
    return {
      ok: false,
      provider: PROVIDER,
      sandbox: false,
      error: 'WhatsApp LIVE : pas de private reply — utiliser sendMessage dans fenêtre 24h.',
    };
  },

  async sendTemplate(input: SendTemplateInput): Promise<ProviderSendResult> {
    if (isMessagingSandbox()) {
      return sandboxResult('sendTemplate', `${input.templateName} → ${input.recipientId}`);
    }
    return {
      ok: false,
      provider: PROVIDER,
      sandbox: false,
      error: 'WhatsApp LIVE : templates approuvés requis hors fenêtre 24h.',
    };
  },

  async getConversation(externalId: string) {
    if (isMessagingSandbox()) {
      return { ok: true, data: { externalId, messages: [] } };
    }
    return { ok: false, error: 'WhatsApp LIVE : getConversation non implémenté.' };
  },
};
