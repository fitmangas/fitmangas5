import { describe, expect, it } from 'vitest';

import {
  parseJibriParisStartAt,
  parseJibriRecordingFileName,
  slugifyCourseTitle,
} from '@/lib/jibri-recording-filename';

describe('parseJibriRecordingFileName', () => {
  it('parse fitmangas-renfo-core-202605312000_....mp4', () => {
    const parsed = parseJibriRecordingFileName(
      'fitmangas-renfo-core-202605312000_2026-05-31-20-02-08.mp4',
    );
    expect(parsed).not.toBeNull();
    expect(parsed!.slug).toBe('renfo-core');
    expect(parsed!.dateBlock).toBe('202605312000');
    expect(parsed!.startsAtParis.toISOString()).toBe('2026-05-31T18:00:00.000Z');
  });

  it('accepte un chemin complet', () => {
    const parsed = parseJibriRecordingFileName(
      '/opt/jibri/recordings/abc/fitmangas-pilates-mat-202605311000_2026-05-31-10-05-00.mp4',
    );
    expect(parsed?.slug).toBe('pilates-mat');
    expect(parsed?.dateBlock).toBe('202605311000');
  });

  it('rejette un nom invalide', () => {
    expect(parseJibriRecordingFileName('random.mp4')).toBeNull();
    expect(parseJibriRecordingFileName('fitmangas-nodate.mp4')).toBeNull();
  });
});

describe('parseJibriParisStartAt', () => {
  it('interprète YYYYMMDDHHMM en Europe/Paris (UTC+2 été)', () => {
    const d = parseJibriParisStartAt('202605312000');
    expect(d?.toISOString()).toBe('2026-05-31T18:00:00.000Z');
  });
});

describe('slugifyCourseTitle', () => {
  it('normalise un titre cours', () => {
    expect(slugifyCourseTitle('Renfo Core')).toBe('renfo-core');
    expect(slugifyCourseTitle('Pilates Mat')).toBe('pilates-mat');
  });
});
