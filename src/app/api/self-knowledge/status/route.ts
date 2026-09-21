import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/api-auth';
import { getLatestHealthConsent, listResultsForProfile } from '@/lib/self-knowledge/store';
import { SELF_TEST_SLUGS } from '@/lib/self-knowledge/scoring';

export async function GET() {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  const [results, consent] = await Promise.all([
    listResultsForProfile(auth.user.id),
    getLatestHealthConsent(auth.user.id),
  ]);

  const completedSlugs = new Set(results.map((r) => r.test_slug));

  return NextResponse.json({
    ok: true,
    tests: SELF_TEST_SLUGS.map((slug) => ({
      slug,
      completed: completedSlugs.has(slug),
      lastAt: results.find((r) => r.test_slug === slug)?.created_at ?? null,
    })),
    healthConsent: consent
      ? { id: consent.id, version: consent.version, consentedAt: consent.consented_at }
      : null,
    resultsCount: results.length,
  });
}
