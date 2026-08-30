import type { AcqConversation } from '@/lib/acquisition/types';

/** Handle Instagram / identifiant contact réel — pas un canal ni un titre de post. */
export function isRealContactHandle(handle: string | null | undefined): boolean {
  const h = handle?.trim();
  if (!h) return false;
  if (h.startsWith('@') && h.length > 1) return true;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(h)) return true;
  return false;
}

export function contactDisplayName(c: AcqConversation): string | null {
  if (isRealContactHandle(c.contactHandle)) return c.contactHandle!.trim();
  return null;
}

export function contactsWithRealHandles(conversations: AcqConversation[]): AcqConversation[] {
  return conversations.filter((c) => isRealContactHandle(c.contactHandle));
}
