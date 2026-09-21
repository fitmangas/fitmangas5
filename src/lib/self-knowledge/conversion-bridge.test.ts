/**
 * Pont de conversion public → payant (logique E2E sans DB réelle).
 * Parcours : réponses → save public (profile_id null) → CTA offre → attach email→profile_id → liste compte.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BIG_FIVE_TEST } from './ipip50';
import { buildTemplateAnalysis } from './analyze';
import { scoreSelfTest } from './scoring';
import type { LikertValue, SelfTestAnswers } from './types';

const mockFrom = vi.fn();
const mockAdmin = { from: mockFrom };

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockAdmin,
}));

import {
  attachSelfTestResultsToProfile,
  listResultsForProfile,
  normalizeSelfTestEmail,
  savePublicSelfTestResult,
} from './store';

type Row = Record<string, unknown>;

/** Mini faux store en mémoire pour simuler self_test_results + acq_contacts */
function createMemoryDb() {
  const results: Row[] = [];
  const contacts: Row[] = [];

  function chainFor(table: string) {
    let filters: Array<(r: Row) => boolean> = [];
    let pendingUpdate: Row | null = null;
    let pendingInsert: Row | null = null;
    let selectIdsOnly = false;

    const api: Record<string, unknown> = {};
    const self = () => api;

    api.select = vi.fn((cols?: string) => {
      selectIdsOnly = cols === 'id';
      return self();
    });
    api.insert = vi.fn((row: Row) => {
      pendingInsert = { ...row, id: row.id ?? `${table}-${Math.random().toString(36).slice(2, 8)}` };
      return self();
    });
    api.update = vi.fn((patch: Row) => {
      pendingUpdate = patch;
      return self();
    });
    api.eq = vi.fn((col: string, val: unknown) => {
      filters.push((r) => r[col] === val);
      return self();
    });
    api.ilike = vi.fn((col: string, val: string) => {
      const target = String(val).toLowerCase();
      filters.push((r) => String(r[col] ?? '').toLowerCase() === target);
      return self();
    });
    api.is = vi.fn((col: string, val: null) => {
      filters.push((r) => r[col] == null);
      return self();
    });
    api.order = vi.fn(() => self());
    api.limit = vi.fn(() => self());
    api.maybeSingle = vi.fn(async () => {
      if (pendingInsert) {
        const row = pendingInsert;
        pendingInsert = null;
        if (table === 'acq_contacts') contacts.push(row);
        if (table === 'self_test_results') results.push(row);
        return { data: row, error: null };
      }
      const pool = table === 'acq_contacts' ? contacts : results;
      const found = pool.find((r) => filters.every((f) => f(r))) ?? null;
      return { data: found, error: null };
    });
    const runSelect = async () => {
      if (pendingUpdate) {
        const pool = table === 'self_test_results' ? results : contacts;
        const matched = pool.filter((r) => filters.every((f) => f(r)));
        for (const r of matched) Object.assign(r, pendingUpdate);
        pendingUpdate = null;
        const data = selectIdsOnly ? matched.map((r) => ({ id: r.id })) : matched;
        filters = [];
        return { data, error: null };
      }
      const pool = table === 'acq_contacts' ? contacts : results;
      const matched = pool.filter((r) => filters.every((f) => f(r)));
      filters = [];
      return { data: matched, error: null };
    };
    Object.defineProperty(api, 'then', {
      configurable: true,
      get() {
        return (resolve: (v: unknown) => void, reject?: (e: unknown) => void) => {
          runSelect().then(resolve, reject);
        };
      },
    });

    return api;
  }

  mockFrom.mockImplementation((table: string) => chainFor(table));
  return { results, contacts };
}

function allAnswersMid(): SelfTestAnswers {
  const out: SelfTestAnswers = {};
  for (const item of BIG_FIVE_TEST.items) out[item.id] = 3;
  return out;
}

describe('normalizeSelfTestEmail', () => {
  it('trim + lower pour rattachement', () => {
    expect(normalizeSelfTestEmail('  Marie.Dupont@Email.COM ')).toBe('marie.dupont@email.com');
  });
});

