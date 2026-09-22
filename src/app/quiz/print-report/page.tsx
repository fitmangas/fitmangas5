/**
 * Page print-only du rapport complet — utilisée par Chromium (API PDF + captures).
 * Banque déterministe : scores → assemble-report.
 */
import { SelfTestCaptureClient } from '@/components/SelfKnowledge/SelfTestCaptureClient';
import type { BigFiveFormat, SelfTestLang, SelfTestScores, SelfTestSlug } from '@/lib/self-knowledge/types';

type Props = {
  searchParams: Promise<{
    slug?: string;
    format?: string;
    locale?: string;
    scores?: string;
    balanced?: string;
  }>;
};

function parseScores(raw: string | undefined): SelfTestScores | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const out: SelfTestScores = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

export default async function PrintReportPage({ searchParams }: Props) {
  const sp = await searchParams;
  const slug: SelfTestSlug = sp.slug === 'attachement' ? 'attachement' : 'big-five';
  const format: BigFiveFormat = sp.format === 'ipip-120' ? 'ipip-120' : 'ipip-50';
  const locale: SelfTestLang = sp.locale === 'es' ? 'es' : 'fr';
  const scores = parseScores(sp.scores);
  const balanced = sp.balanced === '1';

  return (
    <SelfTestCaptureClient
      slug={slug}
      format={format}
      showFull
      locale={locale}
      balanced={balanced}
      scoresOverride={scores ?? undefined}
      printMode
    />
  );
}
