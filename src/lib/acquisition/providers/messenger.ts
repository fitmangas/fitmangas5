import { isMessagingSandbox } from '@/lib/acquisition/feature-flag';

import { logSandboxSend } from './sandbox-log';
import type {
  MessagingProvider,
  ProviderSendResult,
  SendMessageInput,
  SendPrivateReplyInput,
  SendTemplateInput,
} from './types';

const PROVIDER = 'messenger';

async function sandboxResult(action: string, detail: string): Promise<ProviderSendResult> {
  const logLine = logSandboxSend(PROVIDER, action, detail);
  return {
    ok: true,
    provider: PROVIDER,
    sandbox: true,
    messageId: `sandbox_fb_${Date.now()}`,
    logLine,
  };
}

async function liveNotReady(action: string): Promise<ProviderSendResult> {
  return {
    ok: false,
    provider: PROVIDER,
    sandbox: false,
    error: `Messenger LIVE : ${action} non activé — permissions Meta requises (voir ACQUISITION-SETUP.md).`,
  };
}

export const messengerProvider: MessagingProvider = {
  id: 'facebook',
  label: 'Messenger',

  async sendMessage(input: SendMessageInput): Promise<ProviderSendResult> {
    if (isMessagingSandbox()) {
      return sandboxResult('sendMessage', `→ ${input.recipientId} : ${input.body.slice(0, 120)}`);
    }
    return liveNotReady('sendMessage');
  },

  async sendPrivateReply(input: SendPrivateReplyInput): Promise<ProviderSendResult> {
    if (isMessagingSandbox()) {
      return sandboxResult('sendPrivateReply', `comment ${input.commentId} : ${input.body.slice(0, 120)}`);
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
    return { ok: false, error: 'Messenger LIVE : getConversation non implémenté.' };
  },
};
