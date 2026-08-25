import { describe, expect, it } from 'vitest';

import { containsArticlePilatesPlaceholder } from '@/lib/blog/blog-content-guards';

describe('containsArticlePilatesPlaceholder', () => {
  it('détecte les vrais seeds', () => {
    expect(containsArticlePilatesPlaceholder('Article pilates 14 — brouillon')).toBe(true);
    expect(containsArticlePilatesPlaceholder('Description courte pour l’article 12')).toBe(true);
    expect(
      containsArticlePilatesPlaceholder(
        '<h2>Mouvement & Souffle : L\'Harmonie Essentielle du Pilates</h2><p>Texte</p>',
      ),
    ).toBe(true);
  });

  it('ne bloque pas une rédaction libre sur le souffle', () => {
    expect(
      containsArticlePilatesPlaceholder(
        '<h2>Respiration latérale pour un Pilates plus fluide</h2><p>Le mouvement et le souffle travaillent ensemble.</p>',
      ),
    ).toBe(false);
    expect(containsArticlePilatesPlaceholder('Respirez pour un Pilates plus fluide et fort')).toBe(false);
  });
});
