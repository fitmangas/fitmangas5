import { describe, expect, it } from 'vitest';

import { assertAnalysisWithinBank, buildTemplateAnalysis } from './analyze';
import {
  assembleAttachmentReport,
  assembleBigFiveReport,
  normalizePhrase,
  selectTraitBundle,
} from './assemble-report';
import { BIG_FIVE_TRAIT_BANK, bandFromTraitScore } from './banks/big-five-traits';
import { BIG_FIVE_FACET_BANK, FACET_IDS, bandFromFacetScore } from './banks/big-five-facets';
import { BIG_FIVE_120_TEST } from './ipip120';
import { BIG_FIVE_TEST } from './ipip50';
import { ATTACHMENT_TEST } from './ecr-short';
import { scoreSelfTest } from './scoring';
import type { SelfTestAnswers, SelfTestScores } from './types';

function allMid50(): SelfTestScores {
  return { E: 30, A: 30, C: 30, ES: 30, O: 30 };
}

function highCLowEs(): SelfTestScores {
  return { E: 28, A: 32, C: 45, ES: 18, O: 30 };
}

describe('banque Big Five traits', () => {
  it('couvre 5 traits × 3 niveaux (narrative + force + limit FR/ES)', () => {
    const keys = ['E', 'A', 'C', 'ES', 'O'] as const;
    for (const k of keys) {
      for (const level of ['low', 'mid', 'high'] as const) {
        const cell = BIG_FIVE_TRAIT_BANK[k][level];
        expect(cell.narrative.fr.length).toBeGreaterThan(40);
        expect(cell.narrative.es.length).toBeGreaterThan(40);
        expect(cell.force.fr.length).toBeGreaterThan(10);
        expect(cell.limit.fr.length).toBeGreaterThan(10);
      }
    }
  });

  it('bandFromTraitScore respecte low/mid/high', () => {
    expect(bandFromTraitScore(20)).toBe('low');
    expect(bandFromTraitScore(30)).toBe('mid');
    expect(bandFromTraitScore(40)).toBe('high');
  });
});

describe('banque facettes IPIP-120', () => {
  it('couvre 30 facettes × 3 niveaux', () => {
    expect(FACET_IDS).toHaveLength(30);
    for (const id of FACET_IDS) {
      for (const level of ['low', 'mid', 'high'] as const) {
        const cell = BIG_FIVE_FACET_BANK[id][level];
        expect(cell.narrative.fr.length).toBeGreaterThan(15);
        expect(cell.narrative.es.length).toBeGreaterThan(15);
      }
    }
  });

  it('bandFromFacetScore', () => {
    expect(bandFromFacetScore(8)).toBe('low');
    expect(bandFromFacetScore(12)).toBe('mid');
    expect(bandFromFacetScore(16)).toBe('high');
  });
});

describe('assembleBigFiveReport', () => {
  it('produit portrait + sections riches sans IA (ipip-50)', () => {
    const report = assembleBigFiveReport(highCLowEs(), 'fr', 'ipip-50');
    expect(report.mode).toBe('template');
    expect(report.portrait?.name).toBeTruthy();
    expect(report.teaser).toContain(report.portrait!.name);
    expect(report.sections?.whoYouAre.length).toBeGreaterThan(80);
    expect(report.sections?.forces.length).toBeGreaterThanOrEqual(2);
    expect(report.sections?.limits.length).toBeGreaterThanOrEqual(2);
    expect(report.full.length).toBeGreaterThan(200);
    expect(report.sourceBadge).toMatch(/Banque/);
    expect(report.instrumentVersion).toBe('ipip-50');
    // Tenace sous pression = C high + ES low
    expect(report.portrait!.name).toMatch(/Tenace/i);
  });

  it('teaser ES non vide et désirable', () => {
    const report = assembleBigFiveReport(allMid50(), 'es', 'ipip-50');
    expect(report.teaser.length).toBeGreaterThan(60);
    expect(report.portrait?.name).toBeTruthy();
    expect(report.strengths.length).toBeGreaterThanOrEqual(1);
  });

  it('profil équilibré = La Polyvalente + force', () => {
    const report = assembleBigFiveReport(allMid50(), 'fr', 'ipip-50');
    expect(report.portrait!.name).toMatch(/Polyvalente/i);
    expect(report.sections!.whoYouAre).toMatch(/polyvalence/i);
    expect(report.sections!.howYouWork).not.toBe(report.sections!.whoYouAre);
  });

  it('aucune phrase dupliquée entre who / how / combinations', () => {
    const report = assembleBigFiveReport(highCLowEs(), 'fr', 'ipip-50');
    const chunks = [
      report.sections!.whoYouAre,
      report.sections!.howYouWork,
      ...report.sections!.combinations,
    ];
    const norms = chunks.map(normalizePhrase).filter(Boolean);
    const seen = new Set<string>();
    for (const n of norms) {
      for (const s of seen) {
        expect(s === n || s.includes(n) || n.includes(s)).toBe(false);
      }
      seen.add(n);
    }
  });

  it('ipip-120 ajoute facettes quand scores présents', () => {
    const scores: SelfTestScores = { ...highCLowEs() };
    for (const id of FACET_IDS) scores[id] = 12;
    const report = assembleBigFiveReport(scores, 'fr', 'ipip-120');
    expect(report.sections?.facets?.length).toBe(30);
    expect(report.instrumentVersion).toBe('ipip-120');
  });
});

