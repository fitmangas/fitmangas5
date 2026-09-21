import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildTemplateAnalysis, generateSelfTestAnalysis } from './analyze';
import { BIG_FIVE_TEST } from './ipip50';
import { ATTACHMENT_TEST } from './ecr-short';

describe('analyse template (sans Claude)', () => {
  it('produit teaser + full + strengths en FR', () => {
    const analysis = buildTemplateAnalysis(BIG_FIVE_TEST, { O: 40, C: 35, E: 28, A: 32, ES: 22 }, 'fr');
    expect(analysis.mode).toBe('template');
    expect(analysis.teaser.length).toBeGreaterThan(40);
    expect(analysis.full.length).toBeGreaterThan(80);
    expect(analysis.strengths.length).toBeGreaterThanOrEqual(1);
    expect(analysis.full).toMatch(/indicatif|FitMangas|Ouverture|Stabilité|Conscience/i);
  });

  it('produit analyse attachement ES', () => {
    const analysis = buildTemplateAnalysis(ATTACHMENT_TEST, { anxiety: 2.1, avoidance: 3.5 }, 'es');
    expect(analysis.mode).toBe('template');
    expect(analysis.teaser.length).toBeGreaterThan(20);
    expect(analysis.full).toMatch(/FitMangas|apego|Evitación/i);
  });
});

describe('generateSelfTestAnalysis — jamais bloquant', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('sans ANTHROPIC_API_KEY → fallback template', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const analysis = await generateSelfTestAnalysis(
      BIG_FIVE_TEST,
      { O: 30, C: 30, E: 30, A: 30, ES: 30 },
      'fr',
    );
    expect(analysis.mode).toBe('template');
    expect(analysis.teaser).toBeTruthy();
  });

  it('si Claude échoue (HTTP 500) → template, pas d’exception', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test-fake');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('err', { status: 500 })),
    );
    const analysis = await generateSelfTestAnalysis(
      BIG_FIVE_TEST,
      { O: 30, C: 30, E: 30, A: 30, ES: 30 },
      'fr',
    );
    expect(analysis.mode).toBe('template');
  });

  it('si Claude répond JSON valide → mode claude', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test-fake');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                teaser: 'Teaser Claude test.',
                full: 'Analyse complète Claude pour les tests.',
                strengths: ['Force A', 'Force B'],
              }),
            },
          ],
        }),
      ),
    );
    const analysis = await generateSelfTestAnalysis(
      BIG_FIVE_TEST,
      { O: 40, C: 30, E: 30, A: 30, ES: 20 },
      'fr',
    );
    expect(analysis.mode).toBe('claude');
    expect(analysis.teaser).toContain('Teaser Claude');
    expect(analysis.strengths).toEqual(['Force A', 'Force B']);
  });
});
