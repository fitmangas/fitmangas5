/**
 * Capture UX hub membre (Playwright) — désactivée hors NEXT_PUBLIC_UX_CAPTURE=1.
 * Sous /quiz pour rester public (layout /compte exige auth).
 */
import { notFound } from 'next/navigation';

import { HubCaptureClient } from '@/components/SelfKnowledge/compte/HubCaptureClient';

type Props = {
  searchParams: Promise<{
    section?: string;
    filled?: string;
  }>;
};

const SECTIONS = new Set([
  'evolution',
  'progression',
  'tests',
  'corps',
  'developpement',
]);

export default async function MemberHubUxCapturePage({ searchParams }: Props) {
  if (process.env.NEXT_PUBLIC_UX_CAPTURE !== '1') {
    notFound();
  }
  const sp = await searchParams;
  const section = SECTIONS.has(sp.section ?? '') ? (sp.section as string) : 'evolution';
  const filled = sp.filled === '1';

  return <HubCaptureClient section={section} filled={filled} />;
}
