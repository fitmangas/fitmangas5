import { describe, expect, it } from 'vitest';

import { boutiqueCategoryFor, formatBoutiquePrice } from './boutique-format';

describe('boutique-format', () => {
  it('catégories', () => {
    expect(boutiqueCategoryFor('Tapis de Pilates FitMangas')).toBe('accessoires');
    expect(boutiqueCategoryFor('Padded Sports Bra')).toBe('bouger');
    expect(boutiqueCategoryFor('Mug de voyage')).toBe('quotidien');
  });
  it('prix', () => {
    expect(formatBoutiquePrice({ minPrice: null, maxPrice: null, currency: 'EUR' })).toBeNull();
    expect(formatBoutiquePrice({ minPrice: 42, maxPrice: 42, currency: 'EUR' })).toMatch(/^42\s?€$/);
    expect(formatBoutiquePrice({ minPrice: 29.5, maxPrice: 34, currency: 'EUR' })).toMatch(/^dès 29,50\s?€$/);
    expect(formatBoutiquePrice({ minPrice: 12, maxPrice: 15, currency: 'EUR' }, 'es-MX')).toMatch(/^desde/);
  });
});
