import { describe, expect, it } from 'vitest';

import { isPremiersPasEnabled } from './flag';
import {
  availableTourSteps,
  buildPremiersPasItems,
  onboardingLang,
  pageHelp,
  pageHelpIdForPath,
  premiersPasProgress,
  shouldShowPremiersPas,
  tourCopy,
  welcomeTitle,
  WELCOME_VIDEO,
} from './premiers-pas';
import { placeTourCard } from './tour-position';

const facts = { levelTestDone: false, calendarSubscribed: false, liveVisits: 0, replaySeconds: 0 };

describe('premiers pas — drapeau', () => {
  it('éteint par défaut, allumé avec PREMIERS_PAS_ENABLED=1', () => {
    expect(isPremiersPasEnabled({})).toBe(false);
    expect(isPremiersPasEnabled({ PREMIERS_PAS_ENABLED: '0' })).toBe(false);
    expect(isPremiersPasEnabled({ PREMIERS_PAS_ENABLED: '1' })).toBe(true);
    expect(isPremiersPasEnabled({ PREMIERS_PAS_ENABLED: ' true ' })).toBe(true);
  });
});

describe('premiers pas — tuto guidé', () => {
  it('4 étapes dans l’ordre : prochain live, programme, planning, replays', () => {
    expect(tourCopy('fr').steps.map((s) => s.id)).toEqual(['next-live', 'programme', 'planning', 'replays']);
    expect(tourCopy('es').steps).toHaveLength(4);
    expect(tourCopy('en').steps).toHaveLength(4);
  });

  it('saute l’étape dont la cible manque (ex. programmes éteints)', () => {
    const steps = availableTourSteps('fr', ['next-live', 'planning', 'replays']);
    expect(steps.map((s) => s.id)).toEqual(['next-live', 'planning', 'replays']);
    expect(availableTourSteps('fr', [])).toEqual([]);
  });

  it('bienvenue avec ou sans prénom', () => {
    expect(welcomeTitle('fr', 'Jenny')).toBe('Bienvenue Jenny 💛');
    expect(welcomeTitle('fr', '  ')).toBe('Bienvenue 💛');
    expect(welcomeTitle('es', null)).toBe('Bienvenida 💛');
  });

  it('la voix de la vidéo n’est pas Alejandra : jamais de « je » à sa place dans le tuto', () => {
    for (const lang of ['fr', 'es', 'en'] as const) {
      const c = tourCopy(lang);
      const texts = [c.welcomeBody, c.welcomeBodyNoProgramme, ...c.steps.map((s) => `${s.title} ${s.body}`)].join(' ');
      expect(texts).toMatch(/Alejandra/);
      expect(texts).not.toMatch(/\b(je|j’|moi|yo|me corrijo|I'm|I am)\b/i);
    }
  });

  it('bienvenue sans « programme » quand les programmes sont éteints', () => {
    expect(tourCopy('fr').welcomeBodyNoProgramme).not.toMatch(/programme/i);
    expect(tourCopy('es').welcomeBodyNoProgramme).not.toMatch(/programa/i);
    expect(tourCopy('en').welcomeBodyNoProgramme).not.toMatch(/programme/i);
  });

  it('vidéo de bienvenue : française seulement pour l’instant', () => {
    expect(WELCOME_VIDEO.fr).toBe('/onboarding/bienvenue-fr.mp4');
    expect(WELCOME_VIDEO.es).toBeNull();
    expect(WELCOME_VIDEO.en).toBeNull();
  });
});

describe('premiers pas — liste de démarrage', () => {
  it('« Compte créé » déjà cochée : 1 / 5 au départ', () => {
    const items = buildPremiersPasItems('fr', facts);
    expect(items.map((i) => i.id)).toEqual(['account', 'level-test', 'calendar', 'first-live', 'first-replay']);
    expect(premiersPasProgress(items)).toEqual({ done: 1, total: 5, percent: 20, complete: false });
  });

  it('coche selon les données existantes', () => {
    const items = buildPremiersPasItems('fr', {
      levelTestDone: true,
      calendarSubscribed: true,
      liveVisits: 2,
      replaySeconds: 30,
    });
    expect(premiersPasProgress(items).complete).toBe(true);
    const partial = buildPremiersPasItems('es', { ...facts, liveVisits: 1 });
    expect(partial.find((i) => i.id === 'first-live')?.done).toBe(true);
    expect(partial.find((i) => i.id === 'first-replay')?.done).toBe(false);
    expect(partial[1].label).toBe('Test de nivel (2 min)');
  });

  it('programmes éteints : pas d’étape « Test de niveau » (la page n’existe pas) → 4 étapes', () => {
    const items = buildPremiersPasItems('fr', facts, { programmes: false });
    expect(items.map((i) => i.id)).toEqual(['account', 'calendar', 'first-live', 'first-replay']);
    expect(premiersPasProgress(items)).toEqual({ done: 1, total: 4, percent: 25, complete: false });
  });

  it('chaque étape à faire mène quelque part', () => {
    for (const item of buildPremiersPasItems('fr', facts).filter((i) => !i.done)) {
      expect(item.href).toMatch(/^\//);
    }
  });

  it('visible 30 jours après l’inscription ou pendant l’essai, jamais si masquée', () => {
    const now = new Date('2026-10-20T20:00:00Z');
    expect(
      shouldShowPremiersPas({ accountCreatedAt: '2026-10-10T10:00:00Z', now, isTrialing: false, hidden: false }),
    ).toBe(true);
    expect(
      shouldShowPremiersPas({ accountCreatedAt: '2026-07-24T11:46:00Z', now, isTrialing: false, hidden: false }),
    ).toBe(false);
    // Jenny : compte de juillet, essai démarré le 17/10 → la liste s'affiche.
    expect(
      shouldShowPremiersPas({ accountCreatedAt: '2026-07-24T11:46:00Z', now, isTrialing: true, hidden: false }),
    ).toBe(true);
    expect(
      shouldShowPremiersPas({ accountCreatedAt: '2026-10-19T10:00:00Z', now, isTrialing: true, hidden: true }),
    ).toBe(false);
    expect(shouldShowPremiersPas({ accountCreatedAt: null, now, isTrialing: false, hidden: false })).toBe(false);
  });
});

describe('premiers pas — aide par page', () => {
  it('trouve la bonne page (le plus précis d’abord)', () => {
    expect(pageHelpIdForPath('/compte')).toBe('dashboard');
    expect(pageHelpIdForPath('/compte/planning')).toBe('planning');
    expect(pageHelpIdForPath('/compte/programmes/les-fondations')).toBe('programmes');
    expect(pageHelpIdForPath('/compte/connaissance-de-soi/progression')).toBe('progress');
    expect(pageHelpIdForPath('/compte/connaissance-de-soi/tests/abc')).toBe('self-knowledge');
    expect(pageHelpIdForPath('/compte/boutique/commandes')).toBe('shop');
    expect(pageHelpIdForPath('/compte/replays?x=1')).toBe('videos');
    expect(pageHelpIdForPath(null)).toBe('dashboard');
  });

  it('3 lignes par page, en FR / ES / EN', () => {
    const ids = [
      'dashboard',
      'planning',
      'programmes',
      'videos',
      'self-knowledge',
      'shop',
      'referral',
      'blog',
      'notifications',
      'preferences',
      'profile',
      'progress',
    ];
    const paths: Record<string, string> = {
      dashboard: '/compte',
      planning: '/compte/planning',
      programmes: '/compte/programmes',
      videos: '/compte/replays',
      'self-knowledge': '/compte/connaissance-de-soi',
      shop: '/compte/boutique',
      referral: '/compte/parrainage',
      blog: '/compte/blog',
      notifications: '/compte/notifications',
      preferences: '/compte/preferences',
      profile: '/compte/profil',
      progress: '/compte/progression',
    };
    for (const lang of ['fr', 'es', 'en'] as const) {
      for (const id of ids) {
        const h = pageHelp(lang, paths[id]);
        expect(h.id).toBe(id);
        expect(h.lines).toHaveLength(3);
        expect(h.lines.every((l) => l.trim().length > 10)).toBe(true);
      }
    }
  });

  it('langue de repli : français', () => {
    expect(onboardingLang('es')).toBe('es');
    expect(onboardingLang('en')).toBe('en');
    expect(onboardingLang('de')).toBe('fr');
    expect(onboardingLang(undefined)).toBe('fr');
  });
});

describe('premiers pas — placement de la bulle', () => {
  const viewport = { width: 1440, height: 900 };
  const card = { width: 380, height: 210 };

  it('sous la cible quand il y a la place', () => {
    const p = placeTourCard({ top: 120, left: 400, width: 300, height: 200 }, viewport, card);
    expect(p.anchored).toBe('below');
    expect(p.top).toBe(334);
    expect(p.left).toBe(400);
  });

  it('au-dessus si la cible est en bas', () => {
    const p = placeTourCard({ top: 600, left: 1200, width: 300, height: 200 }, viewport, card);
    expect(p.anchored).toBe('above');
    expect(p.left).toBe(1440 - 380 - 16);
  });

  it('cible plus haute que l’écran : bulle posée en bas, sur la cible', () => {
    const p = placeTourCard({ top: 40, left: 100, width: 1200, height: 860 }, viewport, card);
    expect(p.anchored).toBe('inside');
    expect(p.top + card.height).toBeLessThanOrEqual(900);
  });

  it('téléphone : bulle en bas d’écran (ou en haut si la cible occupe le bas)', () => {
    const phone = { width: 390, height: 844 };
    expect(placeTourCard({ top: 200, left: 12, width: 366, height: 200 }, phone, card)).toMatchObject({
      anchored: 'sheet',
      top: 844 - 210 - 12,
      left: 12,
      width: 366,
    });
    expect(placeTourCard({ top: 450, left: 12, width: 366, height: 300 }, phone, card).top).toBe(12);
  });
});
