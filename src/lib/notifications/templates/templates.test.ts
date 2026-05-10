import { describe, expect, it } from 'vitest';

import { TEMPLATE_REGISTRY, renderTemplate } from './index';

describe('Phase 2 email templates', () => {
  it('chaque template retourne du HTML non vide en FR et ES', () => {
    for (const template of Object.values(TEMPLATE_REGISTRY)) {
      const fr = renderTemplate(template, 'fr', {
        firstName: 'Cliente',
        courseTitle: 'Pilates',
        courseDate: '10 mai',
        courseTime: '18:00',
        billingPortalUrl: 'https://example.com/billing',
      });
      const es = renderTemplate(template, 'es', {
        firstName: 'Cliente',
        courseTitle: 'Pilates',
        courseDate: '10 mayo',
        courseTime: '18:00',
        billingPortalUrl: 'https://example.com/billing',
      });
      expect(fr.subject.length).toBeGreaterThan(0);
      expect(es.subject.length).toBeGreaterThan(0);
      expect(fr.html).toContain('FitMangas');
      expect(es.html).toContain('FitMangas');
    }
  });
});
