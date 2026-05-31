import { describe, expect, it } from 'vitest';

import { parseVimeoVideoId } from '@/lib/vimeo-parse-id';

describe('parseVimeoVideoId', () => {
  it('accepte un identifiant numérique', () => {
    expect(parseVimeoVideoId('123456789')).toBe('123456789');
  });

  it('extrait depuis une URL standard', () => {
    expect(parseVimeoVideoId('https://vimeo.com/987654321')).toBe('987654321');
  });

  it('extrait depuis une URL /video/', () => {
    expect(parseVimeoVideoId('https://vimeo.com/video/555666777')).toBe('555666777');
  });

  it('retourne null si invalide', () => {
    expect(parseVimeoVideoId('')).toBeNull();
    expect(parseVimeoVideoId('https://youtube.com/watch?v=abc')).toBeNull();
  });
});