describe('pont conversion public → compte (E2E logique)', () => {
  let db: ReturnType<typeof createMemoryDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = createMemoryDb();
  });

  it('1) prospecte répond → scores + teaser ; 2) stocké sans profile_id ; 3) CTA offre ; 4) attach → visible compte', async () => {
    const emailRaw = '  Prospecte.Test@FitMangas.com ';
    const email = normalizeSelfTestEmail(emailRaw);
    const answers = allAnswersMid();
    const scores = scoreSelfTest(BIG_FIVE_TEST, answers);
    const analysis = buildTemplateAnalysis(BIG_FIVE_TEST, scores, 'fr');

    // Teaser ≠ full
    expect(analysis.teaser.length).toBeGreaterThan(20);
    expect(analysis.full.length).toBeGreaterThan(analysis.teaser.length);
    expect(analysis.full).not.toBe(analysis.teaser);

    // CTA checkout existant (pas de nouvel objet Stripe)
    const trialHref = `/?offer=v-coll&utm_source=self-test&utm_campaign=big-five`;
    expect(trialHref).toContain('offer=v-coll');
    expect(trialHref).not.toContain('price_');

    const saved = await savePublicSelfTestResult({
      slug: 'big-five',
      locale: 'fr',
      email: emailRaw,
      firstName: 'Marie',
      answers,
      scores,
      analysis,
      consent: true,
      source: { utm_source: 'self-test', utm_campaign: 'big-five' },
    });

    expect(saved.ok).toBe(true);
    if (!saved.ok) return;

    expect(db.results).toHaveLength(1);
    expect(db.results[0]!.email).toBe(email);
    expect(db.results[0]!.profile_id).toBeNull();
    expect(db.results[0]!.scores).toEqual(scores);
    expect(db.results[0]!.answers).toEqual(answers);
    expect(db.contacts[0]!.tags).toEqual(expect.arrayContaining(['self-test', 'test:big-five']));
    expect(db.contacts[0]!.channel).toBe('email');

    // Inscription / paiement : même email → profile_id
    const profileId = 'user-uuid-marie';
    const attached = await attachSelfTestResultsToProfile(emailRaw, profileId);
    expect(attached).toBeGreaterThanOrEqual(1);
    expect(db.results[0]!.profile_id).toBe(profileId);

    // Visible dans /compte/connaissance-de-soi (même filtre que listResultsForProfile)
    const visibleInCompte = db.results.filter((r) => r.profile_id === profileId);
    expect(visibleInCompte).toHaveLength(1);
    expect(visibleInCompte[0]!.id).toBe(db.results[0]!.id);
    expect(visibleInCompte[0]!.analysis_full).toBeTruthy();

    // Rien perdu : answers + scores identiques
    expect(visibleInCompte[0]!.answers).toEqual(answers);
    expect(visibleInCompte[0]!.scores).toEqual(scores);

    // listResultsForProfile doit aussi les remonter (régression API)
    const listed = await listResultsForProfile(profileId);
    expect(listed.map((r) => r.id)).toContain(db.results[0]!.id);
  });

  it('attach est idempotent (2e appel = 0 nouvelle ligne liée)', async () => {
    db.results.push({
      id: 'r1',
      email: 'a@b.com',
      profile_id: null,
      answers: {},
      scores: {},
    });
    expect(await attachSelfTestResultsToProfile('a@b.com', 'u1')).toBe(1);
    expect(await attachSelfTestResultsToProfile('a@b.com', 'u1')).toBe(0);
    expect(db.results[0]!.profile_id).toBe('u1');
  });

  it('casse différente d’email : toujours rattaché', async () => {
    db.results.push({
      id: 'r2',
      email: 'mixed.case@example.com',
      profile_id: null,
      answers: { E1: 4 as LikertValue },
      scores: { E: 30 },
    });
    const n = await attachSelfTestResultsToProfile('Mixed.Case@Example.com', 'u2');
    expect(n).toBeGreaterThanOrEqual(1);
    expect(db.results[0]!.profile_id).toBe('u2');
  });
});
