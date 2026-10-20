import { describe, expect, it } from 'vitest';

import { pickMobilePlanningDays } from './planning-mobile-days';

describe('planning sur téléphone — jours affichés', () => {
  const week = ['2026-10-19', '2026-10-21', '2026-10-22'];

  it('samedi : les lives de la semaine restent visibles (grisés) au lieu d’une semaine vide', () => {
    expect(pickMobilePlanningDays(week, '2026-10-24', 3)).toEqual(week);
  });

  it('mardi : les jours à venir d’abord, complétés par le dernier jour passé', () => {
    expect(pickMobilePlanningDays(week, '2026-10-20', 3)).toEqual(['2026-10-19', '2026-10-21', '2026-10-22']);
    expect(pickMobilePlanningDays(week, '2026-10-20', 2)).toEqual(['2026-10-21', '2026-10-22']);
  });

  it('page complète : tous les jours avec du contenu, dans l’ordre', () => {
    expect(pickMobilePlanningDays(['2026-10-22', '2026-10-19'], '2026-10-21', 99)).toEqual([
      '2026-10-19',
      '2026-10-22',
    ]);
  });

  it('autre semaine : les premiers jours avec du contenu', () => {
    expect(pickMobilePlanningDays(['2026-10-28', '2026-10-27', '2026-10-30'], null, 2)).toEqual([
      '2026-10-27',
      '2026-10-28',
    ]);
  });

  it('rien cette semaine : liste vide', () => {
    expect(pickMobilePlanningDays([], '2026-10-24', 3)).toEqual([]);
  });
});
