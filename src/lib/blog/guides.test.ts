import { describe, expect, it } from 'vitest';

import { guideForArticle, getBlogGuide } from './guides';

describe('guides du blog (lot 7)', () => {
  it('rattache un article à son thème, en français comme en espagnol, accents compris', () => {
    expect(guideForArticle({ title_fr: 'Respiration en Pilates : le guide pour débuter' })?.id).toBe('respiration');
    expect(guideForArticle({ title_fr: 'Sans titre', title_es: 'La respiración lateral en Pilates' })?.id).toBe('respiration');
    expect(guideForArticle({ title_fr: 'Une séance de 20 min pour les jours chargés' })?.id).toBe('seances-courtes');
    expect(guideForArticle({ title_fr: 'Pilates : comment progresser sans te blesser' })?.id).toBe('progresser');
    expect(guideForArticle({ title_fr: 'Quel niveau choisir ?' })?.id).toBe('progresser');
  });

  it('aucun guide pour un article hors thème', () => {
    expect(guideForArticle({ title_fr: 'Les bienfaits du Pilates sur le dos', title_es: null })).toBeNull();
    expect(guideForArticle({})).toBeNull();
  });

  it('identifiants connus seulement', () => {
    expect(getBlogGuide('respiration')?.title.es).toBe('Respiración');
    expect(getBlogGuide('inconnu')).toBeNull();
  });
});
