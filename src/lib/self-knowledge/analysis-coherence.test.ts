import { describe, expect, it, vi, afterEach } from 'vitest';

import { ATTACHMENT_TEST } from './ecr-short';
import { BIG_FIVE_TEST } from './ipip50';
import { buildTemplateAnalysis, generateSelfTestAnalysis } from './analyze';

describe('analyse — teaser vs full + cas extrêmes', () => {
  it('teaser plus court que full ; distinct', () => {
    const a = buildTemplateAnalysis(
      BIG_FIVE_TEST,
      { E: 30, A: 30, C: 30, ES: 30, O: 30 },
      'fr',
    );
    expect(a.teaser.length).toBeLessThan(a.full.length);
    expect(a.full).not.toEqual(a.teaser);
    expect(a.portrait?.name).toBeTruthy();
    expect(a.sections?.whoYouAre).toMatch(/Extraversion|calme|collectif/i);
  });

  it('tous scores hauts (dont ES) : pas de langage « anxiété » contradictoire', () => {
    const high = { E: 48, A: 48, C: 48, ES: 48, O: 48 };
    const a = buildTemplateAnalysis(BIG_FIVE_TEST, high, 'fr');
    expect(a.full.toLowerCase()).toMatch(/stabilité|stable|sérénité|calme/);
    expect(a.full.toLowerCase()).not.toMatch(/stabilité émotionnelle.*anxiété|es haute.*anxiété/);
    expect(a.sections?.forces.length).toBe(5);
  });

  it('ES basse : évoque le stress / être vue, pas « calme »', () => {
    const lowEs = { E: 30, A: 30, C: 30, ES: 12, O: 30 };
    const a = buildTemplateAnalysis(BIG_FIVE_TEST, lowEs, 'fr');
    const text = `${a.sections?.limits.join(' ')} ${a.full}`.toLowerCase();
    expect(text).toMatch(/stress|pression|accompagn|signal/);
    expect(text).not.toMatch(/stabilité émotionnelle plutôt haute/);
  });

  it('ECR anxiété haute / évitement bas : cohérent', () => {
    const a = buildTemplateAnalysis(ATTACHMENT_TEST, { anxiety: 6.2, avoidance: 2.0 }, 'fr');
    expect(a.full).toMatch(/6\.2\/7|Anxiété/);
    expect(a.full).toMatch(/2\/7|Évitement/);
    expect(a.strengths.length).toBeGreaterThanOrEqual(1);
  });

  it('tous bas Big Five : génère sans throw', async () => {
    const a = await generateSelfTestAnalysis(
      BIG_FIVE_TEST,
      { E: 10, A: 10, C: 10, ES: 10, O: 10 },
      'fr',
    );
    expect(a.teaser).toBeTruthy();
    expect(a.full).toBeTruthy();
    expect(a.mode).toMatch(/template|claude/);
  });

  it('profil mixte : génère sans throw', async () => {
    const a = await generateSelfTestAnalysis(
      BIG_FIVE_TEST,
      { E: 12, A: 40, C: 45, ES: 18, O: 42 },
      'es',
    );
    expect(a.full.length).toBeGreaterThan(a.teaser.length);
  });
});

describe('analyse Claude fallback extrêmes', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('sans clé : template OK sur extrêmes', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    for (const scores of [
      { E: 50, A: 50, C: 50, ES: 50, O: 50 },
      { E: 10, A: 10, C: 10, ES: 10, O: 10 },
      { E: 10, A: 50, C: 10, ES: 50, O: 10 },
    ]) {
      const a = await generateSelfTestAnalysis(BIG_FIVE_TEST, scores, 'fr');
      expect(a.mode).toBe('template');
      expect(a.teaser.length).toBeGreaterThan(10);
    }
  });
});
