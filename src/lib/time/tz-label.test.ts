import { describe, expect, it } from 'vitest';

import { defaultTimeZoneForLocale, resolveDisplayTimeZone, tzHoursLabel, tzLabel } from './tz-label';

describe('tz-label', () => {
  it('défauts par langue', () => {
    expect(defaultTimeZoneForLocale('fr')).toBe('Europe/Paris');
    expect(defaultTimeZoneForLocale('es')).toBe('America/Mexico_City');
  });
  it('fuseau invalide → défaut', () => {
    expect(resolveDisplayTimeZone('Mars/Olympus', 'es')).toBe('America/Mexico_City');
    expect(resolveDisplayTimeZone(' Europe/Madrid ', 'fr')).toBe('Europe/Madrid');
  });
  it('libellés', () => {
    expect(tzLabel('Europe/Paris', 'fr')).toBe('heure de Paris');
    expect(tzLabel('America/Mexico_City', 'es')).toBe('hora de Ciudad de México');
    expect(tzLabel('Europe/Madrid', 'fr')).toBe('heure de Madrid');
    expect(tzHoursLabel('Europe/Paris', 'fr')).toBe('Heures de Paris');
    expect(tzHoursLabel('America/Mexico_City', 'es')).toBe('Hora de Ciudad de México');
    expect(tzHoursLabel('Europe/Paris', 'en')).toBe('Times: Paris time');
  });
});
