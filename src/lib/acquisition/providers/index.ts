import type { AcquisitionChannel } from '@/lib/acquisition/types';

import { instagramProvider } from './instagram';
import { messengerProvider } from './messenger';
import type { MessagingProvider } from './types';
import { whatsappProvider } from './whatsapp';

const providers: Record<string, MessagingProvider> = {
  instagram: instagramProvider,
  facebook: messengerProvider,
  whatsapp: whatsappProvider,
};

export function getMessagingProvider(channel: AcquisitionChannel): MessagingProvider | null {
  return providers[channel] ?? null;
}

export function listMessagingProviders(): MessagingProvider[] {
  return [instagramProvider, messengerProvider, whatsappProvider];
}

export { getSandboxLog } from './sandbox-log';
export type { MessagingProvider, ProviderSendResult } from './types';
