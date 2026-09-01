import { describe, expect, it } from 'vitest';

import { shouldSkipStandaloneImport } from '@/lib/vimeo-standalone-guard';

describe('shouldSkipStandaloneImport', () => {
  it('ignore les titres Jibri fitmangas-*.mp4', () => {
    expect(
      shouldSkipStandaloneImport(
        { title: 'fitmangas-pilates-mat-202607131830_2026-07-13-18-32-28.mp4', vimeoId: '999' },
        new Set(),
      ),
    ).toBe('jibri');
  });

  it('ignore les IDs déjà liés à un replay séance', () => {
    expect(
      shouldSkipStandaloneImport({ title: 'Barre Flow', vimeoId: '1222779950' }, new Set(['1222779950'])),
    ).toBe('course_recording');
  });

  it('laisse passer une vidéo bibliothèque normale', () => {
    expect(shouldSkipStandaloneImport({ title: 'Barre — séance 12', vimeoId: '555' }, new Set())).toBeNull();
  });
});
