import { isMessagingSandbox } from '@/lib/acquisition/feature-flag';

import {
  sendInstagramLiveMessage,
  sendInstagramPrivateReplyLive,
  sendMessengerLiveMessage,
  sendWhatsAppLiveMessage,
} from './meta-live';
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

export const instagramProvider: MessagingProvider = {
  id: 'instagram',
  label: 'Instagram DM',

  async sendMessage(input: SendMessageInput): Promise<ProviderSendResult> {
    if (isMessagingSandbox()) {
      return sandboxResult('sendMessage', `→ ${input.recipientId} : ${input.body.slice(0, 120)}`);
    }
    const live = await sendInstagramLiveMessage({
      recipientId: input.recipientId,
      body: input.body,
    });
    if (!live.ok) {
      return { ok: false, provider: PROVIDER, sandbox: false, error: live.error ?? 'Échec Instagram LIVE.' };
    }
    return {
      ok: true,
      provider: PROVIDER,
      sandbox: false,
      messageId: live.messageId ?? `ig_${Date.now()}`,
    };
  },

  async sendPrivateReply(input: SendPrivateReplyInput): Promise<ProviderSendResult> {
    if (isMessagingSandbox()) {
      return sandboxResult('sendPrivateReply', `comment ${input.commentId} : ${input.body.slice(0, 120)}`);
    }
    const live = await sendInstagramPrivateReplyLive({
      commentId: input.commentId,
      body: input.body,
    });
    if (!live.ok) {
      return { ok: false, provider: PROVIDER, sandbox: false, error: live.error ?? 'Échec private reply LIVE.' };
    }
    return {
      ok: true,
      provider: PROVIDER,
      sandbox: false,
      messageId: live.messageId ?? `ig_pr_${Date.now()}`,
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
      error: 'Instagram LIVE : templates hors fenêtre 24h — à brancher via sendTemplate Meta.',
    };
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
    return { ok: false, error: 'Instagram LIVE : getConversation non implémenté (Graph API conversations).' };
  },
};
