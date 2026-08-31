import { describe, expect, it } from 'vitest';

import { isJibriRecordingFileNameOrTitle } from '@/lib/jibri-recording-filename';

describe('course replay duplicate guard (jibri detect)', () => {
  it('identifie les titres Jibri qui ne doivent pas aller en bibliothèque standalone', () => {
    expect(isJibriRecordingFileNameOrTitle('fitmangas-pilates-mat-202607131830_2026-07-13-18-32-28.mp4')).toBe(true);
    expect(isJibriRecordingFileNameOrTitle('Pilates Mat — replay')).toBe(false);
  });
});
