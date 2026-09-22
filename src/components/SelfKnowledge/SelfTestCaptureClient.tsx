'use client';

import { SelfTestReport } from '@/components/SelfKnowledge/SelfTestReport';
import { SelfTestShell } from '@/components/SelfKnowledge/SelfTestShell';
import {
  assembleAttachmentReport,
  assembleBigFiveReport,
} from '@/lib/self-knowledge/assemble-report';
import { IPIP120_FACET_IDS, BIG_FIVE_120_TEST } from '@/lib/self-knowledge/ipip120';
import { ATTACHMENT_TEST } from '@/lib/self-knowledge/ecr-short';
import { BIG_FIVE_TEST } from '@/lib/self-knowledge/ipip50';
import type {
  BigFiveFormat,
  SelfTestLang,
  SelfTestScores,
  SelfTestSlug,
} from '@/lib/self-knowledge/types';

type Props = {
  slug: SelfTestSlug;
  format: BigFiveFormat;
  showFull: boolean;
  locale: SelfTestLang;
};

function fixtureScores(slug: SelfTestSlug, format: BigFiveFormat): SelfTestScores {
  if (slug === 'attachement') {
    return { anxiety: 5.1, avoidance: 2.4 };
  }
  const base: SelfTestScores = { E: 28, A: 34, C: 44, ES: 18, O: 36 };
  if (format === 'ipip-120') {
    for (const id of IPIP120_FACET_IDS) {
      // Pattern déterministe pour fiches lisibles
      const n = Number(id.slice(1));
      base[id] = 8 + ((n * 2) % 10);
    }
  }
  return base;
}

export function SelfTestCaptureClient({ slug, format, showFull, locale }: Props) {
  const scores = fixtureScores(slug, format);
  const test =
    slug === 'attachement'
      ? ATTACHMENT_TEST
      : format === 'ipip-120'
        ? BIG_FIVE_120_TEST
        : BIG_FIVE_TEST;
  const analysis =
    slug === 'attachement'
      ? assembleAttachmentReport(scores, locale)
      : assembleBigFiveReport(scores, locale, format);

  return (
    <SelfTestShell locale={locale}>
      <SelfTestReport
        locale={locale}
        test={test}
        scores={scores}
        analysis={analysis}
        trialHref="/?offer=v-coll&utm_source=self-test"
        hubHref="/quiz"
        showFull={showFull}
      />
    </SelfTestShell>
  );
}
