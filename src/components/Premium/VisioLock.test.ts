import { describe, expect, it } from 'vitest';

import { getVisioLockState } from './VisioLock';

describe('VisioLock', () => {
  it('user v-coll → affiche children sans overlay', () => {
    expect(getVisioLockState(true)).toEqual({ showOverlay: false, ctaOffer: 'v-coll' });
  });

  it('user n-coll → affiche overlay + CTA', () => {
    expect(getVisioLockState(false)).toEqual({ showOverlay: true, ctaOffer: 'v-coll' });
  });
});