describe('assembleAttachmentReport', () => {
  it('portrait + sections complètes', () => {
    const report = assembleAttachmentReport({ anxiety: 5.2, avoidance: 2.1 }, 'fr');
    expect(report.portrait?.name).toBeTruthy();
    expect(report.sections?.whoYouAre.length).toBeGreaterThan(40);
    expect(report.sections?.forces.length).toBeGreaterThanOrEqual(2);
    expect(report.full.length).toBeGreaterThan(100);
    expect(report.teaser.length).toBeGreaterThan(40);
  });

  it('forces toujours remplies (tous bandes)', () => {
    for (const anxiety of [1.5, 3.5, 6.2]) {
      for (const avoidance of [1.5, 3.5, 6.2]) {
        const report = assembleAttachmentReport({ anxiety, avoidance }, 'fr');
        expect(report.sections?.forces.length).toBeGreaterThanOrEqual(1);
        expect(report.sections!.forces.every((f) => f.trim().length > 8)).toBe(true);
      }
    }
  });
});

describe('assertAnalysisWithinBank (IA bornée)', () => {
  it('rejette une invention hors banque (portrait + forces inventés)', () => {
    const assembled = assembleBigFiveReport(highCLowEs(), 'fr', 'ipip-50');
    const ok = assertAnalysisWithinBank(assembled, {
      teaser: 'Tu es La Guerrière Cosmique du Pilates.',
      full: 'Profil inventé : tu détestes le collectif et tu es un homme.',
      strengths: ['Force inventée magique', 'Super-pouvoir alien'],
    });
    expect(ok).toBe(false);
  });

  it('accepte une reformulation qui garde le portrait et les forces', () => {
    const assembled = assembleBigFiveReport(highCLowEs(), 'fr', 'ipip-50');
    const ok = assertAnalysisWithinBank(assembled, {
      teaser: `${assembled.portrait!.name} — ${assembled.strengths[0]}`,
      full: `${assembled.portrait!.name}. ${assembled.sections!.whoYouAre}`,
      strengths: assembled.strengths.slice(0, 2),
    });
    expect(ok).toBe(true);
  });
});

describe('fallback sans clé = analyse complète', () => {
  it('buildTemplateAnalysis big-five n’est pas un teaser pauvre', () => {
    const a = buildTemplateAnalysis(BIG_FIVE_TEST, highCLowEs(), 'fr');
    expect(a.full.length).toBeGreaterThan(a.teaser.length);
    expect(a.sections?.whoYouAre).toBeTruthy();
    expect(a.portrait?.disclaimer).toMatch(/600\s*000/i);
  });

  it('buildTemplateAnalysis attachement complet', () => {
    const a = buildTemplateAnalysis(
      ATTACHMENT_TEST,
      { anxiety: 3, avoidance: 3 },
      'es'
    );
    expect(a.full.length).toBeGreaterThan(80);
    expect(a.portrait?.name).toBeTruthy();
  });
});

describe('parcours scoring IPIP-120', () => {
  it('120 items → 30 facettes 4–20 + 5 traits 10–50', () => {
    const answers: SelfTestAnswers = {};
    for (const item of BIG_FIVE_120_TEST.items) {
      answers[item.id] = item.reverse ? 1 : 5;
    }
    const scores = scoreSelfTest(BIG_FIVE_120_TEST, answers);
    for (const id of FACET_IDS) {
      expect(scores[id]).toBeGreaterThanOrEqual(4);
      expect(scores[id]).toBeLessThanOrEqual(20);
    }
    for (const k of ['E', 'A', 'C', 'ES', 'O'] as const) {
      expect(scores[k]).toBeGreaterThanOrEqual(10);
      expect(scores[k]).toBeLessThanOrEqual(50);
    }
  });

  it('IPIP-50 inchangé (10 items/trait)', () => {
    const answers: SelfTestAnswers = {};
    for (const item of BIG_FIVE_TEST.items) {
      // Valeur « alignée » : 5 si +keyed, 1 si −keyed → contribution 5 partout
      answers[item.id] = item.reverse ? 1 : 5;
    }
    const scores = scoreSelfTest(BIG_FIVE_TEST, answers);
    expect(Object.keys(scores).sort()).toEqual(['A', 'C', 'E', 'ES', 'O'].sort());
    expect(scores.E).toBe(50);
  });
});

describe('selectTraitBundle cohérence portrait', () => {
  it('bundles reflètent les bandes', () => {
    const bundles = selectTraitBundle(highCLowEs(), 'fr');
    const c = bundles.find((b) => b.key === 'C')!;
    const es = bundles.find((b) => b.key === 'ES')!;
    expect(c.band).toBe('high');
    expect(es.band).toBe('low');
  });
});
