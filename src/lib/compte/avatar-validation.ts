export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

export type AvatarMime = keyof typeof ALLOWED;

/** Type réel lu dans les premiers octets (l’extension et le type annoncé par le navigateur ne suffisent pas). */
export function sniffImageMime(bytes: Uint8Array): AvatarMime | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

export type AvatarCheck = { ok: true; mime: AvatarMime; ext: string } | { ok: false; reason: 'empty' | 'too_large' | 'type' };

export function validateAvatarBytes(bytes: Uint8Array, declaredType: string | null | undefined): AvatarCheck {
  if (bytes.length === 0) return { ok: false, reason: 'empty' };
  if (bytes.length > AVATAR_MAX_BYTES) return { ok: false, reason: 'too_large' };
  const sniffed = sniffImageMime(bytes);
  if (!sniffed) return { ok: false, reason: 'type' };
  if (declaredType && declaredType !== sniffed && !(declaredType === 'image/jpg' && sniffed === 'image/jpeg')) {
    return { ok: false, reason: 'type' };
  }
  return { ok: true, mime: sniffed, ext: ALLOWED[sniffed] };
}
