import { notFound } from 'next/navigation';

import { isDevPreviewEnabled } from '@/lib/dev/preview-guard';

import { PREVIEWS } from '../registry';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function DevPreviewScreen({ params }: { params: Promise<{ ecran: string }> }) {
  if (!isDevPreviewEnabled()) notFound();
  const { ecran } = await params;
  const entry = PREVIEWS.find((p) => p.slug === ecran);
  if (!entry) notFound();
  return <>{entry.render()}</>;
}
