import { describe, expect, it } from 'vitest';

import { localeFromNavigatorLanguage } from './locale-timezone-detection';

describe('localeFromNavigatorLanguage', () => {
  it("navigator.language 'es-MX' → preferred_locale = 'es'", () => {
    expect(localeFromNavigatorLanguage('es-MX')).toBe('es');
  });

  it("navigator.language 'en-US' → preferred_locale = 'fr' en v1", () => {
    expect(localeFromNavigatorLanguage('en-US')).toBe('fr');
  });

  it("navigator.language 'fr-FR' → preferred_locale = 'fr'", () => {
    expect(localeFromNavigatorLanguage('fr-FR')).toBe('fr');
  });
});
