import type { AcquisitionChannel } from '@/lib/acquisition/types';

export type SendMessageInput = {
  conversationExternalId: string;
  recipientId: string;
  body: string;
  metadata?: Record<string, unknown>;
};

export type SendPrivateReplyInput = {
  commentId: string;
  body: string;
};

export type SendTemplateInput = {
  recipientId: string;
  templateName: string;
  variables?: Record<string, string>;
};

export type ProviderSendResult = {
  ok: boolean;
  provider: string;
  sandbox: boolean;
  messageId?: string;
  error?: string;
  logLine?: string;
};

export type ProviderConversation = {
  externalId: string;
  messages: Array<{ id: string; body: string; direction: 'inbound' | 'outbound'; at: string }>;
};

export interface MessagingProvider {
  id: AcquisitionChannel;
  label: string;
  sendMessage(input: SendMessageInput): Promise<ProviderSendResult>;
  sendPrivateReply(input: SendPrivateReplyInput): Promise<ProviderSendResult>;
  sendTemplate(input: SendTemplateInput): Promise<ProviderSendResult>;
  getConversation(externalId: string): Promise<{ ok: boolean; data?: ProviderConversation; error?: string }>;
}
