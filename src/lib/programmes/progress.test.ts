import { describe, expect, it } from 'vitest';

import {
  assertEnrollmentOwner,
  formatCertificateNumber,
  isStepCompleteAt80,
  segmentDurationS,
} from './progress';
import { nextEnrollmentStatuses } from './normalize-title';

describe('programmes — propriété / un seul actif / 80 %', () => {
  it('refuse une inscription d’une autre cliente', () => {
    expect(assertEnrollmentOwner('u1', 'u1')).toBe(true);
    expect(assertEnrollmentOwner('u1', 'u2')).toBe(false);
  });

  it('met l’actif en pause avant un nouveau départ', () => {
    expect(nextEnrollmentStatuses('enr-1', true)).toEqual({ pauseId: 'enr-1', createNew: true });
  });

  it('valide une étape à 80 % de l’extrait', () => {
    expect(segmentDurationS(0, 100, 600)).toBe(100);
    expect(isStepCompleteAt80(79, 100)).toBe(false);
    expect(isStepCompleteAt80(80, 100)).toBe(true);
    expect(isStepCompleteAt80(10, 0)).toBe(false);
  });

  it('numérote le certificat FM-AAAA-MMJJ-NNNN', () => {
    expect(formatCertificateNumber(new Date('2026-10-19T12:00:00Z'), 7)).toBe('FM-2026-1019-0007');
  });
});
