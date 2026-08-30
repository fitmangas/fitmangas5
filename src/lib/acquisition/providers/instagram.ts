import { isMessagingSandbox } from '@/lib/acquisition/feature-flag';

import { logSandboxSend } from './sandbox-log';
import type {
  MessagingProvider,
  ProviderSendResult,
  SendMessageInput,
  SendPrivateReplyInput,
  SendTemplateInput,
} from './types';

const PROVIDER = 'instagram';

async function sandboxResult(action: string, detail: string): Promise<ProviderSendResult> {
  const logLine = logSandboxSend(PROVIDER, action, detail);
  return {
    ok: true,
    provider: PROVIDER,
    sandbox: true,
    messageId: `sandbox_ig_${Date.now()}`,
    logLine,
  };
}

async function liveNotReady(action: string): Promise<ProviderSendResult> {
  return {
    ok: false,
    provider: PROVIDER,
    sandbox: false,
    error: `Instagram LIVE : ${action} non activé — permissions Meta requises (voir ACQUISITION-SETUP.md).`,
  };
}

export const instagramProvider: MessagingProvider = {
  id: 'instagram',
  label: 'Instagram DM',

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
      return {
        ok: true,
        data: {
          externalId,
          messages: [],
        },
      };
    }
    return { ok: false, error: 'Instagram LIVE : getConversation non implémenté (attente permissions Meta).' };
  },
};
