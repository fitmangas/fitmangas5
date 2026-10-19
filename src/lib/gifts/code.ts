import { randomInt } from 'node:crypto';

/** Alphabet sans 0/O/1/I. */
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateGiftCode(): string {
  const part = (n: number) => Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  return `FM-${part(4)}-${part(4)}`;
}

export function normalizeGiftCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export function isGiftCodeFormat(raw: string): boolean {
  return /^FM-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/.test(normalizeGiftCode(raw));
}
