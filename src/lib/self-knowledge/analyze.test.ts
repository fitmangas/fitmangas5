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
    expect(analysis.full).toMatch(/Portrait|Ouverture|Stabilité|Conscience/i);
    expect(analysis.sourceBadge).toMatch(/Banque|Banco/);
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

  it('flag Claude OFF (défaut) → toujours banque même avec clé', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test-fake');
    vi.stubEnv('SELF_TEST_CLAUDE_ANALYSIS', '');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const analysis = await generateSelfTestAnalysis(
      BIG_FIVE_TEST,
      { O: 30, C: 30, E: 30, A: 30, ES: 30 },
      'fr',
    );
    expect(analysis.mode).toBe('template');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('si Claude échoue (HTTP 500) → template, pas d’exception', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test-fake');
    vi.stubEnv('SELF_TEST_CLAUDE_ANALYSIS', '1');
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

  it('si Claude répond JSON valide dans la banque → mode claude (flag ON)', async () => {
    const scores = { O: 40, C: 30, E: 30, A: 30, ES: 20 };
    const assembled = buildTemplateAnalysis(BIG_FIVE_TEST, scores, 'fr');
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test-fake');
    vi.stubEnv('SELF_TEST_CLAUDE_ANALYSIS', '1');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                teaser: `${assembled.portrait!.name} — ${assembled.teaser.slice(0, 120)}`,
                full: assembled.full,
                strengths: assembled.strengths.slice(0, 2),
              }),
            },
          ],
        }),
      ),
    );
    const analysis = await generateSelfTestAnalysis(BIG_FIVE_TEST, scores, 'fr');
    expect(analysis.mode).toBe('claude');
    expect(analysis.teaser).toContain(assembled.portrait!.name);
    expect(analysis.sourceBadge).toMatch(/Claude/);
  });
});
