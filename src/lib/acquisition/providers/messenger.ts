import { isMessagingSandbox } from '@/lib/acquisition/feature-flag';

import { sendMessengerLiveMessage } from './meta-live';
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

export const messengerProvider: MessagingProvider = {
  id: 'facebook',
  label: 'Messenger',

  async sendMessage(input: SendMessageInput): Promise<ProviderSendResult> {
    if (isMessagingSandbox()) {
      return sandboxResult('sendMessage', `→ ${input.recipientId} : ${input.body.slice(0, 120)}`);
    }
    const live = await sendMessengerLiveMessage({
      recipientId: input.recipientId,
      body: input.body,
    });
    if (!live.ok) {
      return { ok: false, provider: PROVIDER, sandbox: false, error: live.error ?? 'Échec Messenger LIVE.' };
    }
    return {
      ok: true,
      provider: PROVIDER,
      sandbox: false,
      messageId: live.messageId ?? `fb_${Date.now()}`,
    };
  },

  async sendPrivateReply(input: SendPrivateReplyInput): Promise<ProviderSendResult> {
    if (isMessagingSandbox()) {
      return sandboxResult('sendPrivateReply', `comment ${input.commentId} : ${input.body.slice(0, 120)}`);
    }
    return {
      ok: false,
      provider: PROVIDER,
      sandbox: false,
      error: 'Messenger LIVE : private reply commentaire — utiliser sendPrivateReply IG ou API Page feed.',
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
      error: 'Messenger LIVE : templates — à brancher via sendTemplate Meta.',
    };
  },

  async getConversation(externalId: string) {
    if (isMessagingSandbox()) {
      return { ok: true, data: { externalId, messages: [] } };
    }
    return { ok: false, error: 'Messenger LIVE : getConversation non implémenté.' };
  },
};
