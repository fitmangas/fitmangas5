import { describe, expect, it } from 'vitest';

import { AVATAR_MAX_BYTES, validateAvatarBytes } from './avatar-validation';

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
const html = new TextEncoder().encode('<html><script>alert(1)</script></html>');

describe('validateAvatarBytes', () => {
  it('accepte jpeg et png', () => {
    expect(validateAvatarBytes(jpeg, 'image/jpeg')).toMatchObject({ ok: true, ext: 'jpg' });
    expect(validateAvatarBytes(png, 'image/png')).toMatchObject({ ok: true, ext: 'png' });
  });
  it('refuse un HTML déguisé en image', () => {
    expect(validateAvatarBytes(html, 'image/jpeg')).toEqual({ ok: false, reason: 'type' });
    expect(validateAvatarBytes(html, 'text/html')).toEqual({ ok: false, reason: 'type' });
  });
  it('refuse un type annoncé incohérent', () => {
    expect(validateAvatarBytes(png, 'image/jpeg')).toEqual({ ok: false, reason: 'type' });
  });
  it('refuse au-delà de 5 Mo', () => {
    const big = new Uint8Array(AVATAR_MAX_BYTES + 1);
    big.set(jpeg);
    expect(validateAvatarBytes(big, 'image/jpeg')).toEqual({ ok: false, reason: 'too_large' });
  });
});
