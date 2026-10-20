import { describe, expect, it } from 'vitest';

import { isAllowedIframeSrc, sanitizeArticleHtml } from './sanitize-article-html';

describe('sanitizeArticleHtml', () => {
  it('garde une iframe Vimeo et retire un script', () => {
    const html =
      '<p>Intro</p><iframe src="https://player.vimeo.com/video/123" allowfullscreen></iframe><script>alert(1)</script>';
    const out = sanitizeArticleHtml(html);
    expect(out).toContain('player.vimeo.com');
    expect(out).not.toContain('<script');
    expect(out).toContain('<p>Intro</p>');
  });

  it('retire une iframe hors liste blanche', () => {
    const out = sanitizeArticleHtml('<iframe src="https://evil.example/embed"></iframe><p>ok</p>');
    expect(out).not.toContain('evil.example');
    expect(out).toContain('<p>ok</p>');
  });

  it('accepte YouTube et Instagram', () => {
    expect(isAllowedIframeSrc('https://www.youtube.com/embed/abc')).toBe(true);
    expect(isAllowedIframeSrc('https://www.instagram.com/p/xyz/embed')).toBe(true);
    expect(isAllowedIframeSrc('http://player.vimeo.com/video/1')).toBe(false);
  });
});
