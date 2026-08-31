import { describe, expect, it } from 'vitest';

import {
  isJibriRecordingFileNameOrTitle,
  parseJibriParisStartAt,
  parseJibriRecordingFileName,
  pickClosestJibriCourseMatch,
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
    expect(slugifyCourseTitle('Fit-Dance')).toBe('fit-dance');
    expect(slugifyCourseTitle('Fit Dance')).toBe('fit-dance');
  });
});

describe('pickClosestJibriCourseMatch', () => {
  it('choisit le cours à 18:35 plutôt que 18:30 pour un fichier 1835', () => {
    const parsed = parseJibriRecordingFileName(
      'fitmangas-fit-dance-202608041835_2026-08-04-18-35-02.mp4',
    );
    expect(parsed).not.toBeNull();
    const hit = pickClosestJibriCourseMatch(
      [
        { id: '1830', title: 'Fit Dance', starts_at: '2026-08-04T16:30:00.000Z' },
        { id: '1835', title: 'Fit-Dance', starts_at: '2026-08-04T16:35:00.000Z' },
      ],
      parsed!,
    );
    expect(hit?.id).toBe('1835');
  });
});

describe('isJibriRecordingFileNameOrTitle', () => {
  it('detecte un nom de replay Jibri', () => {
    const name = 'fitmangas-renfo-core-202605312000_2026-05-31-20-02-08.mp4';
    expect(isJibriRecordingFileNameOrTitle(name)).toBe(true);
  });

  it('ignore une vraie vidéo bibliothèque', () => {
    expect(isJibriRecordingFileNameOrTitle('Barre flow — séance 12')).toBe(false);
  });
});
