/**
 * Page de capture UX (Playwright) — désactivée hors NEXT_PUBLIC_UX_CAPTURE=1.
 * Affiche des rapports fixture déterministes (teaser ou full) sans auth.
 */
import { notFound } from 'next/navigation';

import { SelfTestCaptureClient } from '@/components/SelfKnowledge/SelfTestCaptureClient';

type Props = {
  searchParams: Promise<{
    slug?: string;
    format?: string;
    full?: string;
  }>;
};

export default async function UxCapturePage({ searchParams }: Props) {
  if (process.env.NEXT_PUBLIC_UX_CAPTURE !== '1') {
    notFound();
  }
  const sp = await searchParams;
  const slug = sp.slug === 'attachement' ? 'attachement' : 'big-five';
  const format = sp.format === 'ipip-120' ? 'ipip-120' : 'ipip-50';
  const showFull = sp.full === '1';

  return (
    <SelfTestCaptureClient slug={slug} format={format} showFull={showFull} locale="fr" />
  );
}
