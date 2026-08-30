import { isMessagingSandbox } from '@/lib/acquisition/feature-flag';

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

async function liveNotReady(action: string): Promise<ProviderSendResult> {
  return {
    ok: false,
    provider: PROVIDER,
    sandbox: false,
    error: `WhatsApp LIVE : ${action} non activé — WABA + templates requis (voir ACQUISITION-SETUP.md).`,
  };
}

export const whatsappProvider: MessagingProvider = {
  id: 'whatsapp',
  label: 'WhatsApp',

  async sendMessage(input: SendMessageInput): Promise<ProviderSendResult> {
    if (isMessagingSandbox()) {
      return sandboxResult('sendMessage', `→ ${input.recipientId} : ${input.body.slice(0, 120)}`);
    }
    return liveNotReady('sendMessage');
  },

  async sendPrivateReply(input: SendPrivateReplyInput): Promise<ProviderSendResult> {
    if (isMessagingSandbox()) {
      return sandboxResult('sendPrivateReply', `N/A WA : ${input.body.slice(0, 80)}`);
    }
    return liveNotReady('sendPrivateReply');
  },

  async sendTemplate(input: SendTemplateInput): Promise<ProviderSendResult> {
    if (isMessagingSandbox()) {
      return sandboxResult('sendTemplate', `${input.templateName} → ${input.recipientId}`);
    }
    return liveNotReady('sendTemplate');
  },

  async getConversation(externalId: string) {
    if (isMessagingSandbox()) {
      return { ok: true, data: { externalId, messages: [] } };
    }
    return { ok: false, error: 'WhatsApp LIVE : getConversation non implémenté.' };
  },
};
